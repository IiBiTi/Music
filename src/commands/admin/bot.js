/**
 * أمر إدارة البوتات المتعددة مع قائمة منسدلة
 * يقوم بإدارة البوتات المتعددة وإضافة وإزالة البوتات باستخدام واجهة تفاعلية
 */

const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');
const MultiBotManager = require('../../utils/multiBotManager');
const config = require('../../../config/config');

module.exports = {
    name: 'bot',
    aliases: ['بوت'],
    description: 'إدارة البوتات المتعددة باستخدام واجهة تفاعلية',
    usage: '<prefix>bot',
    category: 'admin',
    mainBotOnly: true, // هذا الأمر متاح فقط في البوت الرئيسي
    async execute(bot, message, args) {
        // التحقق من صلاحيات المستخدم
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('ليس لديك صلاحيات كافية لاستخدام هذا الأمر!');
        }

        // إنشاء مدير البوتات المتعددة
        const botManager = new MultiBotManager();

        // إنشاء القائمة الرئيسية
        await showMainMenu(message, botManager);
    }
};

// عرض القائمة الرئيسية
async function showMainMenu(message, botManager) {
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('نظام إدارة البوتات المتعددة')
        .setDescription('اختر العملية التي تريد تنفيذها من القائمة المنسدلة أدناه.')
        .addFields(
            { name: 'عدد البوتات النشطة', value: `${botManager.getAllBots().length}`, inline: true },
            { name: 'البوت النشط', value: botManager.getActiveBot() ? botManager.getActiveBot().getBotInfo().username : 'لا يوجد', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'نظام إدارة البوتات المتعددة', iconURL: message.client.user.displayAvatarURL() });

    // إنشاء القائمة المنسدلة
    const select = new StringSelectMenuBuilder()
        .setCustomId('bot_operations')
        .setPlaceholder('اختر العملية')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('عرض قائمة البوتات')
                .setDescription('عرض قائمة البوتات النشطة')
                .setValue('list')
                .setEmoji('📋'),
            new StringSelectMenuOptionBuilder()
                .setLabel('إضافة بوت جديد')
                .setDescription('إضافة بوت جديد إلى النظام')
                .setValue('add')
                .setEmoji('➕'),
            new StringSelectMenuOptionBuilder()
                .setLabel('إزالة بوت')
                .setDescription('إزالة بوت من النظام')
                .setValue('remove')
                .setEmoji('➖'),
            new StringSelectMenuOptionBuilder()
                .setLabel('معلومات بوت')
                .setDescription('عرض معلومات بوت محدد')
                .setValue('info')
                .setEmoji('ℹ️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('البوت النشط')
                .setDescription('عرض معلومات البوت النشط')
                .setValue('active')
                .setEmoji('✅'),
            new StringSelectMenuOptionBuilder()
                .setLabel('تبديل البوت النشط')
                .setDescription('تغيير البوت النشط')
                .setValue('switch')
                .setEmoji('🔄'),
            new StringSelectMenuOptionBuilder()
                .setLabel('تشغيل بوت')
                .setDescription('تشغيل بوت جديد')
                .setValue('start')
                .setEmoji('▶️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('إيقاف بوت')
                .setDescription('إيقاف بوت محدد')
                .setValue('stop')
                .setEmoji('⏹️'),
            new StringSelectMenuOptionBuilder()
                .setLabel('إيقاف جميع البوتات')
                .setDescription('إيقاف جميع البوتات النشطة')
                .setValue('stopall')
                .setEmoji('🛑'),
            new StringSelectMenuOptionBuilder()
                .setLabel('تثبيت البوت بالروم')
                .setDescription('تثبيت البوت بالروم الحالي')
                .setValue('pin')
                .setEmoji('📌')
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

        // تنفيذ العملية المناسبة
        try {
            switch (operation) {
                case 'list':
                    await handleListBots(interaction, botManager);
                    break;
                
                case 'add':
                    await interaction.update({
                        content: 'لإضافة بوت جديد، استخدم الأمر التالي:\n`!bot add <توكن البوت> [البادئة] [المنصة]`',
                        embeds: [],
                        components: []
                    });
                    
                    // إنشاء مجمع للرسائل لانتظار رد المستخدم
                    const addFilter = m => m.author.id === message.author.id && m.content.startsWith('!bot add');
                    const addCollector = message.channel.createMessageCollector({ filter: addFilter, time: 60000, max: 1 });
                    
                    addCollector.on('collect', async (msg) => {
                        const args = msg.content.slice('!bot add'.length).trim().split(/ +/);
                        await handleAddBot(msg, ['add', ...args], botManager);
                    });
                    
                    addCollector.on('end', (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            message.channel.send('انتهت مهلة إضافة البوت. يرجى المحاولة مرة أخرى.');
                        }
                    });
                    break;
                
                case 'remove':
                    await showBotSelectionMenu(interaction, botManager, 'remove', 'اختر البوت الذي تريد إزالته');
                    break;
                
                case 'info':
                    await showBotSelectionMenu(interaction, botManager, 'info', 'اختر البوت الذي تريد عرض معلوماته');
                    break;
                
                case 'active':
                    await handleActiveBot(interaction, botManager);
                    break;
                
                case 'switch':
                    await showBotSelectionMenu(interaction, botManager, 'switch', 'اختر البوت الذي تريد تعيينه كبوت نشط');
                    break;
                
                case 'start':
                    await interaction.update({
                        content: 'لتشغيل بوت جديد، استخدم الأمر التالي:\n`!bot start <توكن البوت> [البادئة] [المنصة]`',
                        embeds: [],
                        components: []
                    });
                    
                    // إنشاء مجمع للرسائل لانتظار رد المستخدم
                    const startFilter = m => m.author.id === message.author.id && m.content.startsWith('!bot start');
                    const startCollector = message.channel.createMessageCollector({ filter: startFilter, time: 60000, max: 1 });
                    
                    startCollector.on('collect', async (msg) => {
                        const args = msg.content.slice('!bot start'.length).trim().split(/ +/);
                        await handleStartBot(msg, ['start', ...args], botManager);
                    });
                    
                    startCollector.on('end', (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            message.channel.send('انتهت مهلة تشغيل البوت. يرجى المحاولة مرة أخرى.');
                        }
                    });
                    break;
                
                case 'stop':
                    await showBotSelectionMenu(interaction, botManager, 'stop', 'اختر البوت الذي تريد إيقافه');
                    break;
                
                case 'stopall':
                    await handleStopAllBots(interaction, botManager);
                    break;
                
                case 'pin':
                    await handlePinBot(interaction, message, botManager);
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

// عرض قائمة اختيار البوت
async function showBotSelectionMenu(interaction, botManager, operation, placeholder) {
    const botsInfo = botManager.getAllBotsInfo();
    
    if (botsInfo.length === 0) {
        return interaction.update({
            content: 'لا توجد بوتات نشطة حاليًا.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء القائمة المنسدلة لاختيار البوت
    const select = new StringSelectMenuBuilder()
        .setCustomId(`bot_select_${operation}`)
        .setPlaceholder(placeholder);
    
    // إضافة البوتات إلى القائمة
    botsInfo.forEach((bot, index) => {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${index + 1}. ${bot.username}${bot.isActive ? ' (نشط)' : ''}`)
                .setDescription(`المنصة: ${bot.platform}, البادئة: ${bot.prefix}`)
                .setValue(bot.id)
                .setEmoji(bot.isActive ? '✅' : '🤖')
        );
    });
    
    const row = new ActionRowBuilder().addComponents(select);
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_main_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    // تحديث الرسالة مع القائمة المنسدلة
    await interaction.update({
        content: `اختر البوت من القائمة:`,
        embeds: [],
        components: [row, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع القائمة المنسدلة
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذه القائمة ليست لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_main_menu') {
            collector.stop();
            return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
        }
        
        // إذا تم اختيار بوت
        if (i.customId === `bot_select_${operation}`) {
            const botId = i.values[0];
            const bot = botManager.getAllBots().find(b => b.getBotInfo().id === botId);
            
            if (!bot) {
                return i.update({
                    content: 'البوت غير موجود. يرجى المحاولة مرة أخرى.',
                    embeds: [],
                    components: []
                });
            }
            
            // تنفيذ العملية المناسبة
            switch (operation) {
                case 'remove':
                    await handleRemoveBot(i, ['remove', bot.token], botManager);
                    break;
                
                case 'info':
                    await handleBotInfo(i, ['info', bot.token], botManager);
                    break;
                
                case 'switch':
                    await handleSwitchActiveBot(i, ['switch', bot.token], botManager);
                    break;
                
                case 'stop':
                    await handleStopBot(i, ['stop', bot.token], botManager);
                    break;
                
                default:
                    await i.update({
                        content: 'العملية غير صالحة. يرجى المحاولة مرة أخرى.',
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
            content: 'انتهت مهلة القائمة. استخدم الأمر مرة أخرى إذا كنت بحاجة إليه.',
            components: []
        }).catch(console.error);
    });
}

// معالجة عرض قائمة البوتات
async function handleListBots(interaction, botManager) {
    const botsInfo = botManager.getAllBotsInfo();
    
    if (botsInfo.length === 0) {
        return interaction.update({
            content: 'لا توجد بوتات نشطة حاليًا.',
            embeds: [],
            components: []
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('قائمة البوتات النشطة')
        .setDescription(`عدد البوتات النشطة: ${botsInfo.length}`)
        .setTimestamp();
    
    botsInfo.forEach((bot, index) => {
        embed.addFields({
            name: `${index + 1}. ${bot.username} ${bot.isActive ? '(نشط)' : ''}`,
            value: `ID: ${bot.id}\nالمنصة: ${bot.platform}\nالبادئة: ${bot.prefix}\nعدد السيرفرات: ${bot.guildCount}\nالتوكن: ${bot.token}`
        });
    });
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_main_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
        embeds: [embed],
        components: [row],
        content: null
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
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا الزر ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_main_menu') {
            collector.stop();
            return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة إضافة بوت جديد
async function handleAddBot(message, args, botManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `!bot add <توكن البوت> [البادئة] [المنصة]`');
    }
    
    const token = args[1];
    const prefix = args.length > 2 ? args[2] : config.defaultSettings.prefix;
    const platform = args.length > 3 ? args[3] : config.defaultSettings.defaultPlatform;
    
    // التحقق من صحة التوكن
    if (token.length < 50) {
        return message.reply('توكن البوت غير صالح. يجب أن يكون طوله على الأقل 50 حرفًا.');
    }
    
    const loadingMsg = await message.channel.send('⏳ جاري إضافة البوت... قد يستغرق هذا بضع ثوانٍ.');
    
    try {
        // إنشاء البوت
        const bot = await botManager.createBot(token, {
            prefix,
            defaultPlatform: platform,
            isMainBot: false // تعيين البوت كبوت إضافي وليس رئيسي
        });
        
        // انتظار تسجيل الدخول
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // الحصول على معلومات البوت
        const botInfo = bot.getBotInfo();
        
        if (!botInfo) {
            throw new Error('فشل الحصول على معلومات البوت. تأكد من صحة التوكن.');
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('تم إضافة البوت بنجاح')
            .setThumbnail(botInfo.avatar)
            .addFields(
                { name: 'اسم البوت', value: botInfo.username, inline: true },
                { name: 'معرف البوت', value: botInfo.id, inline: true },
                { name: 'البادئة', value: botInfo.prefix, inline: true },
                { name: 'المنصة', value: botInfo.platform, inline: true }
            )
            .setTimestamp();
        
        // إضافة زر العودة
        const backButton = new ButtonBuilder()
            .setCustomId('back_to_main_menu')
            .setLabel('العودة للقائمة الرئيسية')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder().addComponents(backButton);
        
        await loadingMsg.edit({
            content: null,
            embeds: [embed],
            components: [row]
        });
        
        // إنشاء مجمع للتفاعل مع الزر
        const collector = loadingMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // دقيقة واحدة
        });
        
        // معالجة التفاعلات
        collector.on('collect', async (i) => {
            // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
            if (i.user.id !== message.author.id) {
                return i.reply({
                    content: 'هذا الزر ليس لك!',
                    ephemeral: true
                });
            }
            
            // إذا تم النقر على زر العودة
            if (i.customId === 'back_to_main_menu') {
                collector.stop();
                return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
            }
        });
        
        // عند انتهاء وقت المجمع
        collector.on('end', () => {
            loadingMsg.edit({
                components: []
            }).catch(console.error);
        });
    } catch (error) {
        console.error('فشل إضافة البوت:', error);
        await loadingMsg.edit(`❌ فشل إضافة البوت: ${error.message}`);
    }
}

// معالجة إزالة بوت
async function handleRemoveBot(interaction, args, botManager) {
    const token = args[1];
    
    // إزالة البوت
    const result = botManager.removeBot(token);
    
    if (result) {
        // إضافة زر العودة
        const backButton = new ButtonBuilder()
            .setCustomId('back_to_main_menu')
            .setLabel('العودة للقائمة الرئيسية')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder().addComponents(backButton);
        
        await interaction.update({
            content: '✅ تم إزالة البوت بنجاح.',
            embeds: [],
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
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'هذا الزر ليس لك!',
                    ephemeral: true
                });
            }
            
            // إذا تم النقر على زر العودة
            if (i.customId === 'back_to_main_menu') {
                collector.stop();
                return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
            }
        });
        
        // عند انتهاء وقت المجمع
        collector.on('end', () => {
            interaction.message.edit({
                components: []
            }).catch(console.error);
        });
    } else {
        await interaction.update({
            content: '❌ فشل إزالة البوت. تأكد من صحة التوكن أو رقم البوت.',
            embeds: [],
            components: []
        });
    }
}

// معالجة عرض معلومات بوت
async function handleBotInfo(interaction, args, botManager) {
    const token = args[1];
    const bot = botManager.getBot(token);
    
    if (!bot) {
        return interaction.update({
            content: 'البوت غير موجود. تأكد من صحة التوكن.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على معلومات البوت
    const botInfo = bot.getBotInfo();
    
    if (!botInfo) {
        return interaction.update({
            content: 'فشل الحصول على معلومات البوت.',
            embeds: [],
            components: []
        });
    }
    
    // تنسيق وقت التشغيل
    const uptime = botInfo.uptime;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`معلومات البوت: ${botInfo.username}`)
        .setThumbnail(botInfo.avatar)
        .addFields(
            { name: 'معرف البوت', value: botInfo.id, inline: true },
            { name: 'التاج', value: botInfo.tag, inline: true },
            { name: 'الحالة', value: botInfo.status, inline: true },
            { name: 'المنصة', value: botInfo.platform, inline: true },
            { name: 'البادئة', value: botInfo.prefix, inline: true },
            { name: 'عدد السيرفرات', value: botInfo.guildCount.toString(), inline: true },
            { name: 'نظام الأزرار', value: botInfo.useButtons ? 'مفعل' : 'معطل', inline: true },
            { name: 'نظام الإمبيد', value: botInfo.useEmbed ? 'مفعل' : 'معطل', inline: true },
            { name: 'وقت التشغيل', value: uptimeString, inline: true },
            { name: 'تاريخ الإنشاء', value: botInfo.createdAt.toLocaleDateString(), inline: true }
        )
        .setTimestamp();
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_main_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(backButton);
    
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
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا الزر ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_main_menu') {
            collector.stop();
            return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة عرض معلومات البوت النشط
async function handleActiveBot(interaction, botManager) {
    const activeBot = botManager.getActiveBot();
    
    if (!activeBot) {
        return interaction.update({
            content: 'لا يوجد بوت نشط حاليًا.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على معلومات البوت النشط
    const botInfo = activeBot.getBotInfo();
    
    if (!botInfo) {
        return interaction.update({
            content: 'فشل الحصول على معلومات البوت النشط.',
            embeds: [],
            components: []
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`البوت النشط: ${botInfo.username}`)
        .setThumbnail(botInfo.avatar)
        .addFields(
            { name: 'معرف البوت', value: botInfo.id, inline: true },
            { name: 'البادئة', value: botInfo.prefix, inline: true },
            { name: 'المنصة', value: botInfo.platform, inline: true },
            { name: 'عدد السيرفرات', value: botInfo.guildCount.toString(), inline: true }
        )
        .setTimestamp();
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_main_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(backButton);
    
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
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا الزر ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_main_menu') {
            collector.stop();
            return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
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
async function handleSwitchActiveBot(interaction, args, botManager) {
    const token = args[1];
    
    // تبديل البوت النشط
    const result = botManager.setActiveBot(token);
    
    if (result) {
        const activeBot = botManager.getActiveBot();
        const botInfo = activeBot.getBotInfo();
        
        // إضافة زر العودة
        const backButton = new ButtonBuilder()
            .setCustomId('back_to_main_menu')
            .setLabel('العودة للقائمة الرئيسية')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder().addComponents(backButton);
        
        await interaction.update({
            content: `✅ تم تبديل البوت النشط إلى: ${botInfo.username} (${botInfo.id})`,
            embeds: [],
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
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'هذا الزر ليس لك!',
                    ephemeral: true
                });
            }
            
            // إذا تم النقر على زر العودة
            if (i.customId === 'back_to_main_menu') {
                collector.stop();
                return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
            }
        });
        
        // عند انتهاء وقت المجمع
        collector.on('end', () => {
            interaction.message.edit({
                components: []
            }).catch(console.error);
        });
    } else {
        await interaction.update({
            content: '❌ فشل تبديل البوت النشط. تأكد من صحة التوكن أو رقم البوت.',
            embeds: [],
            components: []
        });
    }
}

// معالجة تشغيل بوت
async function handleStartBot(message, args, botManager) {
    // نفس منطق إضافة بوت جديد
    await handleAddBot(message, args, botManager);
}

// معالجة إيقاف بوت
async function handleStopBot(interaction, args, botManager) {
    const token = args[1];
    
    // إزالة البوت
    const result = botManager.removeBot(token);
    
    if (result) {
        // إضافة زر العودة
        const backButton = new ButtonBuilder()
            .setCustomId('back_to_main_menu')
            .setLabel('العودة للقائمة الرئيسية')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder().addComponents(backButton);
        
        await interaction.update({
            content: '✅ تم إيقاف البوت بنجاح.',
            embeds: [],
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
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'هذا الزر ليس لك!',
                    ephemeral: true
                });
            }
            
            // إذا تم النقر على زر العودة
            if (i.customId === 'back_to_main_menu') {
                collector.stop();
                return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
            }
        });
        
        // عند انتهاء وقت المجمع
        collector.on('end', () => {
            interaction.message.edit({
                components: []
            }).catch(console.error);
        });
    } else {
        await interaction.update({
            content: '❌ فشل إيقاف البوت. تأكد من صحة التوكن أو رقم البوت.',
            embeds: [],
            components: []
        });
    }
}

// معالجة إيقاف جميع البوتات
async function handleStopAllBots(interaction, botManager) {
    // إضافة زر تأكيد وزر إلغاء
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_stop_all')
        .setLabel('تأكيد')
        .setStyle(ButtonStyle.Danger);
    
    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_stop_all')
        .setLabel('إلغاء')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
    await interaction.update({
        content: '⚠️ هل أنت متأكد من أنك تريد إيقاف جميع البوتات؟',
        embeds: [],
        components: [row]
    });
    
    // إنشاء مجمع للتفاعل مع الأزرار
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // دقيقة واحدة
    });
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا الزر ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر التأكيد
        if (i.customId === 'confirm_stop_all') {
            const result = botManager.stopAllBots();
            
            if (result) {
                await i.update({
                    content: '✅ تم إيقاف جميع البوتات بنجاح.',
                    embeds: [],
                    components: []
                });
            } else {
                await i.update({
                    content: '❌ فشل إيقاف بعض البوتات.',
                    embeds: [],
                    components: []
                });
            }
            
            collector.stop();
        }
        
        // إذا تم النقر على زر الإلغاء
        if (i.customId === 'cancel_stop_all') {
            collector.stop();
            return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة تثبيت البوت بالروم
async function handlePinBot(interaction, message, botManager) {
    // الحصول على البوت النشط
    const activeBot = botManager.getActiveBot();
    
    if (!activeBot) {
        return interaction.update({
            content: 'لا يوجد بوت نشط حاليًا. يرجى تعيين بوت نشط أولاً.',
            embeds: [],
            components: []
        });
    }
    
    // الحصول على معلومات الروم
    const channel = message.channel;
    
    try {
        // تثبيت البوت بالروم
        const pinnedChannels = activeBot.options.pinnedChannels || [];
        
        // التحقق مما إذا كان الروم مثبتًا بالفعل
        const isAlreadyPinned = pinnedChannels.includes(channel.id);
        
        if (isAlreadyPinned) {
            // إزالة الروم من قائمة الرومات المثبتة
            const updatedPinnedChannels = pinnedChannels.filter(id => id !== channel.id);
            
            // تحديث إعدادات البوت
            botManager.updateBotSettings(activeBot.token, {
                pinnedChannels: updatedPinnedChannels
            });
            
            // إضافة زر العودة
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_main_menu')
                .setLabel('العودة للقائمة الرئيسية')
                .setStyle(ButtonStyle.Secondary);
            
            const row = new ActionRowBuilder().addComponents(backButton);
            
            await interaction.update({
                content: `✅ تم إلغاء تثبيت البوت "${activeBot.getBotInfo().username}" من الروم "${channel.name}".`,
                embeds: [],
                components: [row]
            });
        } else {
            // إضافة الروم إلى قائمة الرومات المثبتة
            pinnedChannels.push(channel.id);
            
            // تحديث إعدادات البوت
            botManager.updateBotSettings(activeBot.token, {
                pinnedChannels: pinnedChannels
            });
            
            // إضافة زر العودة
            const backButton = new ButtonBuilder()
                .setCustomId('back_to_main_menu')
                .setLabel('العودة للقائمة الرئيسية')
                .setStyle(ButtonStyle.Secondary);
            
            const row = new ActionRowBuilder().addComponents(backButton);
            
            await interaction.update({
                content: `✅ تم تثبيت البوت "${activeBot.getBotInfo().username}" في الروم "${channel.name}". البوت الآن سيستقبل الأوامر بدون برفكس في هذا الروم.`,
                embeds: [],
                components: [row]
            });
        }
        
        // إنشاء مجمع للتفاعل مع الزر
        const messageObj = await interaction.message;
        const collector = messageObj.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // دقيقة واحدة
        });
        
        // معالجة التفاعلات
        collector.on('collect', async (i) => {
            // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'هذا الزر ليس لك!',
                    ephemeral: true
                });
            }
            
            // إذا تم النقر على زر العودة
            if (i.customId === 'back_to_main_menu') {
                collector.stop();
                return showMainMenu(await i.message.channel.messages.fetch(i.message.id), botManager);
            }
        });
        
        // عند انتهاء وقت المجمع
        collector.on('end', () => {
            interaction.message.edit({
                components: []
            }).catch(console.error);
        });
    } catch (error) {
        console.error('فشل تثبيت البوت بالروم:', error);
        await interaction.update({
            content: `❌ فشل تثبيت البوت بالروم: ${error.message}`,
            embeds: [],
            components: []
        });
    }
}
