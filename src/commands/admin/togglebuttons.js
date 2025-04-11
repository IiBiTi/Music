/**
 * أمر تفعيل/تعطيل نظام الأزرار
 * يقوم بتفعيل أو تعطيل نظام الأزرار لبوت واحد أو جميع البوتات
 */

const MultiBotManager = require('../../utils/multiBotManager');

module.exports = {
    name: 'togglebuttons',
    aliases: ['buttons', 'أزرار'],
    description: 'تفعيل أو تعطيل نظام الأزرار',
    usage: '<prefix>togglebuttons <all/token> <on/off>',
    category: 'admin',
    async execute(bot, message, args) {
        // التحقق من صلاحيات المستخدم
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('ليس لديك صلاحيات كافية لاستخدام هذا الأمر!');
        }

        // التحقق من وجود معاملات
        if (args.length < 2) {
            return message.reply(`استخدام غير صحيح! الاستخدام الصحيح: \`${this.usage.replace('<prefix>', bot.options.prefix)}\``);
        }

        // إنشاء مدير البوتات المتعددة
        const botManager = new MultiBotManager();

        // تحديد الهدف (بوت واحد أو جميع البوتات)
        const target = args[0].toLowerCase();
        
        // تحديد الحالة (تفعيل أو تعطيل)
        const state = args[1].toLowerCase();
        let enabled = false;
        
        if (state === 'on' || state === 'true' || state === 'تفعيل') {
            enabled = true;
        } else if (state === 'off' || state === 'false' || state === 'تعطيل') {
            enabled = false;
        } else {
            return message.reply('الحالة غير صالحة. استخدم "on" للتفعيل أو "off" للتعطيل.');
        }

        try {
            // إذا كان الهدف هو جميع البوتات
            if (target === 'all' || target === 'الكل') {
                const result = botManager.toggleButtonsForAllBots(enabled);
                
                if (result) {
                    message.channel.send(`✅ تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الأزرار لجميع البوتات.`);
                } else {
                    message.reply('❌ فشل تغيير حالة نظام الأزرار لبعض البوتات.');
                }
            } else {
                // إذا كان الهدف هو بوت محدد
                const result = botManager.toggleButtons(target, enabled);
                
                if (result) {
                    message.channel.send(`✅ تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الأزرار للبوت.`);
                } else {
                    message.reply('❌ فشل تغيير حالة نظام الأزرار للبوت. تأكد من صحة التوكن.');
                }
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
