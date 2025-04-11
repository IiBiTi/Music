/**
 * أمر عرض قائمة التشغيل
 * يقوم بعرض الأغاني الموجودة في قائمة التشغيل الحالية
 */

module.exports = {
    name: 'queue',
    aliases: ['q', 'قائمة'],
    description: 'عرض قائمة التشغيل الحالية',
    usage: '<prefix>queue',
    category: 'music',
    async execute(bot, message, args) {
        // التحقق من وجود قائمة تشغيل
        const queue = bot.distube.getQueue(message);
        if (!queue) {
            return message.reply('لا توجد موسيقى قيد التشغيل حاليًا!');
        }

        try {
            // إنشاء رسالة قائمة التشغيل
            const currentSong = queue.songs[0];
            let queueString = `**قائمة التشغيل الحالية - ${queue.songs.length} أغنية**\n\n`;
            queueString += `**الآن:** [${currentSong.name}](${currentSong.url}) - \`${currentSong.formattedDuration}\`\n\n`;
            
            // إضافة باقي الأغاني في القائمة
            if (queue.songs.length > 1) {
                queueString += '**التالي:**\n';
                const songsToShow = queue.songs.slice(1, 11); // عرض 10 أغاني فقط
                songsToShow.forEach((song, index) => {
                    queueString += `**${index + 1}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\`\n`;
                });
                
                // إذا كان هناك المزيد من الأغاني
                if (queue.songs.length > 11) {
                    queueString += `\n*و ${queue.songs.length - 11} أغنية أخرى...*`;
                }
            }
            
            // إضافة معلومات إضافية
            queueString += `\n\n**المنصة الحالية:** ${bot.currentPlatform}`;
            queueString += `\n**مستوى الصوت:** ${queue.volume}%`;
            queueString += `\n**التكرار:** ${queue.repeatMode ? (queue.repeatMode === 2 ? 'قائمة التشغيل' : 'الأغنية الحالية') : 'معطل'}`;
            queueString += `\n**التشغيل التلقائي:** ${queue.autoplay ? 'مفعل' : 'معطل'}`;
            
            // إرسال الرسالة
            if (bot.options.embedEnabled) {
                const { MessageEmbed } = require('discord.js');
                const embed = new MessageEmbed()
                    .setColor(bot.options.embedColor)
                    .setTitle('🎵 قائمة التشغيل')
                    .setDescription(queueString)
                    .setTimestamp();
                
                message.channel.send({ embeds: [embed] });
            } else {
                message.channel.send(queueString);
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
