/**
 * حدث إضافة أغنية إلى قائمة التشغيل
 * يتم تنفيذه عند إضافة أغنية جديدة إلى قائمة التشغيل
 */

module.exports = (bot, queue, song) => {
    // إنشاء رسالة الإشعار
    let addMessage = `🎵 **تمت إضافة أغنية إلى قائمة التشغيل:** [${song.name}](${song.url})`;
    
    // إضافة معلومات إضافية
    addMessage += `\n⏱️ **المدة:** \`${song.formattedDuration}\``;
    addMessage += `\n👤 **بواسطة:** ${song.user}`;
    addMessage += `\n📊 **الموقع في القائمة:** ${queue.songs.length - 1}`;
    
    // إرسال الرسالة
    if (bot.options.embedEnabled) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(bot.options.embedColor)
            .setTitle('إضافة إلى قائمة التشغيل')
            .setDescription(addMessage)
            .setThumbnail(song.thumbnail)
            .setTimestamp();
        
        queue.textChannel.send({ embeds: [embed] });
    } else {
        queue.textChannel.send(addMessage);
    }
};
