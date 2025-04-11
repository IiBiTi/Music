/**
 * ربط نظام الاشتراكات بنظام البوتات المتعددة
 * هذا الملف يوفر واجهة للتحقق من صلاحية الاشتراكات عند إنشاء البوتات
 */

const SubscriptionManager = require('./subscriptionManager');
const { MusicBot } = require('../index');

class SubscriptionBotManager {
    constructor() {
        this.subscriptionManager = new SubscriptionManager();
        this.mainGuildId = null; // سيتم تعيينه عند التهيئة
        this.bots = new Map();
    }

    // تعيين السيرفر الرئيسي للإدارة
    setMainGuild(guildId) {
        this.mainGuildId = guildId;
        console.log(`[SubscriptionBotManager] تم تعيين السيرفر الرئيسي للإدارة: ${guildId}`);
    }

    // التحقق من صلاحية الاشتراك
    isSubscriptionValid(userId, guildId) {
        return this.subscriptionManager.isSubscriptionValid(userId, guildId);
    }

    // التحقق من صلاحية توكن البوت
    isBotTokenValid(botToken) {
        return this.subscriptionManager.isBotTokenValid(botToken);
    }

    // إنشاء بوت جديد مع التحقق من الاشتراك
    async createBot(userId, guildId, token, options = {}) {
        // التحقق من أن السيرفر الرئيسي للإدارة تم تعيينه
        if (!this.mainGuildId) {
            throw new Error('لم يتم تعيين السيرفر الرئيسي للإدارة بعد.');
        }

        // التحقق من صلاحية الاشتراك
        if (!this.isSubscriptionValid(userId, this.mainGuildId)) {
            throw new Error('الاشتراك غير صالح أو منتهي الصلاحية.');
        }

        // الحصول على الاشتراك
        const subscription = this.subscriptionManager.getSubscription(userId, this.mainGuildId);
        
        // الحصول على معلومات الخطة
        const plan = this.subscriptionManager.getPlanByName(subscription.plan_type);
        
        // التحقق من عدد البوتات
        const botTokens = JSON.parse(subscription.bot_tokens || '[]');
        if (botTokens.length >= plan.max_bots) {
            throw new Error(`لقد وصلت إلى الحد الأقصى لعدد البوتات (${plan.max_bots}) في خطتك الحالية.`);
        }

        // إضافة التوكن إلى الاشتراك
        const addResult = this.subscriptionManager.addBotToken(userId, this.mainGuildId, token);
        if (!addResult.success) {
            throw new Error(`فشل إضافة توكن البوت: ${addResult.message}`);
        }

        try {
            // إنشاء البوت
            const bot = new MusicBot(token, options);
            
            // تحميل الأوامر والأحداث
            bot.loadCommands().loadEvents();
            
            // تشغيل البوت
            bot.start();
            
            // إضافة البوت إلى القائمة
            this.bots.set(token, {
                bot,
                userId,
                guildId: this.mainGuildId
            });
            
            return bot;
        } catch (error) {
            // إزالة التوكن من الاشتراك في حالة فشل إنشاء البوت
            this.subscriptionManager.removeBotToken(userId, this.mainGuildId, token);
            throw error;
        }
    }

    // إيقاف وإزالة بوت
    removeBot(userId, token) {
        // التحقق من وجود البوت
        const botInfo = this.bots.get(token);
        if (!botInfo) {
            throw new Error('البوت غير موجود.');
        }

        // التحقق من ملكية البوت
        if (botInfo.userId !== userId) {
            throw new Error('ليس لديك صلاحية لإزالة هذا البوت.');
        }

        try {
            // إيقاف البوت
            botInfo.bot.client.destroy();
            
            // إزالة البوت من القائمة
            this.bots.delete(token);
            
            // إزالة التوكن من الاشتراك
            this.subscriptionManager.removeBotToken(userId, this.mainGuildId, token);
            
            return true;
        } catch (error) {
            console.error('فشل إزالة البوت:', error);
            throw error;
        }
    }

    // الحصول على جميع بوتات المستخدم
    getUserBots(userId) {
        const userBots = [];
        
        for (const [token, botInfo] of this.bots.entries()) {
            if (botInfo.userId === userId) {
                userBots.push({
                    token,
                    bot: botInfo.bot
                });
            }
        }
        
        return userBots;
    }

    // الحصول على بوت بواسطة التوكن
    getBot(token) {
        const botInfo = this.bots.get(token);
        return botInfo ? botInfo.bot : null;
    }

    // الحصول على جميع البوتات
    getAllBots() {
        return Array.from(this.bots.values()).map(botInfo => botInfo.bot);
    }

    // تحديث إعدادات بوت معين
    updateBotSettings(userId, token, settings) {
        // التحقق من وجود البوت
        const botInfo = this.bots.get(token);
        if (!botInfo) {
            throw new Error('البوت غير موجود.');
        }

        // التحقق من ملكية البوت
        if (botInfo.userId !== userId) {
            throw new Error('ليس لديك صلاحية لتحديث إعدادات هذا البوت.');
        }

        // تحديث إعدادات البوت
        botInfo.bot.options = {
            ...botInfo.bot.options,
            ...settings
        };
        
        return true;
    }

    // تحديث إعدادات جميع بوتات المستخدم
    updateAllUserBotsSettings(userId, settings) {
        const userBots = this.getUserBots(userId);
        
        for (const { bot } of userBots) {
            bot.options = {
                ...bot.options,
                ...settings
            };
        }
        
        return true;
    }

    // إغلاق اتصال قاعدة البيانات
    close() {
        if (this.subscriptionManager) {
            this.subscriptionManager.close();
        }
    }
}

module.exports = SubscriptionBotManager;
