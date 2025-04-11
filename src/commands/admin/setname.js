/**
 * أمر تغيير اسم البوت
 * يقوم بتغيير اسم بوت واحد أو جميع البوتات
 */

const MultiBotManager = require('../../utils/multiBotManager');

module.exports = {
    name: 'setname',
    aliases: ['changename', 'تغيير_الاسم'],
    description: 'تغيير اسم بوت واحد أو جميع البوتات',
    usage: '<prefix>setname <all/token> <الاسم الجديد>',
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
        
        // الاسم الجديد
        const newName = args.slice(1).join(' ');
        
        // التحقق من طول الاسم
        if (newName.length < 2 || newName.length > 32) {
            return message.reply('يجب أن يكون طول الاسم بين 2 و 32 حرفًا.');
        }

        try {
            // إذا كان الهدف هو جميع البوتات
            if (target === 'all' || target === 'الكل') {
                const result = await botManager.changeAllBotsUsername(newName);
                
                if (result) {
                    message.channel.send(`✅ تم تغيير اسم جميع البوتات إلى: **${newName}**`);
                } else {
                    message.reply('❌ فشل تغيير اسم بعض البوتات. قد يكون بسبب قيود Discord على تغيير الأسماء.');
                }
            } else {
                // إذا كان الهدف هو بوت محدد
                const result = await botManager.changeBotUsername(target, newName);
                
                if (result) {
                    message.channel.send(`✅ تم تغيير اسم البوت إلى: **${newName}**`);
                } else {
                    message.reply('❌ فشل تغيير اسم البوت. تأكد من صحة التوكن أو قد يكون بسبب قيود Discord على تغيير الأسماء.');
                }
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
