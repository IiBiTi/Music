/**
 * مدير البوتات المتعددة
 * يوفر واجهة للتعامل مع البوتات المتعددة في المشروع
 */

const { MusicBot, BotManager } = require('../index');
const config = require('../../config/config');
const fs = require('fs');
const path = require('path');

// إنشاء نسخة واحدة من مدير البوتات
const botManagerInstance = new BotManager();

class MultiBotManager {
    constructor() {
        // استخدام النسخة الموجودة من مدير البوتات
        this.botManager = botManagerInstance;
        
        // تحميل البوتات المحفوظة
        this.loadSavedBots();
    }
    
    // تحميل البوتات المحفوظة من الملف
    loadSavedBots() {
        try {
            const botsConfigPath = path.join(__dirname, '../../config/bots.json');
            
            // التحقق من وجود ملف التكوين
            if (fs.existsSync(botsConfigPath)) {
                const botsConfig = JSON.parse(fs.readFileSync(botsConfigPath, 'utf8'));
                
                // إنشاء البوتات المحفوظة
                for (const botConfig of botsConfig) {
                    try {
                        this.createBot(botConfig.token, botConfig.options);
                        console.log(`تم تحميل البوت: ${botConfig.token.substring(0, 10)}...`);
                    } catch (error) {
                        console.error(`فشل تحميل البوت: ${botConfig.token.substring(0, 10)}...`, error);
                    }
                }
                
                console.log(`تم تحميل ${botsConfig.length} بوت من ملف التكوين.`);
            } else {
                console.log('لم يتم العثور على ملف تكوين البوتات. سيتم إنشاء ملف جديد عند إضافة بوت.');
            }
        } catch (error) {
            console.error('فشل تحميل البوتات المحفوظة:', error);
        }
    }
    
    // حفظ البوتات الحالية إلى ملف
    saveBots() {
        try {
            const botsConfigPath = path.join(__dirname, '../../config/bots.json');
            const botsConfig = [];
            
            // جمع معلومات البوتات
            for (const [token, bot] of this.botManager.bots.entries()) {
                botsConfig.push({
                    token,
                    options: bot.options
                });
            }
            
            // حفظ المعلومات إلى ملف
            fs.writeFileSync(botsConfigPath, JSON.stringify(botsConfig, null, 2));
            console.log(`تم حفظ ${botsConfig.length} بوت إلى ملف التكوين.`);
            
            return true;
        } catch (error) {
            console.error('فشل حفظ البوتات:', error);
            return false;
        }
    }
    
    // إنشاء بوت جديد
    async createBot(token, options = {}) {
        try {
            // إنشاء البوت
            const bot = this.botManager.createBot(token, options);
            
            // حفظ البوتات بعد الإضافة
            this.saveBots();
            
            return bot;
        } catch (error) {
            console.error('فشل إنشاء البوت:', error);
            throw error;
        }
    }
    
    // الحصول على بوت بواسطة التوكن
    getBot(token) {
        return this.botManager.getBot(token);
    }
    
    // الحصول على البوت النشط
    getActiveBot() {
        return this.botManager.getActiveBot();
    }
    
    // تعيين البوت النشط
    setActiveBot(token) {
        const result = this.botManager.setActiveBot(token);
        
        // حفظ البوتات بعد تغيير البوت النشط
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // الحصول على جميع البوتات
    getAllBots() {
        return this.botManager.getAllBots();
    }
    
    // الحصول على قائمة معلومات جميع البوتات
    getAllBotsInfo() {
        return this.botManager.getAllBotsInfo();
    }
    
    // إزالة بوت
    removeBot(token) {
        const result = this.botManager.removeBot(token);
        
        // حفظ البوتات بعد الإزالة
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // تحديث إعدادات بوت معين
    updateBotSettings(token, settings) {
        const result = this.botManager.updateBotSettings(token, settings);
        
        // حفظ البوتات بعد تحديث الإعدادات
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // تحديث إعدادات جميع البوتات
    updateAllBotsSettings(settings) {
        const result = this.botManager.updateAllBotsSettings(settings);
        
        // حفظ البوتات بعد تحديث الإعدادات
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // تغيير المنصة لبوت معين
    switchPlatform(token, platform) {
        return this.botManager.switchPlatform(token, platform);
    }
    
    // تغيير المنصة لجميع البوتات
    switchPlatformForAllBots(platform) {
        return this.botManager.switchPlatformForAllBots(platform);
    }
    
    // تغيير اسم بوت معين
    async changeBotUsername(token, newUsername) {
        return await this.botManager.changeBotUsername(token, newUsername);
    }
    
    // تغيير اسم جميع البوتات
    async changeAllBotsUsername(newUsername) {
        return await this.botManager.changeAllBotsUsername(newUsername);
    }
    
    // تغيير صورة بوت معين
    async changeBotAvatar(token, avatarURL) {
        return await this.botManager.changeBotAvatar(token, avatarURL);
    }
    
    // تغيير صورة جميع البوتات
    async changeAllBotsAvatar(avatarURL) {
        return await this.botManager.changeAllBotsAvatar(avatarURL);
    }
    
    // تفعيل/تعطيل نظام الأزرار لبوت معين
    toggleButtons(token, enabled) {
        const result = this.botManager.toggleButtons(token, enabled);
        
        // حفظ البوتات بعد تغيير الإعدادات
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // تفعيل/تعطيل نظام الأزرار لجميع البوتات
    toggleButtonsForAllBots(enabled) {
        const result = this.botManager.toggleButtonsForAllBots(enabled);
        
        // حفظ البوتات بعد تغيير الإعدادات
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // تفعيل/تعطيل نظام الإمبيد لبوت معين
    toggleEmbed(token, enabled) {
        const result = this.botManager.toggleEmbed(token, enabled);
        
        // حفظ البوتات بعد تغيير الإعدادات
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // تفعيل/تعطيل نظام الإمبيد لجميع البوتات
    toggleEmbedForAllBots(enabled) {
        const result = this.botManager.toggleEmbedForAllBots(enabled);
        
        // حفظ البوتات بعد تغيير الإعدادات
        if (result) {
            this.saveBots();
        }
        
        return result;
    }
    
    // إيقاف جميع البوتات
    stopAllBots() {
        return this.botManager.stopAllBots();
    }
}

module.exports = MultiBotManager;
