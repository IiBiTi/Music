/**
 * نظام تبديل المنصة التلقائي
 * هذا الملف يوفر آلية لتبديل منصة التشغيل تلقائيًا في حالة حدوث أخطاء
 */

const config = require('../../config/config');

class PlatformSwitcher {
    constructor(bot) {
        this.bot = bot;
        this.errorCounts = {
            youtube: 0,
            spotify: 0,
            soundcloud: 0
        };
        this.errorThreshold = 3; // عدد الأخطاء قبل تبديل المنصة تلقائيًا
        this.resetInterval = 30 * 60 * 1000; // إعادة تعيين عداد الأخطاء كل 30 دقيقة
        
        // بدء مؤقت إعادة تعيين عداد الأخطاء
        this.resetTimer = setInterval(() => this.resetErrorCounts(), this.resetInterval);
    }

    // تسجيل خطأ لمنصة معينة
    logError(platform) {
        if (this.errorCounts[platform] !== undefined) {
            this.errorCounts[platform]++;
            console.log(`[PlatformSwitcher] تم تسجيل خطأ لمنصة ${platform}. عدد الأخطاء: ${this.errorCounts[platform]}`);
            
            // التحقق من تجاوز عتبة الأخطاء
            if (this.errorCounts[platform] >= this.errorThreshold) {
                return this.switchToNextPlatform(platform);
            }
        }
        return false;
    }

    // إعادة تعيين عداد الأخطاء
    resetErrorCounts() {
        for (const platform in this.errorCounts) {
            this.errorCounts[platform] = 0;
        }
        console.log('[PlatformSwitcher] تم إعادة تعيين عداد الأخطاء.');
    }

    // تبديل المنصة إلى المنصة التالية
    switchToNextPlatform(currentPlatform) {
        // الحصول على قائمة المنصات المفعلة
        const enabledPlatforms = [];
        for (const platform in config.platforms) {
            if (config.platforms[platform].enabled && platform !== currentPlatform) {
                enabledPlatforms.push({
                    name: platform,
                    priority: config.platforms[platform].priority
                });
            }
        }
        
        // إذا لم تكن هناك منصات أخرى مفعلة
        if (enabledPlatforms.length === 0) {
            console.log('[PlatformSwitcher] لا توجد منصات بديلة مفعلة.');
            return false;
        }
        
        // ترتيب المنصات حسب الأولوية
        enabledPlatforms.sort((a, b) => a.priority - b.priority);
        
        // اختيار المنصة التالية
        const nextPlatform = enabledPlatforms[0].name;
        
        // تبديل المنصة
        const success = this.bot.switchPlatform(nextPlatform);
        
        if (success) {
            console.log(`[PlatformSwitcher] تم تبديل المنصة من ${currentPlatform} إلى ${nextPlatform}.`);
            
            // إعادة تعيين عداد الأخطاء للمنصة الجديدة
            this.errorCounts[nextPlatform] = 0;
            
            return {
                success: true,
                oldPlatform: currentPlatform,
                newPlatform: nextPlatform
            };
        } else {
            console.log(`[PlatformSwitcher] فشل تبديل المنصة من ${currentPlatform} إلى ${nextPlatform}.`);
            return false;
        }
    }

    // تحليل رسالة الخطأ لتحديد المنصة المتأثرة
    analyzeErrorMessage(error) {
        const errorMessage = error.message || '';
        
        if (errorMessage.toLowerCase().includes('youtube') || 
            errorMessage.toLowerCase().includes('yt-dlp') || 
            errorMessage.toLowerCase().includes('video id')) {
            return 'youtube';
        } else if (errorMessage.toLowerCase().includes('spotify') || 
                  errorMessage.toLowerCase().includes('track id')) {
            return 'spotify';
        } else if (errorMessage.toLowerCase().includes('soundcloud')) {
            return 'soundcloud';
        }
        
        // إذا لم يتم التعرف على المنصة، استخدم المنصة الحالية
        return this.bot.currentPlatform;
    }

    // معالجة خطأ وتبديل المنصة إذا لزم الأمر
    handleError(error, channel) {
        // تحليل رسالة الخطأ لتحديد المنصة المتأثرة
        const platform = this.analyzeErrorMessage(error);
        
        // تسجيل الخطأ
        const switchResult = this.logError(platform);
        
        // إذا تم تبديل المنصة، إرسال إشعار
        if (switchResult && switchResult.success && channel) {
            const message = `⚠️ **تم اكتشاف مشكلات متكررة في منصة ${switchResult.oldPlatform}.**\n` +
                           `🔄 **تم التبديل تلقائيًا إلى منصة ${switchResult.newPlatform}.**\n` +
                           `ℹ️ يمكنك العودة إلى المنصة السابقة باستخدام الأمر: \`${this.bot.options.prefix}platform ${switchResult.oldPlatform}\``;
            
            if (this.bot.options.embedEnabled) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('تبديل المنصة التلقائي')
                    .setDescription(message)
                    .setTimestamp();
                
                channel.send({ embeds: [embed] });
            } else {
                channel.send(message);
            }
        }
        
        return switchResult;
    }

    // إيقاف نظام تبديل المنصة
    stop() {
        if (this.resetTimer) {
            clearInterval(this.resetTimer);
            this.resetTimer = null;
        }
    }
}

module.exports = PlatformSwitcher;
