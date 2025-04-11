/**
 * أمر تغيير مستوى الصوت
 * يقوم بتغيير مستوى صوت الموسيقى
 */

module.exports = {
    name: 'volume',
    aliases: ['vol', 'صوت'],
    description: 'تغيير مستوى صوت الموسيقى',
    usage: '<prefix>volume <1-100>',
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

        // التحقق من وجود معاملات
        if (!args.length) {
            return message.reply(`مستوى الصوت الحالي هو: **${queue.volume}%**`);
        }

        // التحقق من صحة المعاملات
        const volume = parseInt(args[0]);
        if (isNaN(volume)) {
            return message.reply('يرجى إدخال رقم صحيح بين 1 و 100.');
        }

        // التحقق من نطاق مستوى الصوت
        if (volume < 1 || volume > bot.options.maxVolume) {
            return message.reply(`يرجى إدخال رقم بين 1 و ${bot.options.maxVolume}.`);
        }

        try {
            // تغيير مستوى الصوت
            queue.setVolume(volume);
            message.channel.send(`🔊 تم تغيير مستوى الصوت إلى: **${volume}%**`);
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
