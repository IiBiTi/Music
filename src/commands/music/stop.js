/**
 * أمر إيقاف تشغيل الموسيقى
 * يقوم بإيقاف تشغيل الموسيقى ومغادرة القناة الصوتية
 */

module.exports = {
    name: 'stop',
    aliases: ['leave', 'وقف', 'اخرج'],
    description: 'إيقاف تشغيل الموسيقى ومغادرة القناة الصوتية',
    usage: '<prefix>stop',
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
            // إيقاف التشغيل ومسح قائمة الانتظار
            await queue.stop();
            message.channel.send('⏹️ تم إيقاف التشغيل ومغادرة القناة الصوتية.');
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
