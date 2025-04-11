/**
 * أمر تغيير صورة البوت
 * يقوم بتغيير صورة بوت واحد أو جميع البوتات
 */

const MultiBotManager = require('../../utils/multiBotManager');

module.exports = {
    name: 'setavatar',
    aliases: ['changeavatar', 'تغيير_الصورة'],
    description: 'تغيير صورة بوت واحد أو جميع البوتات',
    usage: '<prefix>setavatar <all/token> <رابط الصورة>',
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
        
        // رابط الصورة
        const avatarURL = args[1];
        
        // التحقق من صحة الرابط
        if (!avatarURL.startsWith('http')) {
            return message.reply('يرجى تقديم رابط صالح للصورة.');
        }

        try {
            // إذا كان الهدف هو جميع البوتات
            if (target === 'all' || target === 'الكل') {
                message.channel.send('⏳ جاري تغيير صورة جميع البوتات... قد يستغرق هذا بعض الوقت.');
                
                const result = await botManager.changeAllBotsAvatar(avatarURL);
                
                if (result) {
                    message.channel.send('✅ تم تغيير صورة جميع البوتات بنجاح.');
                } else {
                    message.reply('❌ فشل تغيير صورة بعض البوتات. قد يكون بسبب قيود Discord على تغيير الصور.');
                }
            } else {
                // إذا كان الهدف هو بوت محدد
                message.channel.send('⏳ جاري تغيير صورة البوت...');
                
                const result = await botManager.changeBotAvatar(target, avatarURL);
                
                if (result) {
                    message.channel.send('✅ تم تغيير صورة البوت بنجاح.');
                } else {
                    message.reply('❌ فشل تغيير صورة البوت. تأكد من صحة التوكن أو قد يكون بسبب قيود Discord على تغيير الصور.');
                }
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
