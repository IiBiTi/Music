/**
 * ملف اختبار وظائف البوت
 * هذا الملف يوفر وظائف للتحقق من عمل جميع أنظمة البوت بشكل صحيح
 */

const { MusicBot, BotManager } = require('../src/index');
const MultiBotManager = require('../src/utils/multiBotManager');
const PlatformSwitcher = require('../src/utils/platformSwitcher');
const SubscriptionManager = require('../src/utils/subscriptionManager');
const SubscriptionBotManager = require('../src/utils/subscriptionBotManager');
const fs = require('fs');
const path = require('path');

// وظيفة اختبار قاعدة البوت الأساسية
function testBotBase() {
    console.log('=== اختبار قاعدة البوت الأساسية ===');
    
    try {
        // التحقق من وجود ملفات البوت الأساسية
        const requiredFiles = [
            '../src/index.js',
            '../config/config.js',
            '../src/utils/commandHandler.js',
            '../src/utils/eventHandler.js'
        ];
        
        for (const file of requiredFiles) {
            if (fs.existsSync(path.join(__dirname, file))) {
                console.log(`✅ الملف ${file} موجود.`);
            } else {
                console.error(`❌ الملف ${file} غير موجود!`);
                return false;
            }
        }
        
        // التحقق من وجود مجلدات الأوامر والأحداث
        const requiredDirs = [
            '../src/commands',
            '../src/events',
            '../src/commands/music',
            '../src/commands/admin',
            '../src/events/distube'
        ];
        
        for (const dir of requiredDirs) {
            if (fs.existsSync(path.join(__dirname, dir))) {
                console.log(`✅ المجلد ${dir} موجود.`);
            } else {
                console.error(`❌ المجلد ${dir} غير موجود!`);
                return false;
            }
        }
        
        // التحقق من وجود فئات البوت الأساسية
        if (typeof MusicBot !== 'function') {
            console.error('❌ فئة MusicBot غير موجودة!');
            return false;
        }
        
        if (typeof BotManager !== 'function') {
            console.error('❌ فئة BotManager غير موجودة!');
            return false;
        }
        
        console.log('✅ اختبار قاعدة البوت الأساسية تم بنجاح.');
        return true;
    } catch (error) {
        console.error('❌ فشل اختبار قاعدة البوت الأساسية:', error);
        return false;
    }
}

// وظيفة اختبار وظائف الميوزك
function testMusicFunctionality() {
    console.log('=== اختبار وظائف الميوزك ===');
    
    try {
        // التحقق من وجود أوامر الميوزك الأساسية
        const requiredCommands = [
            '../src/commands/music/play.js',
            '../src/commands/music/stop.js',
            '../src/commands/music/skip.js',
            '../src/commands/music/queue.js',
            '../src/commands/music/volume.js',
            '../src/commands/music/platform.js'
        ];
        
        for (const command of requiredCommands) {
            if (fs.existsSync(path.join(__dirname, command))) {
                console.log(`✅ الأمر ${command} موجود.`);
            } else {
                console.error(`❌ الأمر ${command} غير موجود!`);
                return false;
            }
        }
        
        // التحقق من وجود أحداث DisTube
        const requiredEvents = [
            '../src/events/distube/playSong.js',
            '../src/events/distube/addSong.js',
            '../src/events/distube/error.js',
            '../src/events/distube/finish.js'
        ];
        
        for (const event of requiredEvents) {
            if (fs.existsSync(path.join(__dirname, event))) {
                console.log(`✅ الحدث ${event} موجود.`);
            } else {
                console.error(`❌ الحدث ${event} غير موجود!`);
                return false;
            }
        }
        
        console.log('✅ اختبار وظائف الميوزك تم بنجاح.');
        return true;
    } catch (error) {
        console.error('❌ فشل اختبار وظائف الميوزك:', error);
        return false;
    }
}

// وظيفة اختبار دعم البوتات المتعددة
function testMultiBotSupport() {
    console.log('=== اختبار دعم البوتات المتعددة ===');
    
    try {
        // التحقق من وجود ملف مدير البوتات المتعددة
        if (!fs.existsSync(path.join(__dirname, '../src/utils/multiBotManager.js'))) {
            console.error('❌ ملف مدير البوتات المتعددة غير موجود!');
            return false;
        }
        
        // التحقق من وجود فئة MultiBotManager
        if (typeof MultiBotManager !== 'function') {
            console.error('❌ فئة MultiBotManager غير موجودة!');
            return false;
        }
        
        // إنشاء مدير البوتات المتعددة
        const botManager = new MultiBotManager();
        
        // التحقق من وجود الوظائف الأساسية
        const requiredMethods = [
            'createBot',
            'getBot',
            'getAllBots',
            'removeBot',
            'updateAllBotsSettings',
            'switchPlatformForAllBots',
            'changeAllBotsUsername',
            'changeAllBotsAvatar',
            'toggleButtonsForAllBots',
            'toggleEmbedForAllBots'
        ];
        
        for (const method of requiredMethods) {
            if (typeof botManager[method] !== 'function') {
                console.error(`❌ الوظيفة ${method} غير موجودة في مدير البوتات المتعددة!`);
                return false;
            }
        }
        
        console.log('✅ اختبار دعم البوتات المتعددة تم بنجاح.');
        return true;
    } catch (error) {
        console.error('❌ فشل اختبار دعم البوتات المتعددة:', error);
        return false;
    }
}

// وظيفة اختبار نظام تبديل المنصة
function testPlatformSwitching() {
    console.log('=== اختبار نظام تبديل المنصة ===');
    
    try {
        // التحقق من وجود ملف مبدل المنصة
        if (!fs.existsSync(path.join(__dirname, '../src/utils/platformSwitcher.js'))) {
            console.error('❌ ملف مبدل المنصة غير موجود!');
            return false;
        }
        
        // التحقق من وجود فئة PlatformSwitcher
        if (typeof PlatformSwitcher !== 'function') {
            console.error('❌ فئة PlatformSwitcher غير موجودة!');
            return false;
        }
        
        // إنشاء مبدل المنصة
        const mockBot = {
            currentPlatform: 'youtube',
            switchPlatform: function(platform) {
                this.currentPlatform = platform;
                return true;
            }
        };
        
        const platformSwitcher = new PlatformSwitcher(mockBot);
        
        // التحقق من وجود الوظائف الأساسية
        const requiredMethods = [
            'logError',
            'resetErrorCounts',
            'switchToNextPlatform',
            'analyzeErrorMessage',
            'handleError'
        ];
        
        for (const method of requiredMethods) {
            if (typeof platformSwitcher[method] !== 'function') {
                console.error(`❌ الوظيفة ${method} غير موجودة في مبدل المنصة!`);
                return false;
            }
        }
        
        // اختبار تبديل المنصة
        const mockError = new Error('Error with youtube API');
        const platform = platformSwitcher.analyzeErrorMessage(mockError);
        
        if (platform !== 'youtube') {
            console.error(`❌ فشل تحليل رسالة الخطأ. النتيجة المتوقعة: youtube، النتيجة الفعلية: ${platform}`);
            return false;
        }
        
        console.log('✅ اختبار نظام تبديل المنصة تم بنجاح.');
        return true;
    } catch (error) {
        console.error('❌ فشل اختبار نظام تبديل المنصة:', error);
        return false;
    }
}

// وظيفة اختبار أوامر الإدارة
function testAdminCommands() {
    console.log('=== اختبار أوامر الإدارة ===');
    
    try {
        // التحقق من وجود أوامر الإدارة
        const requiredCommands = [
            '../src/commands/admin/setname.js',
            '../src/commands/admin/setavatar.js',
            '../src/commands/admin/togglebuttons.js',
            '../src/commands/admin/toggleembed.js',
            '../src/commands/admin/blacklist.js',
            '../src/commands/admin/invite.js'
        ];
        
        for (const command of requiredCommands) {
            if (fs.existsSync(path.join(__dirname, command))) {
                console.log(`✅ الأمر ${command} موجود.`);
            } else {
                console.error(`❌ الأمر ${command} غير موجود!`);
                return false;
            }
        }
        
        console.log('✅ اختبار أوامر الإدارة تم بنجاح.');
        return true;
    } catch (error) {
        console.error('❌ فشل اختبار أوامر الإدارة:', error);
        return false;
    }
}

// وظيفة اختبار نظام الاشتراكات
function testSubscriptionSystem() {
    console.log('=== اختبار نظام الاشتراكات ===');
    
    try {
        // التحقق من وجود ملفات نظام الاشتراكات
        const requiredFiles = [
            '../src/utils/subscriptionManager.js',
            '../src/utils/subscriptionBotManager.js',
            '../src/commands/admin/subscription.js'
        ];
        
        for (const file of requiredFiles) {
            if (fs.existsSync(path.join(__dirname, file))) {
                console.log(`✅ الملف ${file} موجود.`);
            } else {
                console.error(`❌ الملف ${file} غير موجود!`);
                return false;
            }
        }
        
        // التحقق من وجود فئات نظام الاشتراكات
        if (typeof SubscriptionManager !== 'function') {
            console.error('❌ فئة SubscriptionManager غير موجودة!');
            return false;
        }
        
        if (typeof SubscriptionBotManager !== 'function') {
            console.error('❌ فئة SubscriptionBotManager غير موجودة!');
            return false;
        }
        
        // إنشاء مدير الاشتراكات
        const subscriptionManager = new SubscriptionManager();
        
        // التحقق من وجود الوظائف الأساسية
        const requiredMethods = [
            'addSubscription',
            'updateSubscription',
            'getSubscription',
            'getUserSubscriptions',
            'getGuildSubscriptions',
            'getPlanByName',
            'getAllPlans',
            'isSubscriptionValid',
            'isBotTokenValid',
            'extendSubscription',
            'cancelSubscription'
        ];
        
        for (const method of requiredMethods) {
            if (typeof subscriptionManager[method] !== 'function') {
                console.error(`❌ الوظيفة ${method} غير موجودة في مدير الاشتراكات!`);
                return false;
            }
        }
        
        // التحقق من وجود قاعدة البيانات
        const dbPath = path.join(__dirname, '../data/subscriptions.db');
        if (!fs.existsSync(dbPath)) {
            console.warn(`⚠️ ملف قاعدة البيانات ${dbPath} غير موجود. سيتم إنشاؤه عند أول استخدام.`);
        }
        
        // إغلاق اتصال قاعدة البيانات
        subscriptionManager.close();
        
        console.log('✅ اختبار نظام الاشتراكات تم بنجاح.');
        return true;
    } catch (error) {
        console.error('❌ فشل اختبار نظام الاشتراكات:', error);
        return false;
    }
}

// وظيفة اختبار جميع الوظائف
function testAllFunctionality() {
    console.log('=== اختبار جميع وظائف البوت ===');
    
    const results = {
        botBase: testBotBase(),
        musicFunctionality: testMusicFunctionality(),
        multiBotSupport: testMultiBotSupport(),
        platformSwitching: testPlatformSwitching(),
        adminCommands: testAdminCommands(),
        subscriptionSystem: testSubscriptionSystem()
    };
    
    console.log('\n=== نتائج الاختبار ===');
    for (const [test, result] of Object.entries(results)) {
        console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'نجاح' : 'فشل'}`);
    }
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '✅ جميع الاختبارات تمت بنجاح!' : '❌ فشلت بعض الاختبارات!'}`);
    
    return allPassed;
}

// تنفيذ الاختبار
testAllFunctionality();
