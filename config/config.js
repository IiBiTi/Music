/**
 * ملف التكوين الرئيسي لمشروع بوت الميوزك متعدد البوتات
 */

module.exports = {
    // إعدادات البوت الافتراضية
    defaultSettings: {
        prefix: '!',
        embedColor: '#0099ff',
        defaultVolume: 50,
        maxVolume: 100,
        autoplay: false,
        defaultPlatform: 'youtube', // المنصة الافتراضية للتشغيل
        buttonsEnabled: true, // تفعيل نظام الأزرار
        embedEnabled: true, // تفعيل نظام الإمبيد
    },
    
    // إعدادات منصات التشغيل
    platforms: {
        youtube: {
            enabled: true,
            priority: 1,
        },
        spotify: {
            enabled: true,
            priority: 2,
            clientId: process.env.SPOTIFY_CLIENT_ID || '',
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        },
        soundcloud: {
            enabled: true,
            priority: 3,
        }
    },
    
    // إعدادات متعددة البوتات
    multiBot: {
        enabled: true,
        maxBots: 10, // الحد الأقصى لعدد البوتات
        sharedCommands: true, // مشاركة الأوامر بين البوتات
        sharedEvents: true, // مشاركة الأحداث بين البوتات
    },
    
    // إعدادات الأذونات
    permissions: {
        // أدوار المالك (يمكن تعديلها من خلال الأوامر)
        ownerRoles: [],
        // أدوار المشرف (يمكن تعديلها من خلال الأوامر)
        adminRoles: [],
        // قائمة معرفات المستخدمين المحظورين
        blacklistedUsers: [],
    },
    
    // إعدادات التسجيل
    logging: {
        enabled: true,
        level: 'info', // مستويات التسجيل: error, warn, info, debug
    }
};
