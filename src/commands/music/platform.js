/**
 * أمر تغيير منصة التشغيل
 * يقوم بتغيير المنصة المستخدمة لتشغيل الموسيقى
 */

module.exports = {
    name: 'platform',
    aliases: ['منصة'],
    description: 'تغيير منصة تشغيل الموسيقى',
    usage: '<prefix>platform <youtube|spotify|soundcloud>',
    category: 'music',
    async execute(bot, message, args) {
        // التحقق من وجود معاملات
        if (!args.length) {
            return message.reply(`المنصة الحالية هي: **${bot.currentPlatform}**\nالمنصات المتاحة: youtube, spotify, soundcloud`);
        }

        // التحقق من صحة المعاملات
        const platform = args[0].toLowerCase();
        const availablePlatforms = ['youtube', 'spotify', 'soundcloud'];
        
        if (!availablePlatforms.includes(platform)) {
            return message.reply('المنصة غير صالحة. المنصات المتاحة: youtube, spotify, soundcloud');
        }

        // التحقق من تفعيل المنصة في الإعدادات
        const config = require('../../../config/config');
        if (!config.platforms[platform] || !config.platforms[platform].enabled) {
            return message.reply(`منصة ${platform} غير مفعلة في الإعدادات.`);
        }

        try {
            // تغيير المنصة
            if (bot.switchPlatform(platform)) {
                message.channel.send(`🔄 تم تغيير منصة التشغيل إلى: **${platform}**`);
            } else {
                message.reply(`❌ فشل تغيير المنصة إلى ${platform}.`);
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
