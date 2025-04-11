/**
 * أمر إدارة الاشتراكات
 * يقوم بإدارة اشتراكات المستخدمين والسيرفرات
 * متاح فقط في البوت الأساسي
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

module.exports = {
    name: 'subscription',
    aliases: ['sub', 'اشتراك'],
    description: 'إدارة اشتراكات البوتات',
    usage: '<prefix>subscription <add/info/extend/cancel/addbot/removebot> [معاملات إضافية]',
    category: 'admin',
    mainBotOnly: true, // متاح فقط في البوت الأساسي
    async execute(bot, message, args) {
        // التحقق من أن الأمر يتم تنفيذه في السيرفر الرئيسي للإدارة
        if (!message.guild) {
            return message.reply('هذا الأمر متاح فقط في السيرفرات.');
        }

        // التحقق من صلاحيات المستخدم
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('ليس لديك صلاحيات كافية لاستخدام هذا الأمر!');
        }

        // إنشاء مدير الاشتراكات
        const subscriptionManager = new SubscriptionManager();

        try {
            // إذا لم يتم تحديد معاملات، عرض قائمة منسدلة بالعمليات المتاحة
            if (!args.length) {
                await showSubscriptionMenu(message, subscriptionManager);
                return;
            }

            // تحديد العملية
            const operation = args[0].toLowerCase();

            switch (operation) {
                case 'add':
                case 'إضافة':
                    await handleAddSubscription(message, args, subscriptionManager);
                    break;
                
                case 'info':
                case 'معلومات':
                    await handleSubscriptionInfo(message, args, subscriptionManager);
                    break;
                
                case 'extend':
                case 'تمديد':
                    await handleExtendSubscription(message, args, subscriptionManager);
                    break;
                
                case 'cancel':
                case 'إلغاء':
                    await handleCancelSubscription(message, args, subscriptionManager);
                    break;
                
                case 'addbot':
                case 'إضافة_بوت':
                    await handleAddBot(message, args, subscriptionManager);
                    break;
                
                case 'removebot':
                case 'إزالة_بوت':
                    await handleRemoveBot(message, args, subscriptionManager);
                    break;
                
                case 'plans':
                case 'خطط':
                    await handleListPlans(message, subscriptionManager);
                    break;
                
                default:
                    message.reply(`العملية غير صالحة. العمليات المتاحة: add, info, extend, cancel, addbot, removebot, plans`);
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        } finally {
            // إغلاق اتصال قاعدة البيانات
            subscriptionManager.close();
        }
    }
};

// عرض قائمة منسدلة بالعمليات المتاحة
async function showSubscriptionMenu(message, subscriptionManager) {
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('نظام إدارة الاشتراكات')
        .setDescription('اختر العملية التي تريد تنفيذها من القائمة المنسدلة أدناه.')
        .setTimestamp();
    
    // إنشاء القائمة المنسدلة
    const select = new StringSelectMenuBuilder()
        .setCustomId('subscription_operation')
        .setPlaceholder('اختر العملية');
    
    // إضافة العمليات المتاحة
    select.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('إضافة اشتراك جديد')
            .setDescription('إضافة اشتراك جديد لمستخدم')
            .setValue('add')
            .setEmoji('➕'),
        new StringSelectMenuOptionBuilder()
            .setLabel('عرض معلومات اشتراك')
            .setDescription('عرض معلومات اشتراك مستخدم')
            .setValue('info')
            .setEmoji('ℹ️'),
        new StringSelectMenuOptionBuilder()
            .setLabel('تمديد اشتراك')
            .setDescription('تمديد مدة اشتراك مستخدم')
            .setValue('extend')
            .setEmoji('⏱️'),
        new StringSelectMenuOptionBuilder()
            .setLabel('إلغاء اشتراك')
            .setDescription('إلغاء اشتراك مستخدم')
            .setValue('cancel')
            .setEmoji('❌'),
        new StringSelectMenuOptionBuilder()
            .setLabel('إضافة بوت لاشتراك')
            .setDescription('إضافة بوت جديد لاشتراك مستخدم')
            .setValue('addbot')
            .setEmoji('🤖'),
        new StringSelectMenuOptionBuilder()
            .setLabel('إزالة بوت من اشتراك')
            .setDescription('إزالة بوت من اشتراك مستخدم')
            .setValue('removebot')
            .setEmoji('🗑️'),
        new StringSelectMenuOptionBuilder()
            .setLabel('عرض خطط الاشتراك')
            .setDescription('عرض جميع خطط الاشتراك المتاحة')
            .setValue('plans')
            .setEmoji('📋')
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
        
        // إنشاء نموذج إدخال مناسب للعملية
        switch (operation) {
            case 'add':
                await createAddSubscriptionForm(interaction, subscriptionManager);
                break;
            
            case 'info':
                await createUserIdForm(interaction, 'info', 'عرض معلومات اشتراك', subscriptionManager);
                break;
            
            case 'extend':
                await createExtendSubscriptionForm(interaction, subscriptionManager);
                break;
            
            case 'cancel':
                await createUserIdForm(interaction, 'cancel', 'إلغاء اشتراك', subscriptionManager);
                break;
            
            case 'addbot':
                await createAddBotForm(interaction, subscriptionManager);
                break;
            
            case 'removebot':
                await createRemoveBotForm(interaction, subscriptionManager);
                break;
            
            case 'plans':
                await handleListPlans(message, subscriptionManager);
                collector.stop();
                break;
            
            default:
                await interaction.update({
                    content: 'العملية غير صالحة. يرجى المحاولة مرة أخرى.',
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

// إنشاء نموذج إضافة اشتراك جديد
async function createAddSubscriptionForm(interaction, subscriptionManager) {
    // الحصول على جميع الخطط
    const plans = subscriptionManager.getAllPlans();
    
    if (plans.length === 0) {
        return interaction.update({
            content: 'لا توجد خطط اشتراك متاحة حاليًا.',
            embeds: [],
            components: []
        });
    }
    
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('إضافة اشتراك جديد')
        .setDescription('يرجى إدخال معرف المستخدم واختيار خطة الاشتراك.')
        .setTimestamp();
    
    // إنشاء حقل إدخال معرف المستخدم
    const userIdInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف المستخدم')
                .setPlaceholder('أدخل معرف المستخدم')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إنشاء القائمة المنسدلة لاختيار الخطة
    const selectPlan = new StringSelectMenuBuilder()
        .setCustomId('select_plan')
        .setPlaceholder('اختر خطة الاشتراك');
    
    // إضافة الخطط المتاحة
    plans.forEach(plan => {
        selectPlan.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(plan.name)
                .setDescription(`${plan.description} - ${plan.price}$`)
                .setValue(plan.name)
                .setEmoji('📋')
        );
    });
    
    const planRow = new ActionRowBuilder().addComponents(selectPlan);
    
    // إضافة زر التأكيد
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_add_subscription')
        .setLabel('إضافة الاشتراك')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, backButton);
    
    // تحديث الرسالة
    await interaction.update({
        embeds: [embed],
        components: [userIdInput, planRow, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع النموذج
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 300000 // 5 دقائق
    });
    
    // تخزين البيانات المدخلة
    const formData = {};
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا النموذج ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_menu') {
            collector.stop();
            await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
            return;
        }
        
        // إذا تم اختيار خطة
        if (i.customId === 'select_plan') {
            formData.planType = i.values[0];
            await i.update({
                content: `تم اختيار الخطة: ${formData.planType}`,
                embeds: [embed],
                components: [userIdInput, planRow, buttonRow]
            });
            return;
        }
        
        // إذا تم النقر على زر التأكيد
        if (i.customId === 'confirm_add_subscription') {
            // التحقق من إدخال جميع البيانات المطلوبة
            if (!formData.userId || !formData.planType) {
                return i.reply({
                    content: 'يرجى إدخال جميع البيانات المطلوبة!',
                    ephemeral: true
                });
            }
            
            // التحقق من صحة معرف المستخدم
            if (!/^\d+$/.test(formData.userId)) {
                return i.reply({
                    content: 'معرف المستخدم غير صالح. يجب أن يكون رقمًا.',
                    ephemeral: true
                });
            }
            
            // التحقق من وجود خطة الاشتراك
            const plan = subscriptionManager.getPlanByName(formData.planType);
            if (!plan) {
                return i.reply({
                    content: `خطة الاشتراك "${formData.planType}" غير موجودة.`,
                    ephemeral: true
                });
            }
            
            try {
                // إضافة الاشتراك
                const result = subscriptionManager.addSubscription(formData.userId, i.guild.id, formData.planType);
                
                if (result.success) {
                    const resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('تم إضافة الاشتراك بنجاح')
                        .setDescription(result.message)
                        .addFields(
                            { name: 'المستخدم', value: `<@${formData.userId}>`, inline: true },
                            { name: 'الخطة', value: formData.planType, inline: true },
                            { name: 'عدد البوتات المسموح', value: `${plan.max_bots}`, inline: true },
                            { name: 'المدة', value: `${plan.duration_days} يوم`, inline: true }
                        )
                        .setTimestamp();
                    
                    await i.update({
                        content: null,
                        embeds: [resultEmbed],
                        components: []
                    });
                } else {
                    await i.update({
                        content: `❌ ${result.message}`,
                        embeds: [],
                        components: []
                    });
                }
                
                collector.stop();
            } catch (error) {
                console.error(error);
                await i.reply({
                    content: `❌ حدث خطأ: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// إنشاء نموذج إدخال معرف المستخدم
async function createUserIdForm(interaction, operation, title, subscriptionManager) {
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription('يرجى إدخال معرف المستخدم.')
        .setTimestamp();
    
    // إنشاء حقل إدخال معرف المستخدم
    const userIdInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف المستخدم')
                .setPlaceholder('أدخل معرف المستخدم')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إضافة زر التأكيد
    const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_${operation}`)
        .setLabel('تأكيد')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, backButton);
    
    // تحديث الرسالة
    await interaction.update({
        embeds: [embed],
        components: [userIdInput, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع النموذج
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 300000 // 5 دقائق
    });
    
    // تخزين البيانات المدخلة
    const formData = {};
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا النموذج ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_menu') {
            collector.stop();
            await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
            return;
        }
        
        // إذا تم النقر على زر التأكيد
        if (i.customId === `confirm_${operation}`) {
            // التحقق من إدخال معرف المستخدم
            if (!formData.userId) {
                return i.reply({
                    content: 'يرجى إدخال معرف المستخدم!',
                    ephemeral: true
                });
            }
            
            // التحقق من صحة معرف المستخدم
            if (!/^\d+$/.test(formData.userId)) {
                return i.reply({
                    content: 'معرف المستخدم غير صالح. يجب أن يكون رقمًا.',
                    ephemeral: true
                });
            }
            
            try {
                switch (operation) {
                    case 'info':
                        await handleSubscriptionInfoWithUserId(i, formData.userId, subscriptionManager);
                        break;
                    
                    case 'cancel':
                        await handleCancelSubscriptionWithUserId(i, formData.userId, subscriptionManager);
                        break;
                }
                
                collector.stop();
            } catch (error) {
                console.error(error);
                await i.reply({
                    content: `❌ حدث خطأ: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة عرض معلومات الاشتراك باستخدام معرف المستخدم
async function handleSubscriptionInfoWithUserId(interaction, userId, subscriptionManager) {
    // الحصول على الاشتراك
    const subscription = subscriptionManager.getSubscription(userId, interaction.guild.id);
    
    if (!subscription) {
        return interaction.update({
            content: `لا يوجد اشتراك للمستخدم <@${userId}> في هذا السيرفر.`,
            embeds: [],
            components: []
        });
    }
    
    // الحصول على معلومات الخطة
    const plan = subscriptionManager.getPlanByName(subscription.plan_type);
    
    // تحويل التواريخ
    const startDate = new Date(subscription.start_date * 1000).toLocaleDateString();
    const endDate = new Date(subscription.end_date * 1000).toLocaleDateString();
    
    // تحويل قائمة التوكنات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    // إنشاء رسالة المعلومات
    const embed = new EmbedBuilder()
        .setColor(subscription.is_active ? '#00FF00' : '#FF0000')
        .setTitle('معلومات الاشتراك')
        .setDescription(`معلومات اشتراك المستخدم <@${userId}> في هذا السيرفر.`)
        .addFields(
            { name: 'الحالة', value: subscription.is_active ? 'نشط' : 'غير نشط', inline: true },
            { name: 'الخطة', value: subscription.plan_type, inline: true },
            { name: 'تاريخ البدء', value: startDate, inline: true },
            { name: 'تاريخ الانتهاء', value: endDate, inline: true },
            { name: 'عدد البوتات المستخدمة', value: `${botTokens.length}/${plan.max_bots}`, inline: true }
        )
        .setTimestamp();
    
    // إضافة قائمة البوتات إذا وجدت
    if (botTokens.length > 0) {
        embed.addFields({ name: 'توكنات البوتات', value: botTokens.map((token, index) => `${index + 1}. ${token.substring(0, 10)}...`).join('\n') });
    }
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
        content: null,
        embeds: [embed],
        components: [buttonRow]
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
        if (i.customId === 'back_to_subscription_menu') {
            collector.stop();
            await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة إلغاء الاشتراك باستخدام معرف المستخدم
async function handleCancelSubscriptionWithUserId(interaction, userId, subscriptionManager) {
    // إلغاء الاشتراك
    const result = subscriptionManager.cancelSubscription(userId, interaction.guild.id);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('تم إلغاء الاشتراك بنجاح')
            .setDescription(`تم إلغاء اشتراك المستخدم <@${userId}> بنجاح.`)
            .setTimestamp();
        
        // إضافة زر العودة
        const backButton = new ButtonBuilder()
            .setCustomId('back_to_subscription_menu')
            .setLabel('العودة للقائمة الرئيسية')
            .setStyle(ButtonStyle.Secondary);
        
        const buttonRow = new ActionRowBuilder().addComponents(backButton);
        
        await interaction.update({
            content: null,
            embeds: [embed],
            components: [buttonRow]
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
            if (i.customId === 'back_to_subscription_menu') {
                collector.stop();
                await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
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
            content: `❌ ${result.message}`,
            embeds: [],
            components: []
        });
    }
}

// إنشاء نموذج تمديد اشتراك
async function createExtendSubscriptionForm(interaction, subscriptionManager) {
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('تمديد اشتراك')
        .setDescription('يرجى إدخال معرف المستخدم وعدد الأيام.')
        .setTimestamp();
    
    // إنشاء حقل إدخال معرف المستخدم
    const userIdInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف المستخدم')
                .setPlaceholder('أدخل معرف المستخدم')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إنشاء حقل إدخال عدد الأيام
    const daysInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('days')
                .setLabel('عدد الأيام')
                .setPlaceholder('أدخل عدد الأيام')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إضافة زر التأكيد
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_extend')
        .setLabel('تمديد الاشتراك')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, backButton);
    
    // تحديث الرسالة
    await interaction.update({
        embeds: [embed],
        components: [userIdInput, daysInput, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع النموذج
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 300000 // 5 دقائق
    });
    
    // تخزين البيانات المدخلة
    const formData = {};
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا النموذج ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_menu') {
            collector.stop();
            await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
            return;
        }
        
        // إذا تم النقر على زر التأكيد
        if (i.customId === 'confirm_extend') {
            // التحقق من إدخال جميع البيانات المطلوبة
            if (!formData.userId || !formData.days) {
                return i.reply({
                    content: 'يرجى إدخال جميع البيانات المطلوبة!',
                    ephemeral: true
                });
            }
            
            // التحقق من صحة معرف المستخدم
            if (!/^\d+$/.test(formData.userId)) {
                return i.reply({
                    content: 'معرف المستخدم غير صالح. يجب أن يكون رقمًا.',
                    ephemeral: true
                });
            }
            
            // التحقق من صحة عدد الأيام
            const durationDays = parseInt(formData.days);
            if (isNaN(durationDays) || durationDays <= 0) {
                return i.reply({
                    content: 'عدد الأيام غير صالح. يجب أن يكون رقمًا موجبًا.',
                    ephemeral: true
                });
            }
            
            try {
                // تمديد الاشتراك
                const result = subscriptionManager.extendSubscription(formData.userId, i.guild.id, durationDays);
                
                if (result.success) {
                    // الحصول على الاشتراك المحدث
                    const subscription = subscriptionManager.getSubscription(formData.userId, i.guild.id);
                    const endDate = new Date(subscription.end_date * 1000).toLocaleDateString();
                    
                    const resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('تم تمديد الاشتراك بنجاح')
                        .setDescription(`تم تمديد اشتراك المستخدم <@${formData.userId}> بنجاح.`)
                        .addFields(
                            { name: 'المدة المضافة', value: `${durationDays} يوم`, inline: true },
                            { name: 'تاريخ الانتهاء الجديد', value: endDate, inline: true }
                        )
                        .setTimestamp();
                    
                    // إضافة زر العودة
                    const backButton = new ButtonBuilder()
                        .setCustomId('back_to_subscription_menu')
                        .setLabel('العودة للقائمة الرئيسية')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const buttonRow = new ActionRowBuilder().addComponents(backButton);
                    
                    await i.update({
                        content: null,
                        embeds: [resultEmbed],
                        components: [buttonRow]
                    });
                    
                    // إنشاء مجمع للتفاعل مع الزر
                    const buttonCollector = message.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 60000 // دقيقة واحدة
                    });
                    
                    // معالجة التفاعلات
                    buttonCollector.on('collect', async (buttonInteraction) => {
                        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
                        if (buttonInteraction.user.id !== interaction.user.id) {
                            return buttonInteraction.reply({
                                content: 'هذا الزر ليس لك!',
                                ephemeral: true
                            });
                        }
                        
                        // إذا تم النقر على زر العودة
                        if (buttonInteraction.customId === 'back_to_subscription_menu') {
                            buttonCollector.stop();
                            await showSubscriptionMenu(await buttonInteraction.message.channel.messages.fetch(buttonInteraction.message.id), subscriptionManager);
                        }
                    });
                    
                    // عند انتهاء وقت المجمع
                    buttonCollector.on('end', () => {
                        interaction.message.edit({
                            components: []
                        }).catch(console.error);
                    });
                } else {
                    await i.update({
                        content: `❌ ${result.message}`,
                        embeds: [],
                        components: []
                    });
                }
                
                collector.stop();
            } catch (error) {
                console.error(error);
                await i.reply({
                    content: `❌ حدث خطأ: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// إنشاء نموذج إضافة بوت إلى اشتراك
async function createAddBotForm(interaction, subscriptionManager) {
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('إضافة بوت إلى اشتراك')
        .setDescription('يرجى إدخال معرف المستخدم وتوكن البوت.')
        .setTimestamp();
    
    // إنشاء حقل إدخال معرف المستخدم
    const userIdInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف المستخدم')
                .setPlaceholder('أدخل معرف المستخدم')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إنشاء حقل إدخال توكن البوت
    const tokenInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('bot_token')
                .setLabel('توكن البوت')
                .setPlaceholder('أدخل توكن البوت')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إضافة زر التأكيد
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_add_bot')
        .setLabel('إضافة البوت')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, backButton);
    
    // تحديث الرسالة
    await interaction.update({
        embeds: [embed],
        components: [userIdInput, tokenInput, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع النموذج
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 300000 // 5 دقائق
    });
    
    // تخزين البيانات المدخلة
    const formData = {};
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا النموذج ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_menu') {
            collector.stop();
            await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
            return;
        }
        
        // إذا تم النقر على زر التأكيد
        if (i.customId === 'confirm_add_bot') {
            // التحقق من إدخال جميع البيانات المطلوبة
            if (!formData.userId || !formData.botToken) {
                return i.reply({
                    content: 'يرجى إدخال جميع البيانات المطلوبة!',
                    ephemeral: true
                });
            }
            
            // التحقق من صحة معرف المستخدم
            if (!/^\d+$/.test(formData.userId)) {
                return i.reply({
                    content: 'معرف المستخدم غير صالح. يجب أن يكون رقمًا.',
                    ephemeral: true
                });
            }
            
            try {
                // إضافة البوت
                const result = subscriptionManager.addBotToken(formData.userId, i.guild.id, formData.botToken);
                
                if (result.success) {
                    // الحصول على الاشتراك المحدث
                    const subscription = subscriptionManager.getSubscription(formData.userId, i.guild.id);
                    const plan = subscriptionManager.getPlanByName(subscription.plan_type);
                    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
                    
                    const resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('تم إضافة البوت بنجاح')
                        .setDescription(`تم إضافة البوت إلى اشتراك المستخدم <@${formData.userId}> بنجاح.`)
                        .addFields(
                            { name: 'عدد البوتات المستخدمة', value: `${botTokens.length}/${plan.max_bots}`, inline: true },
                            { name: 'توكن البوت', value: `${formData.botToken.substring(0, 10)}...`, inline: true }
                        )
                        .setTimestamp();
                    
                    // إضافة زر العودة
                    const backButton = new ButtonBuilder()
                        .setCustomId('back_to_subscription_menu')
                        .setLabel('العودة للقائمة الرئيسية')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const buttonRow = new ActionRowBuilder().addComponents(backButton);
                    
                    await i.update({
                        content: null,
                        embeds: [resultEmbed],
                        components: [buttonRow]
                    });
                    
                    // إنشاء مجمع للتفاعل مع الزر
                    const buttonCollector = message.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 60000 // دقيقة واحدة
                    });
                    
                    // معالجة التفاعلات
                    buttonCollector.on('collect', async (buttonInteraction) => {
                        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
                        if (buttonInteraction.user.id !== interaction.user.id) {
                            return buttonInteraction.reply({
                                content: 'هذا الزر ليس لك!',
                                ephemeral: true
                            });
                        }
                        
                        // إذا تم النقر على زر العودة
                        if (buttonInteraction.customId === 'back_to_subscription_menu') {
                            buttonCollector.stop();
                            await showSubscriptionMenu(await buttonInteraction.message.channel.messages.fetch(buttonInteraction.message.id), subscriptionManager);
                        }
                    });
                    
                    // عند انتهاء وقت المجمع
                    buttonCollector.on('end', () => {
                        interaction.message.edit({
                            components: []
                        }).catch(console.error);
                    });
                } else {
                    await i.update({
                        content: `❌ ${result.message}`,
                        embeds: [],
                        components: []
                    });
                }
                
                collector.stop();
            } catch (error) {
                console.error(error);
                await i.reply({
                    content: `❌ حدث خطأ: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// إنشاء نموذج إزالة بوت من اشتراك
async function createRemoveBotForm(interaction, subscriptionManager) {
    // إنشاء الإمبيد
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('إزالة بوت من اشتراك')
        .setDescription('يرجى إدخال معرف المستخدم وتوكن البوت.')
        .setTimestamp();
    
    // إنشاء حقل إدخال معرف المستخدم
    const userIdInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel('معرف المستخدم')
                .setPlaceholder('أدخل معرف المستخدم')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إنشاء حقل إدخال توكن البوت
    const tokenInput = new ActionRowBuilder()
        .addComponents(
            new TextInputBuilder()
                .setCustomId('bot_token')
                .setLabel('توكن البوت')
                .setPlaceholder('أدخل توكن البوت')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        );
    
    // إضافة زر التأكيد
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_remove_bot')
        .setLabel('إزالة البوت')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');
    
    // إضافة زر العودة
    const backButton = new ButtonBuilder()
        .setCustomId('back_to_subscription_menu')
        .setLabel('العودة للقائمة الرئيسية')
        .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, backButton);
    
    // تحديث الرسالة
    await interaction.update({
        embeds: [embed],
        components: [userIdInput, tokenInput, buttonRow]
    });
    
    // إنشاء مجمع للتفاعل مع النموذج
    const message = await interaction.message;
    const collector = message.createMessageComponentCollector({
        time: 300000 // 5 دقائق
    });
    
    // تخزين البيانات المدخلة
    const formData = {};
    
    // معالجة التفاعلات
    collector.on('collect', async (i) => {
        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
        if (i.user.id !== interaction.user.id) {
            return i.reply({
                content: 'هذا النموذج ليس لك!',
                ephemeral: true
            });
        }
        
        // إذا تم النقر على زر العودة
        if (i.customId === 'back_to_subscription_menu') {
            collector.stop();
            await showSubscriptionMenu(await i.message.channel.messages.fetch(i.message.id), subscriptionManager);
            return;
        }
        
        // إذا تم النقر على زر التأكيد
        if (i.customId === 'confirm_remove_bot') {
            // التحقق من إدخال جميع البيانات المطلوبة
            if (!formData.userId || !formData.botToken) {
                return i.reply({
                    content: 'يرجى إدخال جميع البيانات المطلوبة!',
                    ephemeral: true
                });
            }
            
            // التحقق من صحة معرف المستخدم
            if (!/^\d+$/.test(formData.userId)) {
                return i.reply({
                    content: 'معرف المستخدم غير صالح. يجب أن يكون رقمًا.',
                    ephemeral: true
                });
            }
            
            try {
                // إزالة البوت
                const result = subscriptionManager.removeBotToken(formData.userId, i.guild.id, formData.botToken);
                
                if (result.success) {
                    const resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('تم إزالة البوت بنجاح')
                        .setDescription(`تم إزالة البوت من اشتراك المستخدم <@${formData.userId}> بنجاح.`)
                        .addFields(
                            { name: 'توكن البوت', value: `${formData.botToken.substring(0, 10)}...`, inline: true }
                        )
                        .setTimestamp();
                    
                    // إضافة زر العودة
                    const backButton = new ButtonBuilder()
                        .setCustomId('back_to_subscription_menu')
                        .setLabel('العودة للقائمة الرئيسية')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const buttonRow = new ActionRowBuilder().addComponents(backButton);
                    
                    await i.update({
                        content: null,
                        embeds: [resultEmbed],
                        components: [buttonRow]
                    });
                    
                    // إنشاء مجمع للتفاعل مع الزر
                    const buttonCollector = message.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 60000 // دقيقة واحدة
                    });
                    
                    // معالجة التفاعلات
                    buttonCollector.on('collect', async (buttonInteraction) => {
                        // التحقق من أن المستخدم هو نفسه الذي أرسل الأمر
                        if (buttonInteraction.user.id !== interaction.user.id) {
                            return buttonInteraction.reply({
                                content: 'هذا الزر ليس لك!',
                                ephemeral: true
                            });
                        }
                        
                        // إذا تم النقر على زر العودة
                        if (buttonInteraction.customId === 'back_to_subscription_menu') {
                            buttonCollector.stop();
                            await showSubscriptionMenu(await buttonInteraction.message.channel.messages.fetch(buttonInteraction.message.id), subscriptionManager);
                        }
                    });
                    
                    // عند انتهاء وقت المجمع
                    buttonCollector.on('end', () => {
                        interaction.message.edit({
                            components: []
                        }).catch(console.error);
                    });
                } else {
                    await i.update({
                        content: `❌ ${result.message}`,
                        embeds: [],
                        components: []
                    });
                }
                
                collector.stop();
            } catch (error) {
                console.error(error);
                await i.reply({
                    content: `❌ حدث خطأ: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    });
    
    // عند انتهاء وقت المجمع
    collector.on('end', () => {
        interaction.message.edit({
            components: []
        }).catch(console.error);
    });
}

// معالجة عرض خطط الاشتراك
async function handleListPlans(message, subscriptionManager) {
    // الحصول على جميع الخطط
    const plans = subscriptionManager.getAllPlans();
    
    if (plans.length === 0) {
        return message.reply('لا توجد خطط اشتراك متاحة حاليًا.');
    }
    
    // إنشاء رسالة الخطط
    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('خطط الاشتراك المتاحة')
        .setDescription('قائمة بجميع خطط الاشتراك المتاحة حاليًا.')
        .setTimestamp();
    
    // إضافة كل خطة
    plans.forEach(plan => {
        const features = JSON.parse(plan.features || '[]');
        
        embed.addFields({
            name: `${plan.name} - ${plan.price}$`,
            value: `${plan.description}\n**المدة:** ${plan.duration_days} يوم\n**عدد البوتات:** ${plan.max_bots}\n**الميزات:** ${features.join(', ')}`
        });
    });
    
    message.channel.send({ embeds: [embed] });
}

// معالجة إضافة اشتراك جديد
async function handleAddSubscription(message, args, subscriptionManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 3) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `subscription add <معرف المستخدم> <نوع الخطة>`');
    }
    
    const userId = args[1];
    const planType = args[2].toLowerCase();
    
    // التحقق من صحة معرف المستخدم
    if (!/^\d+$/.test(userId)) {
        return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
    }
    
    // التحقق من وجود خطة الاشتراك
    const plan = subscriptionManager.getPlanByName(planType);
    if (!plan) {
        const plans = subscriptionManager.getAllPlans();
        let plansText = 'الخطط المتاحة:\n';
        plans.forEach(p => {
            plansText += `- ${p.name}: ${p.description} (${p.max_bots} بوت، ${p.duration_days} يوم، ${p.price}$)\n`;
        });
        return message.reply(`خطة الاشتراك "${planType}" غير موجودة.\n${plansText}`);
    }
    
    // إضافة الاشتراك
    const result = subscriptionManager.addSubscription(userId, message.guild.id, planType);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('تم إضافة الاشتراك بنجاح')
            .setDescription(result.message)
            .addFields(
                { name: 'المستخدم', value: `<@${userId}>`, inline: true },
                { name: 'الخطة', value: planType, inline: true },
                { name: 'عدد البوتات المسموح', value: `${plan.max_bots}`, inline: true },
                { name: 'المدة', value: `${plan.duration_days} يوم`, inline: true }
            )
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    } else {
        message.reply(`❌ ${result.message}`);
    }
}

// معالجة عرض معلومات الاشتراك
async function handleSubscriptionInfo(message, args, subscriptionManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `subscription info <معرف المستخدم>`');
    }
    
    const userId = args[1];
    
    // التحقق من صحة معرف المستخدم
    if (!/^\d+$/.test(userId)) {
        return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
    }
    
    // الحصول على الاشتراك
    const subscription = subscriptionManager.getSubscription(userId, message.guild.id);
    
    if (!subscription) {
        return message.reply(`لا يوجد اشتراك للمستخدم <@${userId}> في هذا السيرفر.`);
    }
    
    // الحصول على معلومات الخطة
    const plan = subscriptionManager.getPlanByName(subscription.plan_type);
    
    // تحويل التواريخ
    const startDate = new Date(subscription.start_date * 1000).toLocaleDateString();
    const endDate = new Date(subscription.end_date * 1000).toLocaleDateString();
    
    // تحويل قائمة التوكنات
    const botTokens = JSON.parse(subscription.bot_tokens || '[]');
    
    // إنشاء رسالة المعلومات
    const embed = new EmbedBuilder()
        .setColor(subscription.is_active ? '#00FF00' : '#FF0000')
        .setTitle('معلومات الاشتراك')
        .setDescription(`معلومات اشتراك المستخدم <@${userId}> في هذا السيرفر.`)
        .addFields(
            { name: 'الحالة', value: subscription.is_active ? 'نشط' : 'غير نشط', inline: true },
            { name: 'الخطة', value: subscription.plan_type, inline: true },
            { name: 'تاريخ البدء', value: startDate, inline: true },
            { name: 'تاريخ الانتهاء', value: endDate, inline: true },
            { name: 'عدد البوتات المستخدمة', value: `${botTokens.length}/${plan.max_bots}`, inline: true }
        )
        .setTimestamp();
    
    // إضافة قائمة البوتات إذا وجدت
    if (botTokens.length > 0) {
        embed.addFields({ name: 'توكنات البوتات', value: botTokens.map((token, index) => `${index + 1}. ${token.substring(0, 10)}...`).join('\n') });
    }
    
    message.channel.send({ embeds: [embed] });
}

// معالجة تمديد الاشتراك
async function handleExtendSubscription(message, args, subscriptionManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 3) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `subscription extend <معرف المستخدم> <عدد الأيام>`');
    }
    
    const userId = args[1];
    const durationDays = parseInt(args[2]);
    
    // التحقق من صحة معرف المستخدم
    if (!/^\d+$/.test(userId)) {
        return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
    }
    
    // التحقق من صحة عدد الأيام
    if (isNaN(durationDays) || durationDays <= 0) {
        return message.reply('عدد الأيام غير صالح. يجب أن يكون رقمًا موجبًا.');
    }
    
    // تمديد الاشتراك
    const result = subscriptionManager.extendSubscription(userId, message.guild.id, durationDays);
    
    if (result.success) {
        // الحصول على الاشتراك المحدث
        const subscription = subscriptionManager.getSubscription(userId, message.guild.id);
        const endDate = new Date(subscription.end_date * 1000).toLocaleDateString();
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('تم تمديد الاشتراك بنجاح')
            .setDescription(`تم تمديد اشتراك المستخدم <@${userId}> بنجاح.`)
            .addFields(
                { name: 'المدة المضافة', value: `${durationDays} يوم`, inline: true },
                { name: 'تاريخ الانتهاء الجديد', value: endDate, inline: true }
            )
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    } else {
        message.reply(`❌ ${result.message}`);
    }
}

// معالجة إلغاء الاشتراك
async function handleCancelSubscription(message, args, subscriptionManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `subscription cancel <معرف المستخدم>`');
    }
    
    const userId = args[1];
    
    // التحقق من صحة معرف المستخدم
    if (!/^\d+$/.test(userId)) {
        return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
    }
    
    // إلغاء الاشتراك
    const result = subscriptionManager.cancelSubscription(userId, message.guild.id);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('تم إلغاء الاشتراك بنجاح')
            .setDescription(`تم إلغاء اشتراك المستخدم <@${userId}> بنجاح.`)
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    } else {
        message.reply(`❌ ${result.message}`);
    }
}

// معالجة إضافة بوت إلى الاشتراك
async function handleAddBot(message, args, subscriptionManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 3) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `subscription addbot <معرف المستخدم> <توكن البوت>`');
    }
    
    const userId = args[1];
    const botToken = args[2];
    
    // التحقق من صحة معرف المستخدم
    if (!/^\d+$/.test(userId)) {
        return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
    }
    
    // إضافة البوت
    const result = subscriptionManager.addBotToken(userId, message.guild.id, botToken);
    
    if (result.success) {
        // الحصول على الاشتراك المحدث
        const subscription = subscriptionManager.getSubscription(userId, message.guild.id);
        const plan = subscriptionManager.getPlanByName(subscription.plan_type);
        const botTokens = JSON.parse(subscription.bot_tokens || '[]');
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('تم إضافة البوت بنجاح')
            .setDescription(`تم إضافة البوت إلى اشتراك المستخدم <@${userId}> بنجاح.`)
            .addFields(
                { name: 'عدد البوتات المستخدمة', value: `${botTokens.length}/${plan.max_bots}`, inline: true },
                { name: 'توكن البوت', value: `${botToken.substring(0, 10)}...`, inline: true }
            )
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    } else {
        message.reply(`❌ ${result.message}`);
    }
}

// معالجة إزالة بوت من الاشتراك
async function handleRemoveBot(message, args, subscriptionManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 3) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `subscription removebot <معرف المستخدم> <توكن البوت>`');
    }
    
    const userId = args[1];
    const botToken = args[2];
    
    // التحقق من صحة معرف المستخدم
    if (!/^\d+$/.test(userId)) {
        return message.reply('معرف المستخدم غير صالح. يجب أن يكون رقمًا.');
    }
    
    // إزالة البوت
    const result = subscriptionManager.removeBotToken(userId, message.guild.id, botToken);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('تم إزالة البوت بنجاح')
            .setDescription(`تم إزالة البوت من اشتراك المستخدم <@${userId}> بنجاح.`)
            .addFields(
                { name: 'توكن البوت', value: `${botToken.substring(0, 10)}...`, inline: true }
            )
            .setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    } else {
        message.reply(`❌ ${result.message}`);
    }
}
