/**
 * حدث انتهاء قائمة التشغيل
 * يتم تنفيذه عند انتهاء جميع الأغاني في قائمة التشغيل
 */

module.exports = (bot, queue) => {
    // إنشاء رسالة الإشعار
    let finishMessage = `🏁 **انتهت قائمة التشغيل**`;
    
    // إرسال الرسالة
    if (bot.options.embedEnabled) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(bot.options.embedColor)
            .setTitle('انتهاء قائمة التشغيل')
            .setDescription(finishMessage)
            .setTimestamp();
        
        queue.textChannel.send({ embeds: [embed] });
    } else {
        queue.textChannel.send(finishMessage);
    }
};
