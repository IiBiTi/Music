/**
 * حدث تشغيل الأغنية
 * يتم تنفيذه عند بدء تشغيل أغنية جديدة
 */

module.exports = (bot, queue, song) => {
    // إنشاء رسالة الإشعار
    let playMessage = `🎵 **بدأ التشغيل:** [${song.name}](${song.url})`;
    
    // إضافة معلومات إضافية
    playMessage += `\n⏱️ **المدة:** \`${song.formattedDuration}\``;
    playMessage += `\n👤 **بواسطة:** ${song.user}`;
    playMessage += `\n🔊 **مستوى الصوت:** ${queue.volume}%`;
    playMessage += `\n🎧 **المنصة:** ${bot.currentPlatform}`;
    
    // إرسال الرسالة
    if (bot.options.embedEnabled) {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(bot.options.embedColor || '#0099ff')
            .setTitle('بدأ التشغيل')
            .setDescription(playMessage)
            .setThumbnail(song.thumbnail)
            .setTimestamp();
        
        // إضافة أزرار التحكم إذا كانت مفعلة
        if (bot.options.buttonsEnabled) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pause_' + queue.id)
                        .setLabel('إيقاف مؤقت')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⏸️'),
                    new ButtonBuilder()
                        .setCustomId('skip_' + queue.id)
                        .setLabel('تخطي')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⏭️'),
                    new ButtonBuilder()
                        .setCustomId('stop_' + queue.id)
                        .setLabel('إيقاف')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⏹️'),
                    new ButtonBuilder()
                        .setCustomId('queue_' + queue.id)
                        .setLabel('القائمة')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📜')
                );
            
            // إرسال الرسالة مع الأزرار
            queue.textChannel.send({ embeds: [embed], components: [row] })
                .then(msg => {
                    // إنشاء مجمع للتفاعل مع الأزرار
                    const collector = msg.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: song.duration * 1000 // وقت الأغنية بالمللي ثانية
                    });
                    
                    // معالجة التفاعلات
                    collector.on('collect', async (interaction) => {
                        // التحقق من أن المستخدم في نفس الروم الصوتي
                        const member = interaction.guild.members.cache.get(interaction.user.id);
                        const voiceChannel = member.voice.channel;
                        
                        if (!voiceChannel) {
                            return interaction.reply({
                                content: 'يجب أن تكون في روم صوتي لاستخدام هذه الأزرار!',
                                ephemeral: true
                            });
                        }
                        
                        if (queue.voiceChannel.id !== voiceChannel.id) {
                            return interaction.reply({
                                content: 'يجب أن تكون في نفس الروم الصوتي مع البوت!',
                                ephemeral: true
                            });
                        }
                        
                        // معالجة الأزرار
                        const buttonId = interaction.customId.split('_')[0];
                        
                        try {
                            switch (buttonId) {
                                case 'pause':
                                    if (queue.paused) {
                                        bot.distube.resume(interaction.guild);
                                        await interaction.reply({
                                            content: '▶️ تم استئناف التشغيل!',
                                            ephemeral: true
                                        });
                                    } else {
                                        bot.distube.pause(interaction.guild);
                                        await interaction.reply({
                                            content: '⏸️ تم إيقاف التشغيل مؤقتًا!',
                                            ephemeral: true
                                        });
                                    }
                                    break;
                                
                                case 'skip':
                                    bot.distube.skip(interaction.guild);
                                    await interaction.reply({
                                        content: '⏭️ تم تخطي الأغنية الحالية!',
                                        ephemeral: true
                                    });
                                    break;
                                
                                case 'stop':
                                    bot.distube.stop(interaction.guild);
                                    await interaction.reply({
                                        content: '⏹️ تم إيقاف التشغيل!',
                                        ephemeral: true
                                    });
                                    break;
                                
                                case 'queue':
                                    const currentQueue = bot.distube.getQueue(interaction.guild);
                                    
                                    if (!currentQueue || !currentQueue.songs || currentQueue.songs.length === 0) {
                                        return interaction.reply({
                                            content: '❌ لا توجد أغاني في قائمة الانتظار!',
                                            ephemeral: true
                                        });
                                    }
                                    
                                    const queueEmbed = new EmbedBuilder()
                                        .setColor(bot.options.embedColor || '#0099ff')
                                        .setTitle('قائمة الانتظار')
                                        .setDescription(
                                            currentQueue.songs.slice(0, 10).map((song, index) => {
                                                return `${index === 0 ? '🎵 **الحالية**' : `**${index}.**`} [${song.name}](${song.url}) - \`${song.formattedDuration}\``;
                                            }).join('\n')
                                        )
                                        .setFooter({
                                            text: `الصفحة 1/${Math.ceil(currentQueue.songs.length / 10)} | ${currentQueue.songs.length} أغنية | ${currentQueue.formattedDuration}`
                                        });
                                    
                                    await interaction.reply({
                                        embeds: [queueEmbed],
                                        ephemeral: true
                                    });
                                    break;
                            }
                        } catch (error) {
                            console.error('خطأ في معالجة زر الموسيقى:', error);
                            await interaction.reply({
                                content: `❌ حدث خطأ: ${error.message}`,
                                ephemeral: true
                            });
                        }
                    });
                    
                    // عند انتهاء وقت المجمع
                    collector.on('end', () => {
                        // تعطيل الأزرار عند انتهاء الأغنية
                        const disabledRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('pause_disabled')
                                    .setLabel('إيقاف مؤقت')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⏸️')
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('skip_disabled')
                                    .setLabel('تخطي')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji('⏭️')
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('stop_disabled')
                                    .setLabel('إيقاف')
                                    .setStyle(ButtonStyle.Danger)
                                    .setEmoji('⏹️')
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('queue_disabled')
                                    .setLabel('القائمة')
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji('📜')
                                    .setDisabled(true)
                            );
                        
                        msg.edit({ components: [disabledRow] }).catch(console.error);
                    });
                })
                .catch(console.error);
        } else {
            queue.textChannel.send({ embeds: [embed] });
        }
    } else {
        queue.textChannel.send(playMessage);
    }
};
