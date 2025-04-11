/**
 * أمر تشغيل الموسيقى
 * يقوم بتشغيل الموسيقى من الرابط أو البحث المقدم
 */

module.exports = {
    name: 'play',
    aliases: ['p', 'شغل'],
    description: 'تشغيل الموسيقى من رابط أو بحث',
    usage: '<prefix>play <رابط أو بحث>',
    category: 'music',
    async execute(bot, message, args) {
        // التحقق من وجود معاملات
        if (!args.length) {
            return message.reply('يرجى تقديم رابط أو مصطلح بحث للتشغيل.');
        }

        // التحقق من وجود المستخدم في قناة صوتية
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('يجب أن تكون في قناة صوتية لاستخدام هذا الأمر!');
        }

        // التحقق من أذونات البوت
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.reply('أحتاج إلى أذونات للانضمام والتحدث في قناة الصوت الخاصة بك!');
        }

        // إنشاء رسالة انتظار
        const waitMsg = await message.channel.send('🔍 جاري البحث والتشغيل...');

        // تحديد نوع المدخلات (رابط أو بحث)
        const query = args.join(' ');
        
        try {
            // استخدام المنصة الحالية للبوت
            const searchOptions = {
                member: message.member,
                textChannel: message.channel,
                message,
                platform: bot.currentPlatform
            };

            // تشغيل الموسيقى باستخدام DisTube
            await bot.distube.play(voiceChannel, query, searchOptions);
            
            // حذف رسالة الانتظار بعد نجاح التشغيل
            waitMsg.delete().catch(console.error);
        } catch (error) {
            console.error(error);
            waitMsg.edit(`❌ حدث خطأ: ${error.message}`);
        }
    }
};
