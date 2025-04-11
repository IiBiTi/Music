/**
 * أمر نقل البوت إلى سيرفر آخر
 * يقوم بإنشاء رابط دعوة للبوت لنقله إلى سيرفر آخر
 */

const { EmbedBuilder } = require('discord.js');
const MultiBotManager = require('../../utils/multiBotManager');

module.exports = {
    name: 'invite',
    aliases: ['transfer', 'دعوة', 'نقل'],
    description: 'إنشاء رابط دعوة للبوت لنقله إلى سيرفر آخر',
    usage: '<prefix>invite <token>',
    category: 'admin',
    async execute(bot, message, args) {
        // التحقق من صلاحيات المستخدم
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('ليس لديك صلاحيات كافية لاستخدام هذا الأمر!');
        }

        // إنشاء مدير البوتات المتعددة
        const botManager = new MultiBotManager();

        // إذا لم يتم تحديد توكن، استخدم البوت الحالي
        const token = args.length > 0 ? args[0] : bot.token;
        
        try {
            // الحصول على البوت المطلوب
            const targetBot = token === bot.token ? bot : botManager.getBot(token);
            
            if (!targetBot) {
                return message.reply('❌ لم يتم العثور على البوت المطلوب. تأكد من صحة التوكن.');
            }
            
            // إنشاء رابط الدعوة مع الصلاحيات اللازمة
            const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${targetBot.client.user.id}&permissions=8&scope=bot%20applications.commands`;
            
            // إنشاء رسالة الدعوة
            const embed = new EmbedBuilder()
                .setColor(targetBot.options.embedColor)
                .setTitle('رابط دعوة البوت')
                .setDescription(`استخدم الرابط التالي لدعوة البوت إلى سيرفر آخر:\n[اضغط هنا للدعوة](${inviteLink})`)
                .setThumbnail(targetBot.client.user.displayAvatarURL())
                .addFields(
                    { name: 'اسم البوت', value: targetBot.client.user.username, inline: true },
                    { name: 'معرف البوت', value: targetBot.client.user.id, inline: true }
                )
                .setTimestamp();
            
            // إرسال الرسالة
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
