/**
 * أمر حظر المستخدمين
 * يقوم بحظر أو إلغاء حظر مستخدم من استخدام البوتات
 */

const MultiBotManager = require('../../utils/multiBotManager');

module.exports = {
    name: 'blacklist',
    aliases: ['ban', 'حظر'],
    description: 'حظر أو إلغاء حظر مستخدم من استخدام البوتات',
    usage: '<prefix>blacklist <add/remove> <معرف المستخدم>',
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

        // تحديد العملية (إضافة أو إزالة)
        const operation = args[0].toLowerCase();
        
        // معرف المستخدم
        const userId = args[1];
        
        // التحقق من صحة معرف المستخدم
        if (!/^\d+$/.test(userId)) {
            return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
        }

        try {
            // إذا كانت العملية هي إضافة
            if (operation === 'add' || operation === 'إضافة') {
                const result = botManager.addUserToBlacklist(userId);
                
                if (result) {
                    message.channel.send(`✅ تم حظر المستخدم \`${userId}\` من استخدام البوتات.`);
                } else {
                    message.reply('المستخدم محظور بالفعل.');
                }
            } 
            // إذا كانت العملية هي إزالة
            else if (operation === 'remove' || operation === 'إزالة') {
                const result = botManager.removeUserFromBlacklist(userId);
                
                if (result) {
                    message.channel.send(`✅ تم إلغاء حظر المستخدم \`${userId}\` من استخدام البوتات.`);
                } else {
                    message.reply('المستخدم غير محظور أصلاً.');
                }
            }
            // إذا كانت العملية هي عرض القائمة
            else if (operation === 'list' || operation === 'قائمة') {
                const blacklistedUsers = botManager.getBlacklistedUsers();
                
                if (blacklistedUsers.length === 0) {
                    message.channel.send('لا يوجد مستخدمين محظورين حاليًا.');
                } else {
                    let listMessage = '**قائمة المستخدمين المحظورين:**\n';
                    blacklistedUsers.forEach((id, index) => {
                        listMessage += `${index + 1}. \`${id}\`\n`;
                    });
                    
                    message.channel.send(listMessage);
                }
            } else {
                message.reply('العملية غير صالحة. استخدم "add" للإضافة أو "remove" للإزالة أو "list" لعرض القائمة.');
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
