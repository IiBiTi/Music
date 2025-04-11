/**
 * حدث خطأ
 * يتم تنفيذه عند حدوث خطأ أثناء تشغيل الموسيقى
 */

module.exports = (bot, channel, error) => {
    // إنشاء رسالة الخطأ
    let errorMessage = `❌ **حدث خطأ:** ${error.message || 'خطأ غير معروف'}`;
    
    // إرسال الرسالة
    if (bot.options.embedEnabled) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('خطأ في تشغيل الموسيقى')
            .setDescription(errorMessage)
            .setTimestamp();
        
        channel.send({ embeds: [embed] });
    } else {
        channel.send(errorMessage);
    }
    
    // تسجيل الخطأ في وحدة التحكم
    console.error('[DisTube Error]', error);
    
    // إذا كان الخطأ متعلقًا بمنصة معينة، اقتراح تغيير المنصة
    if (error.message && (
        error.message.includes('youtube') || 
        error.message.includes('spotify') || 
        error.message.includes('soundcloud')
    )) {
        const config = require('../../../config/config');
        const currentPlatform = bot.currentPlatform;
        
        // البحث عن منصة بديلة
        let alternativePlatform = null;
        for (const platform in config.platforms) {
            if (platform !== currentPlatform && config.platforms[platform].enabled) {
                alternativePlatform = platform;
                break;
            }
        }
        
        // اقتراح تغيير المنصة إذا وجدت منصة بديلة
        if (alternativePlatform) {
            const suggestMessage = `يبدو أن هناك مشكلة في منصة ${currentPlatform}. يمكنك تجربة تغيير المنصة إلى ${alternativePlatform} باستخدام الأمر: \`${bot.options.prefix}platform ${alternativePlatform}\``;
            
            if (bot.options.embedEnabled) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('اقتراح تغيير المنصة')
                    .setDescription(suggestMessage)
                    .setTimestamp();
                
                channel.send({ embeds: [embed] });
            } else {
                channel.send(suggestMessage);
            }
        }
    }
};
