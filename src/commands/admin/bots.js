/**
 * أمر إدارة البوتات المتعددة
 * يقوم بإدارة البوتات المتعددة وإضافة وإزالة البوتات
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MultiBotManager = require('../../utils/multiBotManager');
const config = require('../../../config/config');

module.exports = {
    name: 'bots',
    aliases: ['bot', 'botmanager', 'مدير_البوتات'],
    description: 'إدارة البوتات المتعددة',
    usage: '<prefix>bots <list/add/remove/info/active/switch> [معاملات إضافية]',
    category: 'admin',
    async execute(bot, message, args) {
        // التحقق من صلاحيات المستخدم
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('ليس لديك صلاحيات كافية لاستخدام هذا الأمر!');
        }

        // التحقق من وجود معاملات
        if (!args.length) {
            return message.reply(`استخدام غير صحيح! الاستخدام الصحيح: \`${this.usage.replace('<prefix>', bot.options.prefix)}\``);
        }

        // إنشاء مدير البوتات المتعددة
        const botManager = new MultiBotManager();

        // تحديد العملية
        const operation = args[0].toLowerCase();

        try {
            switch (operation) {
                case 'list':
                case 'قائمة':
                    await handleListBots(message, botManager);
                    break;
                
                case 'add':
                case 'إضافة':
                    await handleAddBot(message, args, botManager);
                    break;
                
                case 'remove':
                case 'إزالة':
                    await handleRemoveBot(message, args, botManager);
                    break;
                
                case 'info':
                case 'معلومات':
                    await handleBotInfo(message, args, botManager);
                    break;
                
                case 'active':
                case 'النشط':
                    await handleActiveBot(message, botManager);
                    break;
                
                case 'switch':
                case 'تبديل':
                    await handleSwitchActiveBot(message, args, botManager);
                    break;
                
                case 'start':
                case 'تشغيل':
                    await handleStartBot(message, args, botManager);
                    break;
                
                case 'stop':
                case 'إيقاف':
                    await handleStopBot(message, args, botManager);
                    break;
                
                default:
                    message.reply(`العملية غير صالحة. العمليات المتاحة: list, add, remove, info, active, switch, start, stop`);
            }
        } catch (error) {
            console.error(error);
            message.reply(`❌ حدث خطأ: ${error.message}`);
        }
    }
};

// معالجة عرض قائمة البوتات
async function handleListBots(message, botManager) {
    const botsInfo = botManager.getAllBotsInfo();
    
    if (botsInfo.length === 0) {
        return message.reply('لا توجد بوتات نشطة حاليًا.');
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
    
    message.channel.send({ embeds: [embed] });
}

// معالجة إضافة بوت جديد
async function handleAddBot(message, args, botManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `bots add <توكن البوت> [البادئة] [المنصة]`');
    }
    
    const token = args[1];
    const prefix = args.length > 2 ? args[2] : config.defaultSettings.prefix;
    const platform = args.length > 3 ? args[3] : config.defaultSettings.defaultPlatform;
    
    // التحقق من صحة التوكن
    if (token.length < 50) {
        return message.reply('توكن البوت غير صالح. يجب أن يكون طوله على الأقل 50 حرفًا.');
    }
    
    message.channel.send('⏳ جاري إضافة البوت... قد يستغرق هذا بضع ثوانٍ.');
    
    try {
        // إنشاء البوت
        const bot = await botManager.createBot(token, {
            prefix,
            defaultPlatform: platform
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
        
        message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('فشل إضافة البوت:', error);
        message.reply(`❌ فشل إضافة البوت: ${error.message}`);
    }
}

// معالجة إزالة بوت
async function handleRemoveBot(message, args, botManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `bots remove <توكن البوت/رقم البوت>`');
    }
    
    const identifier = args[1];
    let token;
    
    // التحقق مما إذا كان المعرف رقمًا (رقم البوت في القائمة) أو توكن
    if (/^\d+$/.test(identifier)) {
        const index = parseInt(identifier) - 1;
        const botsInfo = botManager.getAllBotsInfo();
        
        if (index < 0 || index >= botsInfo.length) {
            return message.reply('رقم البوت غير صالح. استخدم `bots list` لعرض قائمة البوتات المتاحة.');
        }
        
        // استخراج التوكن من معلومات البوت
        const botInfo = botsInfo[index];
        const bot = botManager.getAllBots()[index];
        token = bot.token;
    } else {
        token = identifier;
    }
    
    // إزالة البوت
    const result = botManager.removeBot(token);
    
    if (result) {
        message.channel.send('✅ تم إزالة البوت بنجاح.');
    } else {
        message.reply('❌ فشل إزالة البوت. تأكد من صحة التوكن أو رقم البوت.');
    }
}

// معالجة عرض معلومات بوت
async function handleBotInfo(message, args, botManager) {
    let bot;
    
    // إذا لم يتم تحديد بوت، استخدم البوت النشط
    if (args.length < 2) {
        bot = botManager.getActiveBot();
        if (!bot) {
            return message.reply('لا يوجد بوت نشط حاليًا. استخدم `bots list` لعرض قائمة البوتات المتاحة.');
        }
    } else {
        const identifier = args[1];
        
        // التحقق مما إذا كان المعرف رقمًا (رقم البوت في القائمة) أو توكن
        if (/^\d+$/.test(identifier)) {
            const index = parseInt(identifier) - 1;
            const bots = botManager.getAllBots();
            
            if (index < 0 || index >= bots.length) {
                return message.reply('رقم البوت غير صالح. استخدم `bots list` لعرض قائمة البوتات المتاحة.');
            }
            
            bot = bots[index];
        } else {
            bot = botManager.getBot(identifier);
            if (!bot) {
                return message.reply('البوت غير موجود. تأكد من صحة التوكن أو استخدم `bots list` لعرض قائمة البوتات المتاحة.');
            }
        }
    }
    
    // الحصول على معلومات البوت
    const botInfo = bot.getBotInfo();
    
    if (!botInfo) {
        return message.reply('فشل الحصول على معلومات البوت.');
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
    
    message.channel.send({ embeds: [embed] });
}

// معالجة عرض معلومات البوت النشط
async function handleActiveBot(message, botManager) {
    const activeBot = botManager.getActiveBot();
    
    if (!activeBot) {
        return message.reply('لا يوجد بوت نشط حاليًا.');
    }
    
    // الحصول على معلومات البوت النشط
    const botInfo = activeBot.getBotInfo();
    
    if (!botInfo) {
        return message.reply('فشل الحصول على معلومات البوت النشط.');
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
    
    message.channel.send({ embeds: [embed] });
}

// معالجة تبديل البوت النشط
async function handleSwitchActiveBot(message, args, botManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `bots switch <توكن البوت/رقم البوت>`');
    }
    
    const identifier = args[1];
    let token;
    
    // التحقق مما إذا كان المعرف رقمًا (رقم البوت في القائمة) أو توكن
    if (/^\d+$/.test(identifier)) {
        const index = parseInt(identifier) - 1;
        const bots = botManager.getAllBots();
        
        if (index < 0 || index >= bots.length) {
            return message.reply('رقم البوت غير صالح. استخدم `bots list` لعرض قائمة البوتات المتاحة.');
        }
        
        token = bots[index].token;
    } else {
        token = identifier;
    }
    
    // تبديل البوت النشط
    const result = botManager.setActiveBot(token);
    
    if (result) {
        const activeBot = botManager.getActiveBot();
        const botInfo = activeBot.getBotInfo();
        
        message.channel.send(`✅ تم تبديل البوت النشط إلى: ${botInfo.username} (${botInfo.id})`);
    } else {
        message.reply('❌ فشل تبديل البوت النشط. تأكد من صحة التوكن أو رقم البوت.');
    }
}

// معالجة تشغيل بوت
async function handleStartBot(message, args, botManager) {
    // التحقق من وجود المعاملات المطلوبة
    if (args.length < 2) {
        return message.reply('استخدام غير صحيح! الاستخدام الصحيح: `bots start <توكن البوت> [البادئة] [المنصة]`');
    }
    
    // نفس منطق إضافة بوت جديد
    await handleAddBot(message, args, botManager);
}

// معالجة إيقاف بوت
async function handleStopBot(message, args, botManager) {
    // إذا كان الأمر "stopall"، أوقف جميع البوتات
    if (args.length > 1 && (args[1].toLowerCase() === 'all' || args[1] === 'الكل')) {
        const result = botManager.stopAllBots();
        
        if (result) {
            message.channel.send('✅ تم إيقاف جميع البوتات بنجاح.');
        } else {
            message.reply('❌ فشل إيقاف بعض البوتات.');
        }
        
        return;
    }
    
    // نفس منطق إزالة بوت
    await handleRemoveBot(message, args, botManager);
}
