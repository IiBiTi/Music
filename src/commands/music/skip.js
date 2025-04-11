/**
 * أمر تخطي الأغنية الحالية
 * يقوم بتخطي الأغنية الحالية والانتقال إلى الأغنية التالية في قائمة التشغيل
 */

module.exports = {
    name: 'skip',
    aliases: ['s', 'تخطي'],
    description: 'تخطي الأغنية الحالية والانتقال إلى التالية',
    usage: '<prefix>skip',
    category: 'music',
    async execute(bot, message, args) {
        // التحقق من وجود المستخدم في قناة صوتية
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('يجب أن تكون في قناة صوتية لاستخدام هذا الأمر!');
        }

        // التحقق من وجود قائمة تشغيل
        const queue = bot.distube.getQueue(message);
        if (!queue) {
            return message.reply('لا توجد موسيقى قيد التشغيل حاليًا!');
        }

        try {
            // تخطي الأغنية الحالية
            await queue.skip();
            message.channel.send('⏭️ تم تخطي الأغنية الحالية.');
        } catch (error) {
            // إذا كانت هذه هي الأغنية الأخيرة في القائمة
            if (error.code === 'NO_UP_NEXT') {
                message.reply('لا توجد أغنية تالية في قائمة التشغيل.');
                await queue.stop();
                return message.channel.send('⏹️ تم إيقاف التشغيل لأنه لا توجد أغاني أخرى في القائمة.');
            }
            
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
