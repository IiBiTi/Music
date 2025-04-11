/**
 * أمر عرض معلومات الاشتراك وإدارة البوتات الخاصة بالمستخدم
 * يعرض معلومات الاشتراك ويتيح للمستخدم التحكم في بوتاته
 */

const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');
const SubscriptionManager = require('../../utils/subscriptionManager');
const MultiBotManager = require('../../utils/multiBotManager');

module.exports = {
    name: 'vip',
    aliases: ['اشتراك', 'اشتراكي'],
    description: 'عرض معلومات الاشتراك وإدارة البوتات الخاصة بك',
    usage: '<prefix>vip',
    category: 'utility',
    async execute(bot, message, args) {
        // التحقق من أن الأمر يتم تنفيذه في سيرفر
        if (!message.guild) {
            return message.reply('هذا الأمر متاح فقط في السيرفرات.');
        }

        // إنشاء مدير الاشتراكات
        const subscriptionManager = new SubscriptionManager();
        
        try {
            // الحصول على معلومات الاشتراك
            const subscription = subscriptionManager.getSubscription(message.author.id, message.guild.id);
            
            if (!subscription) {
                return message.reply('ليس لديك اشتراك نشط في هذا السيرفر. يرجى التواصل مع الإدارة للحصول على اشتراك.');
            }
            
            // عرض معلومات الاشتراك
            await showSubscriptionInfo(message, subscription, subscriptionManager);
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        } finally {
            // إغلاق اتصال قاعدة البيانات
            subscriptionManager.close();
        }
    }
};

// عرض معلومات الاشتراك
async function showSubscriptionInfo(message, subscription, subscriptionManager) {
    // الحصول على معلومات الخطة
    const plan = subscriptionManager.getPlanByName(subscription.plan_type);
    
    // تحويل التواريخ
    const startDate = new Date(subscription.start_date * 1000).toLocaleDateString();
    const endDate = new Date(subscription.end_date * 1000).toLocaleDateString();
    
    // حساب الأيام المتبقية
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.ceil((subscription.end_date - now) / (60 * 60 * 24));
    
    // تحويل قائمة التوكنات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    // إنشاء رسالة المعلومات
    const embed = new EmbedBuilder()
        .setColor(subscription.is_active ? '#00FF00' : '#FF0000')
        .setTitle('معلومات الاشتراك')
        .setDescription(`مرحباً ${message.author}، إليك معلومات اشتراكك في هذا السيرفر.`)
        .addFields(
            { name: 'الحالة', value: subscription.is_active ? 'نشط ✅' : 'غير نشط ❌', inline: true },
            { name: 'الخطة', value: subscription.plan_type, inline: true },
            { name: 'تاريخ البدء', value: startDate, inline: true },
            { name: 'تاريخ الانتهاء', value: endDate, inline: true },
            { name: 'الأيام المتبقية', value: `${daysLeft} يوم`, inline: true },
            { name: 'عدد البوتات المستخدمة', value: `${botTokens.length}/${plan.max_bots}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'يمكنك إدارة بوتاتك من خلال القائمة المنسدلة أدناه' });
    
    // إنشاء القائمة المنسدلة لإدارة البوتات
    const select = new StringSelectMenuBuilder()
        .setCustomId('manage_bots')
        .setPlaceholder('اختر عملية لإدارة بوتاتك');
    
    // إضافة خيارات القائمة
    select.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('عرض قائمة بوتاتي')
            .setDescription('عرض قائمة البوتات الخاصة بك')
            .setValue('list_my_bots')
            .setEmoji('📋'),
        new StringSelectMenuOptionBuilder()
            .setLabel('تغيير البوت النشط')
            .setDescription('تغيير البوت النشط من بين بوتاتك')
            .setValue('switch_active_bot')
            .setEmoji('🔄'),
        new StringSelectMenuOptionBuilder()
            .setLabel('تغيير منصة التشغيل')
            .setDescription('تغيير منصة التشغيل لبوتاتك')
            .setValue('change_platform')
            .setEmoji('🎵'),
        new StringSelectMenuOptionBuilder()
            .setLabel('تفعيل/تعطيل نظام الأزرار')
            .setDescription('تفعيل أو تعطيل نظام الأزرار لبوتاتك')
            .setValue('toggle_buttons')
            .setEmoji('🔘'),
        new StringSelectMenuOptionBuilder()
            .setLabel('تفعيل/تعطيل نظام الإمبيد')
            .setDescription('تفعيل أو تعطيل نظام الإمبيد لبوتاتك')
            .setValue('toggle_embed')
            .setEmoji('🖼️')
    );
    
    const row = new ActionRowBuilder().addComponents(select);
    
    // إرسال الرسالة مع القائمة المنسدلة
    const response = await message.channel.send({
        embeds: [embed],
        components: [row]
    });
    
    // إنشاء مجمع للتفاعل مع القائمة المنسدلة
    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000 // 5 دقائق
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (interaction) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({
                content: 'هذه القائمة ليست لك!',
                ephemeral: true
            });
        }
        
        // الحصول على العملية المختارة
        const operation = interaction.values[0];
        
        // إنشاء مدير البوتات المتعددة
        const botManager = new MultiBotManager();
        
        // تنفيذ العملية المناسبة
        try {
            switch (operation) {
                case 'list_my_bots':
                    await handleListMyBots(interaction, message.author.id, botManager, subscriptionManager);
                    break;
                
                case 'switch_active_bot':
                    await handleSwitchActiveBot(interaction, message.author.id, botManager, subscriptionManager);
                    break;
                
                case 'change_platform':
                    await handleChangePlatform(interaction, message.author.id, botManager, subscriptionManager);
                    break;
                
                case 'toggle_buttons':
                    await handleToggleButtons(interaction, message.author.id, botManager, subscriptionManager);
                    break;
                
                case 'toggle_embed':
                    await handleToggleEmbed(interaction, message.author.id, botManager, subscriptionManager);
                    break;
                
                default:
                    await interaction.update({
                        content: 'العملية غير صالحة. يرجى المحاولة مرة أخرى.',
                        embeds: [],
                        components: []
                    });
            }
        } catch (error) {
            console.error(error);
            await interaction.update({
                content: `❌ حدث خطأ: ${error.message}`,
                embeds: [],
                components: []
            });
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        response.edit({
            content: 'انتهت مهلة القائمة. استخدم الأمر مرة أخرى إذا كنت بحاجة إليه.',
            components: []
        }).catch(console.error);
    });
}

// معالجة عرض قائمة بوتات المستخدم
async function handleListMyBots(interaction, userId, botManager, subscriptionManager) {
    // الحصول على اشتراك المستخدم
    const subscription = subscriptionManager.getSubscription(userId, interaction.guild.id);
    
    if (!subscription) {
        return interaction.update({
            content: 'ليس لديك اشتراك نشط في هذا السيرفر.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على قائمة توكنات البوتات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    if (botTokens.length === 0) {
        return interaction.update({
            content: 'ليس لديك بوتات مضافة إلى اشتراكك. يرجى التواصل مع الإدارة لإضافة بوت.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على معلومات البوتات
    const botsInfo = [];
    
    for (const token of botTokens) {
        const bot = botManager.getBot(token);
        
        if (bot) {
            const botInfo = bot.getBotInfo();
            botsInfo.push({
                ...botInfo,
                token
            });
        }
    }
    
    if (botsInfo.length === 0) {
        return interaction.update({
            content: 'لم يتم العثور على أي بوتات نشطة. يرجى التواصل مع الإدارة للتحقق من حالة بوتاتك.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء رسالة قائمة البوتات
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('قائمة بوتاتك')
        .setDescription(`عدد البوتات النشطة: ${botsInfo.length}`)
        .setTimestamp();
    
    // إضافة معلومات كل بوت
    botsInfo.forEach((bot, index) => {
        embed.addFields({
            name: `${index + 1}. ${bot.username} ${bot.isActive ? '(نشط)' : ''}`,
            value: `ID: ${bot.id}\nالمنصة: ${bot.platform}\nالبادئة: ${bot.prefix}\nعدد السيرفرات: ${bot.guildCount}\nنظام الأزرار: ${bot.useButtons ? 'مفعل' : 'معطل'}\nنظام الإمبيد: ${bot.useEmbed ? 'مفعل' : 'معطل'}`
        });
    });
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_info')
        .setLabel('العودة لمعلومات الاشتراك')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(backButton);
    
    // تحديث الرسالة
    await interaction.update({
        content: null,
        embeds: [embed],
        components: [row]
    });
    
    // إنشاء مجمع للتفاعل مع الزر
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== userId) {
            return i.reply({
                content: 'هذا الزر ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_info') {
            collector.stop();
            // إعادة عرض معلومات الاشتراك
            const subscription = subscriptionManager.getSubscription(userId, i.guild.id);
            await showSubscriptionInfo(await i.message.channel.messages.fetch(i.message.id), subscription, subscriptionManager);
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة تبديل البوت النشط
async function handleSwitchActiveBot(interaction, userId, botManager, subscriptionManager) {
    // الحصول على اشتراك المستخدم
    const subscription = subscriptionManager.getSubscription(userId, interaction.guild.id);
    
    if (!subscription) {
        return interaction.update({
            content: 'ليس لديك اشتراك نشط في هذا السيرفر.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على قائمة توكنات البوتات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    if (botTokens.length === 0) {
        return interaction.update({
            content: 'ليس لديك بوتات مضافة إلى اشتراكك. يرجى التواصل مع الإدارة لإضافة بوت.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على معلومات البوتات
    const botsInfo = [];
    
    for (const token of botTokens) {
        const bot = botManager.getBot(token);
        
        if (bot) {
            const botInfo = bot.getBotInfo();
            botsInfo.push({
                ...botInfo,
                token
            });
        }
    }
    
    if (botsInfo.length === 0) {
        return interaction.update({
            content: 'لم يتم العثور على أي بوتات نشطة. يرجى التواصل مع الإدارة للتحقق من حالة بوتاتك.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء القائمة المنسدلة لاختيار البوت
    const select = new StringSelectMenuBuilder()
        .setCustomId('select_active_bot')
        .setPlaceholder('اختر البوت الذي تريد تعيينه كبوت نشط');
    
    // إضافة البوتات إلى القائمة
    botsInfo.forEach((bot, index) => {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${index + 1}. ${bot.username}${bot.isActive ? ' (نشط)' : ''}`)
                .setDescription(`المنصة: ${bot.platform}, البادئة: ${bot.prefix}`)
                .setValue(bot.token)
                .setEmoji(bot.isActive ? '✅' : '🤖')
        );
    });
    
    const row = new ActionRowBuilder().addComponents(select);
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_info')
        .setLabel('العودة لمعلومات الاشتراك')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    // تحديث الرسالة
    await interaction.update({
        content: 'اختر البوت الذي تريد تعيينه كبوت نشط:',
        embeds: [],
        components: [row, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع القائمة المنسدلة والزر
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== userId) {
            return i.reply({
                content: 'هذه القائمة ليست لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_info') {
            collector.stop();
            // إعادة عرض معلومات الاشتراك
            const subscription = subscriptionManager.getSubscription(userId, i.guild.id);
            await showSubscriptionInfo(await i.message.channel.messages.fetch(i.message.id), subscription, subscriptionManager);
            return;
        }
        
        // إذا تم اختيار بوت
        if (i.customId === 'select_active_bot') {
            const token = i.values[0];
            
            // التحقق من أن البوت ينتمي للمستخدم
            if (!botTokens.includes(token)) {
                return i.update({
                    content: 'هذا البوت ليس من ضمن بوتاتك!',
                    embeds: [],
                    components: []
                });
            }
            
            // تعيين البوت النشط
            const result = botManager.setActiveBot(token);
            
            if (result) {
                const bot = botManager.getBot(token);
                const botInfo = bot.getBotInfo();
                
                // إضافة زر العودة
                const backButton = new ButtonBuilder()
                    .setCustomId('back_to_subscription_info')
                    .setLabel('العودة لمعلومات الاشتراك')
                    .setStyle(ButtonStyle.Secondary);
                
                const row = new ActionRowBuilder().addComponents(backButton);
                
                await i.update({
                    content: `✅ تم تعيين البوت "${botInfo.username}" كبوت نشط بنجاح.`,
                    embeds: [],
                    components: [row]
                });
            } else {
                await i.update({
                    content: '❌ فشل تعيين البوت النشط. يرجى المحاولة مرة أخرى.',
                    embeds: [],
                    components: []
                });
            }
            
            collector.stop();
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة تغيير منصة التشغيل
async function handleChangePlatform(interaction, userId, botManager, subscriptionManager) {
    // الحصول على اشتراك المستخدم
    const subscription = subscriptionManager.getSubscription(userId, interaction.guild.id);
    
    if (!subscription) {
        return interaction.update({
            content: 'ليس لديك اشتراك نشط في هذا السيرفر.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على قائمة توكنات البوتات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    if (botTokens.length === 0) {
        return interaction.update({
            content: 'ليس لديك بوتات مضافة إلى اشتراكك. يرجى التواصل مع الإدارة لإضافة بوت.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء القائمة المنسدلة لاختيار البوت
    const selectBot = new StringSelectMenuBuilder()
        .setCustomId('select_bot_for_platform')
        .setPlaceholder('اختر البوت الذي تريد تغيير منصته');
    
    // إضافة خيار "جميع البوتات"
    selectBot.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('جميع البوتات')
            .setDescription('تغيير المنصة لجميع بوتاتك')
            .setValue('all_bots')
            .setEmoji('🔄')
    );
    
    // إضافة البوتات إلى القائمة
    for (const token of botTokens) {
        const bot = botManager.getBot(token);
        
        if (bot) {
            const botInfo = bot.getBotInfo();
            selectBot.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${botInfo.username}${botInfo.isActive ? ' (نشط)' : ''}`)
                    .setDescription(`المنصة الحالية: ${botInfo.platform}`)
                    .setValue(token)
                    .setEmoji(botInfo.isActive ? '✅' : '🤖')
            );
        }
    }
    
    const botRow = new ActionRowBuilder().addComponents(selectBot);
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_info')
        .setLabel('العودة لمعلومات الاشتراك')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    // تحديث الرسالة
    await interaction.update({
        content: 'اختر البوت الذي تريد تغيير منصته:',
        embeds: [],
        components: [botRow, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع القائمة المنسدلة والزر
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== userId) {
            return i.reply({
                content: 'هذه القائمة ليست لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_info') {
            collector.stop();
            // إعادة عرض معلومات الاشتراك
            const subscription = subscriptionManager.getSubscription(userId, i.guild.id);
            await showSubscriptionInfo(await i.message.channel.messages.fetch(i.message.id), subscription, subscriptionManager);
            return;
        }
        
        // إذا تم اختيار بوت
        if (i.customId === 'select_bot_for_platform') {
            const selectedValue = i.values[0];
            
            // إنشاء القائمة المنسدلة لاختيار المنصة
            const selectPlatform = new StringSelectMenuBuilder()
                .setCustomId('select_platform')
                .setPlaceholder('اختر المنصة الجديدة');
            
            // إضافة المنصات المتاحة
            selectPlatform.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('يوتيوب')
                    .setDescription('تشغيل الموسيقى من يوتيوب')
                    .setValue('youtube')
                    .setEmoji('▶️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('ساوندكلاود')
                    .setDescription('تشغيل الموسيقى من ساوندكلاود')
                    .setValue('soundcloud')
                    .setEmoji('🔊'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('سبوتيفاي')
                    .setDescription('تشغيل الموسيقى من سبوتيفاي')
                    .setValue('spotify')
                    .setEmoji('🎵')
            );
            
            const platformRow = new ActionRowBuilder().addComponents(selectPlatform);
            
            // إضافة زر العودة
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_bot_selection')
                .setLabel('العودة لاختيار البوت')
                .setStyle(ButtonStyle.Secondary);
            
            const buttonRow = new ActionRowBuilder().addComponents(backButton);
            
            // تحديث الرسالة
            await i.update({
                content: `اختر المنصة الجديدة ${selectedValue === 'all_bots' ? 'لجميع بوتاتك' : 'للبوت المحدد'}:`,
                embeds: [],
                components: [platformRow, buttonRow]
            });
            
            // إنشاء مجمع جديد للتفاعل مع قائمة المنصات
            const platformCollector = message.createMessageComponentCollector({
                time: 60000 // دقيقة واحدة
            });
            
            // معالجة التفاعلات
            platformCollector.on('collect', async (platformInteraction) => {
                // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
                if (platformInteraction.user.id !== userId) {
                    return platformInteraction.reply({
                        content: 'هذه القائمة ليست لك!',
                        ephemeral: true
                    });
                }
                
                // إذا تم النقر على زر العودة
                if (platformInteraction.customId === 'back_to_bot_selection') {
                    platformCollector.stop();
                    // إعادة عرض قائمة اختيار البوت
                    await platformInteraction.update({
                        content: 'اختر البوت الذي تريد تغيير منصته:',
                        embeds: [],
                        components: [botRow, buttonRow]
                    });
                    return;
                }
                
                // إذا تم اختيار منصة
                if (platformInteraction.customId === 'select_platform') {
                    const platform = platformInteraction.values[0];
                    
                    try {
                        let result;
                        
                        // تغيير المنصة للبوت المحدد أو لجميع البوتات
                        if (selectedValue === 'all_bots') {
                            // تغيير المنصة لجميع البوتات
                            for (const token of botTokens) {
                                botManager.switchPlatform(token, platform);
                            }
                            result = true;
                        } else {
                            // التحقق من أن البوت ينتمي للمستخدم
                            if (!botTokens.includes(selectedValue)) {
                                return platformInteraction.update({
                                    content: 'هذا البوت ليس من ضمن بوتاتك!',
                                    embeds: [],
                                    components: []
                                });
                            }
                            
                            // تغيير المنصة للبوت المحدد
                            result = botManager.switchPlatform(selectedValue, platform);
                        }
                        
                        if (result) {
                            // إضافة زر العودة
                            const backButton = new ButtonBuilder()
                                .setCustomId('back_to_subscription_info')
                                .setLabel('العودة لمعلومات الاشتراك')
                                .setStyle(ButtonStyle.Secondary);
                            
                            const row = new ActionRowBuilder().addComponents(backButton);
                            
                            await platformInteraction.update({
                                content: `✅ تم تغيير المنصة إلى ${platform} بنجاح ${selectedValue === 'all_bots' ? 'لجميع بوتاتك' : 'للبوت المحدد'}.`,
                                embeds: [],
                                components: [row]
                            });
                        } else {
                            await platformInteraction.update({
                                content: '❌ فشل تغيير المنصة. يرجى المحاولة مرة أخرى.',
                                embeds: [],
                                components: []
                            });
                        }
                        
                        platformCollector.stop();
                        collector.stop();
                    } catch (error) {
                        console.error(error);
                        await platformInteraction.update({
                            content: `❌ حدث خطأ: ${error.message}`,
                            embeds: [],
                            components: []
                        });
                        
                        platformCollector.stop();
                        collector.stop();
                    }
                }
            });
            
            // عند انتهاء وقت المجمع
            platformCollector.on('end', () => {
                if (!collector.ended) {
                    interaction.message.edit({
                        components: []
                    }).catch(console.error);
                }
            });
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة تفعيل/تعطيل نظام الأزرار
async function handleToggleButtons(interaction, userId, botManager, subscriptionManager) {
    // الحصول على اشتراك المستخدم
    const subscription = subscriptionManager.getSubscription(userId, interaction.guild.id);
    
    if (!subscription) {
        return interaction.update({
            content: 'ليس لديك اشتراك نشط في هذا السيرفر.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على قائمة توكنات البوتات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    if (botTokens.length === 0) {
        return interaction.update({
            content: 'ليس لديك بوتات مضافة إلى اشتراكك. يرجى التواصل مع الإدارة لإضافة بوت.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء القائمة المنسدلة لاختيار البوت
    const selectBot = new StringSelectMenuBuilder()
        .setCustomId('select_bot_for_buttons')
        .setPlaceholder('اختر البوت الذي تريد تفعيل/تعطيل نظام الأزرار له');
    
    // إضافة خيار "جميع البوتات"
    selectBot.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('جميع البوتات')
            .setDescription('تفعيل/تعطيل نظام الأزرار لجميع بوتاتك')
            .setValue('all_bots')
            .setEmoji('🔄')
    );
    
    // إضافة البوتات إلى القائمة
    for (const token of botTokens) {
        const bot = botManager.getBot(token);
        
        if (bot) {
            const botInfo = bot.getBotInfo();
            selectBot.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${botInfo.username}${botInfo.isActive ? ' (نشط)' : ''}`)
                    .setDescription(`نظام الأزرار: ${botInfo.useButtons ? 'مفعل' : 'معطل'}`)
                    .setValue(token)
                    .setEmoji(botInfo.isActive ? '✅' : '🤖')
            );
        }
    }
    
    const botRow = new ActionRowBuilder().addComponents(selectBot);
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_info')
        .setLabel('العودة لمعلومات الاشتراك')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    // تحديث الرسالة
    await interaction.update({
        content: 'اختر البوت الذي تريد تفعيل/تعطيل نظام الأزرار له:',
        embeds: [],
        components: [botRow, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع القائمة المنسدلة والزر
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== userId) {
            return i.reply({
                content: 'هذه القائمة ليست لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_info') {
            collector.stop();
            // إعادة عرض معلومات الاشتراك
            const subscription = subscriptionManager.getSubscription(userId, i.guild.id);
            await showSubscriptionInfo(await i.message.channel.messages.fetch(i.message.id), subscription, subscriptionManager);
            return;
        }
        
        // إذا تم اختيار بوت
        if (i.customId === 'select_bot_for_buttons') {
            const selectedValue = i.values[0];
            
            // إنشاء أزرار التفعيل والتعطيل
            const enableButton = new ButtonBuilder()
                .setCustomId('enable_buttons')
                .setLabel('تفعيل نظام الأزرار')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');
            
            const disableButton = new ButtonBuilder()
                .setCustomId('disable_buttons')
                .setLabel('تعطيل نظام الأزرار')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');
            
            const actionRow = new ActionRowBuilder().addComponents(enableButton, disableButton);
            
            // إضافة زر العودة
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_bot_selection')
                .setLabel('العودة لاختيار البوت')
                .setStyle(ButtonStyle.Secondary);
            
            const buttonRow = new ActionRowBuilder().addComponents(backButton);
            
            // تحديث الرسالة
            await i.update({
                content: `اختر العملية ${selectedValue === 'all_bots' ? 'لجميع بوتاتك' : 'للبوت المحدد'}:`,
                embeds: [],
                components: [actionRow, buttonRow]
            });
            
            // إنشاء مجمع جديد للتفاعل مع الأزرار
            const actionCollector = message.createMessageComponentCollector({
                time: 60000 // دقيقة واحدة
            });
            
            // معالجة التفاعلات
            actionCollector.on('collect', async (actionInteraction) => {
                // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
                if (actionInteraction.user.id !== userId) {
                    return actionInteraction.reply({
                        content: 'هذه الأزرار ليست لك!',
                        ephemeral: true
                    });
                }
                
                // إذا تم النقر على زر العودة
                if (actionInteraction.customId === 'back_to_bot_selection') {
                    actionCollector.stop();
                    // إعادة عرض قائمة اختيار البوت
                    await actionInteraction.update({
                        content: 'اختر البوت الذي تريد تفعيل/تعطيل نظام الأزرار له:',
                        embeds: [],
                        components: [botRow, buttonRow]
                    });
                    return;
                }
                
                // إذا تم اختيار تفعيل أو تعطيل
                if (actionInteraction.customId === 'enable_buttons' || actionInteraction.customId === 'disable_buttons') {
                    const enabled = actionInteraction.customId === 'enable_buttons';
                    
                    try {
                        let result;
                        
                        // تفعيل/تعطيل نظام الأزرار للبوت المحدد أو لجميع البوتات
                        if (selectedValue === 'all_bots') {
                            // تفعيل/تعطيل نظام الأزرار لجميع البوتات
                            result = botManager.toggleButtonsForAllBots(enabled);
                        } else {
                            // التحقق من أن البوت ينتمي للمستخدم
                            if (!botTokens.includes(selectedValue)) {
                                return actionInteraction.update({
                                    content: 'هذا البوت ليس من ضمن بوتاتك!',
                                    embeds: [],
                                    components: []
                                });
                            }
                            
                            // تفعيل/تعطيل نظام الأزرار للبوت المحدد
                            result = botManager.toggleButtons(selectedValue, enabled);
                        }
                        
                        if (result) {
                            // إضافة زر العودة
                            const backButton = new ButtonBuilder()
                                .setCustomId('back_to_subscription_info')
                                .setLabel('العودة لمعلومات الاشتراك')
                                .setStyle(ButtonStyle.Secondary);
                            
                            const row = new ActionRowBuilder().addComponents(backButton);
                            
                            await actionInteraction.update({
                                content: `✅ تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الأزرار بنجاح ${selectedValue === 'all_bots' ? 'لجميع بوتاتك' : 'للبوت المحدد'}.`,
                                embeds: [],
                                components: [row]
                            });
                        } else {
                            await actionInteraction.update({
                                content: `❌ فشل ${enabled ? 'تفعيل' : 'تعطيل'} نظام الأزرار. يرجى المحاولة مرة أخرى.`,
                                embeds: [],
                                components: []
                            });
                        }
                        
                        actionCollector.stop();
                        collector.stop();
                    } catch (error) {
                        console.error(error);
                        await actionInteraction.update({
                            content: `❌ حدث خطأ: ${error.message}`,
                            embeds: [],
                            components: []
                        });
                        
                        actionCollector.stop();
                        collector.stop();
                    }
                }
            });
            
            // عند انتهاء وقت المجمع
            actionCollector.on('end', () => {
                if (!collector.ended) {
                    interaction.message.edit({
                        components: []
                    }).catch(console.error);
                }
            });
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة تفعيل/تعطيل نظام الإمبيد
async function handleToggleEmbed(interaction, userId, botManager, subscriptionManager) {
    // الحصول على اشتراك المستخدم
    const subscription = subscriptionManager.getSubscription(userId, interaction.guild.id);
    
    if (!subscription) {
        return interaction.update({
            content: 'ليس لديك اشتراك نشط في هذا السيرفر.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على قائمة توكنات البوتات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    if (botTokens.length === 0) {
        return interaction.update({
            content: 'ليس لديك بوتات مضافة إلى اشتراكك. يرجى التواصل مع الإدارة لإضافة بوت.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء القائمة المنسدلة لاختيار البوت
    const selectBot = new StringSelectMenuBuilder()
        .setCustomId('select_bot_for_embed')
        .setPlaceholder('اختر البوت الذي تريد تفعيل/تعطيل نظام الإمبيد له');
    
    // إضافة خيار "جميع البوتات"
    selectBot.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('جميع البوتات')
            .setDescription('تفعيل/تعطيل نظام الإمبيد لجميع بوتاتك')
            .setValue('all_bots')
            .setEmoji('🔄')
    );
    
    // إضافة البوتات إلى القائمة
    for (const token of botTokens) {
        const bot = botManager.getBot(token);
        
        if (bot) {
            const botInfo = bot.getBotInfo();
            selectBot.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${botInfo.username}${botInfo.isActive ? ' (نشط)' : ''}`)
                    .setDescription(`نظام الإمبيد: ${botInfo.useEmbed ? 'مفعل' : 'معطل'}`)
                    .setValue(token)
                    .setEmoji(botInfo.isActive ? '✅' : '🤖')
            );
        }
    }
    
    const botRow = new ActionRowBuilder().addComponents(selectBot);
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_info')
        .setLabel('العودة لمعلومات الاشتراك')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    // تحديث الرسالة
    await interaction.update({
        content: 'اختر البوت الذي تريد تفعيل/تعطيل نظام الإمبيد له:',
        embeds: [],
        components: [botRow, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع القائمة المنسدلة والزر
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== userId) {
            return i.reply({
                content: 'هذه القائمة ليست لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_info') {
            collector.stop();
            // إعادة عرض معلومات الاشتراك
            const subscription = subscriptionManager.getSubscription(userId, i.guild.id);
            await showSubscriptionInfo(await i.message.channel.messages.fetch(i.message.id), subscription, subscriptionManager);
            return;
        }
        
        // إذا تم اختيار بوت
        if (i.customId === 'select_bot_for_embed') {
            const selectedValue = i.values[0];
            
            // إنشاء أزرار التفعيل والتعطيل
            const enableButton = new ButtonBuilder()
                .setCustomId('enable_embed')
                .setLabel('تفعيل نظام الإمبيد')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');
            
            const disableButton = new ButtonBuilder()
                .setCustomId('disable_embed')
                .setLabel('تعطيل نظام الإمبيد')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');
            
            const actionRow = new ActionRowBuilder().addComponents(enableButton, disableButton);
            
            // إضافة زر العودة
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_bot_selection')
                .setLabel('العودة لاختيار البوت')
                .setStyle(ButtonStyle.Secondary);
            
            const buttonRow = new ActionRowBuilder().addComponents(backButton);
            
            // تحديث الرسالة
            await i.update({
                content: `اختر العملية ${selectedValue === 'all_bots' ? 'لجميع بوتاتك' : 'للبوت المحدد'}:`,
                embeds: [],
                components: [actionRow, buttonRow]
            });
            
            // إنشاء مجمع جديد للتفاعل مع الأزرار
            const actionCollector = message.createMessageComponentCollector({
                time: 60000 // دقيقة واحدة
            });
            
            // معالجة التفاعلات
            actionCollector.on('collect', async (actionInteraction) => {
                // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
                if (actionInteraction.user.id !== userId) {
                    return actionInteraction.reply({
                        content: 'هذه الأزرار ليست لك!',
                        ephemeral: true
                    });
                }
                
                // إذا تم النقر على زر العودة
                if (actionInteraction.customId === 'back_to_bot_selection') {
                    actionCollector.stop();
                    // إعادة عرض قائمة اختيار البوت
                    await actionInteraction.update({
                        content: 'اختر البوت الذي تريد تفعيل/تعطيل نظام الإمبيد له:',
                        embeds: [],
                        components: [botRow, buttonRow]
                    });
                    return;
                }
                
                // إذا تم اختيار تفعيل أو تعطيل
                if (actionInteraction.customId === 'enable_embed' || actionInteraction.customId === 'disable_embed') {
                    const enabled = actionInteraction.customId === 'enable_embed';
                    
                    try {
                        let result;
                        
                        // تفعيل/تعطيل نظام الإمبيد للبوت المحدد أو لجميع البوتات
                        if (selectedValue === 'all_bots') {
                            // تفعيل/تعطيل نظام الإمبيد لجميع البوتات
                            result = botManager.toggleEmbedForAllBots(enabled);
                        } else {
                            // التحقق من أن البوت ينتمي للمستخدم
                            if (!botTokens.includes(selectedValue)) {
                                return actionInteraction.update({
                                    content: 'هذا البوت ليس من ضمن بوتاتك!',
                                    embeds: [],
                                    components: []
                                });
                            }
                            
                            // تفعيل/تعطيل نظام الإمبيد للبوت المحدد
                            result = botManager.toggleEmbed(selectedValue, enabled);
                        }
                        
                        if (result) {
                            // إضافة زر العودة
                            const backButton = new ButtonBuilder()
                                .setCustomId('back_to_subscription_info')
                                .setLabel('العودة لمعلومات الاشتراك')
                                .setStyle(ButtonStyle.Secondary);
                            
                            const row = new ActionRowBuilder().addComponents(backButton);
                            
                            await actionInteraction.update({
                                content: `✅ تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الإمبيد بنجاح ${selectedValue === 'all_bots' ? 'لجميع بوتاتك' : 'للبوت المحدد'}.`,
                                embeds: [],
                                components: [row]
                            });
                        } else {
                            await actionInteraction.update({
                                content: `❌ فشل ${enabled ? 'تفعيل' : 'تعطيل'} نظام الإمبيد. يرجى المحاولة مرة أخرى.`,
                                embeds: [],
                                components: []
                            });
                        }
                        
                        actionCollector.stop();
                        collector.stop();
                    } catch (error) {
                        console.error(error);
                        await actionInteraction.update({
                            content: `❌ حدث خطأ: ${error.message}`,
                            embeds: [],
                            components: []
                        });
                        
                        actionCollector.stop();
                        collector.stop();
                    }
                }
            });
            
            // عند انتهاء وقت المجمع
            actionCollector.on('end', () => {
                if (!collector.ended) {
                    interaction.message.edit({
                        components: []
                    }).catch(console.error);
                }
            });
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}
