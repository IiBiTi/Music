/**
 * ملف البوت الرئيسي لمشروع بوت الميوزك متعدد البوتات
 */

// استيراد المكتبات اللازمة
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// إنشاء فئة البوت الأساسية
class MusicBot {
    constructor(token, options = {}) {
        // دمج الإعدادات الافتراضية مع الإعدادات المخصصة
        this.options = {
            ...config.defaultSettings,
            ...options
        };

        // إنشاء عميل Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ]
        });

        // تعيين التوكن
        this.token = token;

        // إنشاء مجموعات للأوامر والأحداث
        this.commands = new Collection();
        this.aliases = new Collection();

        // إنشاء كائن DisTube
        this.distube = new DisTube(this.client, {
            plugins: this.setupPlugins()
        });
        

        // تعيين المنصة الحالية
        this.currentPlatform = this.options.defaultPlatform;
    }

    // إعداد إضافات DisTube
    setupPlugins() {
        const plugins = [];
        
        if (config.platforms.youtube.enabled) {
            plugins.push(new YtDlpPlugin());
        }
        
        if (config.platforms.spotify.enabled) {
            plugins.push(new SpotifyPlugin({
                api: {
                    clientId: config.platforms.spotify.clientId,
                    clientSecret: config.platforms.spotify.clientSecret,
                }
            }));
        }
        
        if (config.platforms.soundcloud.enabled) {
            plugins.push(new SoundCloudPlugin());
        }
        
        return plugins;
    }

    // تحميل الأوامر
    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        
        // قراءة جميع المجلدات في مجلد الأوامر
        const commandFolders = fs.readdirSync(commandsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        // تحميل الأوامر من كل مجلد
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    // إعادة تحميل الأمر في حالة تم تعديله
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    // تسجيل الأمر في مجموعة الأوامر
                    if ('name' in command && 'execute' in command) {
                        this.commands.set(command.name, command);
                        
                        // تسجيل الاختصارات إذا وجدت
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(alias => {
                                this.aliases.set(alias, command.name);
                            });
                        }
                        
                        console.log(`تم تحميل الأمر: ${command.name} من المجلد: ${folder}`);
                    } else {
                        console.warn(`الأمر في ${filePath} يفتقد إلى خاصية name أو execute المطلوبة.`);
                    }
                } catch (error) {
                    console.error(`فشل تحميل الأمر في ${filePath}:`, error);
                }
            }
        }
        
        console.log(`تم تحميل ${this.commands.size} أمر بنجاح.`);
        return this;
    }

    // تحميل الأحداث
    loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        
        // قراءة جميع المجلدات في مجلد الأحداث
        const eventFolders = fs.readdirSync(eventsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        // تحميل أحداث Discord
        const discordEventsPath = path.join(eventsPath, 'discord');
        if (fs.existsSync(discordEventsPath)) {
            const eventFiles = fs.readdirSync(discordEventsPath).filter(file => file.endsWith('.js'));
            
            for (const file of eventFiles) {
                const filePath = path.join(discordEventsPath, file);
                try {
                    // إعادة تحميل الحدث في حالة تم تعديله
                    delete require.cache[require.resolve(filePath)];
                    const event = require(filePath);
                    
                    if (event.once) {
                        this.client.once(event.name, (...args) => event.execute(this, ...args));
                    } else {
                        this.client.on(event.name, (...args) => event.execute(this, ...args));
                    }
                    
                    console.log(`تم تحميل حدث Discord: ${event.name}`);
                } catch (error) {
                    console.error(`فشل تحميل حدث Discord في ${filePath}:`, error);
                }
            }
        }
        
        // تحميل أحداث DisTube
        this.setupDistubeEvents();
        
        console.log(`تم تحميل جميع الأحداث بنجاح.`);
        return this;
    }

    // إعداد أحداث DisTube
    setupDistubeEvents() {
        const distubeEventsPath = path.join(__dirname, 'events', 'distube');
        
        if (fs.existsSync(distubeEventsPath)) {
            const eventFiles = fs.readdirSync(distubeEventsPath).filter(file => file.endsWith('.js'));
            
            for (const file of eventFiles) {
                const filePath = path.join(distubeEventsPath, file);
                try {
                    // إعادة تحميل الحدث في حالة تم تعديله
                    delete require.cache[require.resolve(filePath)];
                    const eventHandler = require(filePath);
                    
                    // استخراج اسم الحدث من اسم الملف
                    const eventName = file.split('.')[0];
                    
                    this.distube.on(eventName, (...args) => eventHandler(this, ...args));
                    console.log(`تم تحميل حدث DisTube: ${eventName}`);
                } catch (error) {
                    console.error(`فشل تحميل حدث DisTube في ${filePath}:`, error);
                }
            }
        }
        
        // إضافة معالج افتراضي للأحداث غير المعرفة
        const distubeEvents = [
            'playSong', 'addSong', 'addList', 'error', 'finish', 'noRelated',
            'empty', 'searchNoResult', 'searchResult', 'searchCancel',
            'searchInvalidAnswer', 'searchDone', 'disconnect'
        ];
        
        for (const event of distubeEvents) {
            if (!this.distube.listenerCount(event)) {
                this.distube.on(event, (...args) => {
                    if (config.logging.enabled && config.logging.level === 'debug') {
                        console.log(`[DisTube] حدث ${event}:`, args);
                    }
                });
            }
        }
        
        return this;
    }

    // تغيير المنصة
    switchPlatform(platform) {
        if (config.platforms[platform] && config.platforms[platform].enabled) {
            this.currentPlatform = platform;
            console.log(`[${this.client.user.tag}] تم تغيير المنصة إلى: ${platform}`);
            return true;
        }
        console.log(`[${this.client.user.tag}] فشل تغيير المنصة إلى: ${platform} (غير متاحة أو معطلة)`);
        return false;
    }

    // تشغيل البوت
    start() {
        // تسجيل معالج الرسائل
        this.client.on(Events.MessageCreate, async message => {
            // تجاهل الرسائل من البوتات
            if (message.author.bot) return;
            
            // التحقق من البادئة
            if (!message.content.startsWith(this.options.prefix)) return;
            
            // استخراج الأمر والمعاملات
            const args = message.content.slice(this.options.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            // البحث عن الأمر
            const command = this.commands.get(commandName) || this.commands.get(this.aliases.get(commandName));
            
            // إذا لم يتم العثور على الأمر
            if (!command) return;
            
            // التحقق من الحظر
            if (config.permissions.blacklistedUsers.includes(message.author.id)) {
                return message.reply('أنت محظور من استخدام هذا البوت.');
            }
            
            // تنفيذ الأمر
            try {
                command.execute(this, message, args);
            } catch (error) {
                console.error(`[${this.client.user.tag}] خطأ في تنفيذ الأمر ${commandName}:`, error);
                message.reply('حدث خطأ أثناء تنفيذ الأمر!');
            }
        });

        // تسجيل الدخول إلى Discord
        this.client.login(this.token)
            .then(() => {
                console.log(`تم تسجيل الدخول كـ ${this.client.user.tag}`);
            })
            .catch(error => {
                console.error('فشل تسجيل الدخول:', error);
                throw error; // إعادة رمي الخطأ للتعامل معه في المستدعي
            });
            
        return this;
    }
    
    // إيقاف البوت
    stop() {
        if (this.client) {
            this.client.destroy();
            console.log(`تم إيقاف البوت ${this.client.user?.tag || 'غير معروف'}`);
            return true;
        }
        return false;
    }
    
    // تغيير اسم البوت
    async changeUsername(newUsername) {
        try {
            if (!this.client.user) {
                throw new Error('البوت غير متصل بعد');
            }
            
            await this.client.user.setUsername(newUsername);
            console.log(`تم تغيير اسم البوت إلى: ${newUsername}`);
            return true;
        } catch (error) {
            console.error('فشل تغيير اسم البوت:', error);
            return false;
        }
    }
    
    // تغيير صورة البوت
    async changeAvatar(avatarURL) {
        try {
            if (!this.client.user) {
                throw new Error('البوت غير متصل بعد');
            }
            
            await this.client.user.setAvatar(avatarURL);
            console.log(`تم تغيير صورة البوت`);
            return true;
        } catch (error) {
            console.error('فشل تغيير صورة البوت:', error);
            return false;
        }
    }
    
    // تفعيل/تعطيل نظام الأزرار
    toggleButtons(enabled) {
        this.options.useButtons = enabled;
        console.log(`تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الأزرار للبوت ${this.client.user?.tag || 'غير معروف'}`);
        return true;
    }
    
    // تفعيل/تعطيل نظام الإمبيد
    toggleEmbed(enabled) {
        this.options.useEmbed = enabled;
        console.log(`تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الإمبيد للبوت ${this.client.user?.tag || 'غير معروف'}`);
        return true;
    }
    
    // الحصول على معلومات البوت
    getBotInfo() {
        if (!this.client.user) {
            return null;
        }
        
        return {
            id: this.client.user.id,
            username: this.client.user.username,
            discriminator: this.client.user.discriminator,
            tag: this.client.user.tag,
            avatar: this.client.user.displayAvatarURL(),
            createdAt: this.client.user.createdAt,
            status: this.client.user.presence?.status || 'offline',
            platform: this.currentPlatform,
            prefix: this.options.prefix,
            useButtons: this.options.useButtons,
            useEmbed: this.options.useEmbed,
            guildCount: this.client.guilds.cache.size,
            uptime: this.client.uptime
        };
    }
}

// إنشاء فئة مدير البوتات المتعددة
class BotManager {
    constructor() {
        this.bots = new Map();
        this.activeBot = null; // البوت النشط حاليًا للإدارة
    }
    
    // إنشاء بوت جديد
    createBot(token, options = {}) {
        try {
            // التحقق من عدم وجود البوت بالفعل
            if (this.bots.has(token)) {
                console.warn(`⚠️ البوت بالتوكن ${token.substring(0, 10)}... موجود مسبقًا. سيتم استخدامه بدلًا من إعادة إنشائه.`);
                return this.bots.get(token); // ← هذا التعديل الأساسي
            }
    
            const bot = new MusicBot(token, options);
    
            // تحميل الأوامر والأحداث
            bot.loadCommands().loadEvents();
    
            // تشغيل البوت
            bot.start();
    
            // إضافة البوت إلى القائمة
            this.bots.set(token, bot);
    
            // تعيين البوت كنشط إذا كان أول بوت
            if (this.bots.size === 1) {
                this.activeBot = token;
            }
    
            console.log(`✅ تم إنشاء بوت جديد بنجاح. عدد البوتات الحالي: ${this.bots.size}`);
            return bot;
        } catch (error) {
            console.error('❌ فشل إنشاء البوت:', error);
            throw error;
        }
    }
    
    // الحصول على بوت بواسطة التوكن
    getBot(token) {
        return this.bots.get(token);
    }
    
    // الحصول على البوت النشط
    getActiveBot() {
        return this.bots.get(this.activeBot);
    }
    
    // تعيين البوت النشط
    setActiveBot(token) {
        if (this.bots.has(token)) {
            this.activeBot = token;
            console.log(`تم تعيين البوت ${this.bots.get(token).client.user?.tag || token} كبوت نشط`);
            return true;
        }
        return false;
    }
    
    // الحصول على جميع البوتات
    getAllBots() {
        return Array.from(this.bots.values());
    }
    
    // الحصول على قائمة معلومات جميع البوتات
    getAllBotsInfo() {
        const botsInfo = [];
        
        for (const [token, bot] of this.bots.entries()) {
            const info = bot.getBotInfo();
            if (info) {
                botsInfo.push({
                    ...info,
                    token: token.substring(0, 10) + '...',
                    isActive: token === this.activeBot
                });
            }
        }
        
        return botsInfo;
    }
    
    // إزالة بوت
    removeBot(token) {
        const bot = this.bots.get(token);
        if (bot) {
            // إيقاف البوت
            bot.stop();
            
            // إزالة البوت من القائمة
            this.bots.delete(token);
            
            // إذا كان البوت النشط، تعيين بوت آخر كنشط
            if (this.activeBot === token) {
                const nextBot = this.bots.keys().next().value;
                this.activeBot = nextBot || null;
            }
            
            console.log(`تم إزالة البوت بنجاح. عدد البوتات المتبقي: ${this.bots.size}`);
            return true;
        }
        return false;
    }
    
    // تحديث إعدادات بوت معين
    updateBotSettings(token, settings) {
        const bot = this.bots.get(token);
        if (bot) {
            bot.options = {
                ...bot.options,
                ...settings
            };
            console.log(`تم تحديث إعدادات البوت ${bot.client.user?.tag || token}`);
            return true;
        }
        return false;
    }
    
    // تحديث إعدادات جميع البوتات
    updateAllBotsSettings(settings) {
        let success = true;
        for (const [token, bot] of this.bots.entries()) {
            if (!this.updateBotSettings(token, settings)) {
                success = false;
            }
        }
        console.log(`تم تحديث إعدادات جميع البوتات`);
        return success;
    }
    
    // تغيير المنصة لبوت معين
    switchPlatform(token, platform) {
        const bot = this.bots.get(token);
        if (bot) {
            return bot.switchPlatform(platform);
        }
        return false;
    }
    
    // تغيير المنصة لجميع البوتات
    switchPlatformForAllBots(platform) {
        let success = true;
        for (const [token, bot] of this.bots.entries()) {
            if (!bot.switchPlatform(platform)) {
                success = false;
            }
        }
        console.log(`تم تغيير منصة جميع البوتات إلى: ${platform}`);
        return success;
    }
    
    // تغيير اسم بوت معين
    async changeBotUsername(token, newUsername) {
        const bot = this.bots.get(token);
        if (bot) {
            return await bot.changeUsername(newUsername);
        }
        return false;
    }
    
    // تغيير اسم جميع البوتات
    async changeAllBotsUsername(newUsername) {
        let success = true;
        const promises = [];
        
        for (const [token, bot] of this.bots.entries()) {
            promises.push(bot.changeUsername(newUsername));
        }
        
        const results = await Promise.all(promises);
        success = results.every(result => result);
        
        console.log(`تم تغيير اسم جميع البوتات إلى: ${newUsername}`);
        return success;
    }
    
    // تغيير صورة بوت معين
    async changeBotAvatar(token, avatarURL) {
        const bot = this.bots.get(token);
        if (bot) {
            return await bot.changeAvatar(avatarURL);
        }
        return false;
    }
    
    // تغيير صورة جميع البوتات
    async changeAllBotsAvatar(avatarURL) {
        let success = true;
        const promises = [];
        
        for (const [token, bot] of this.bots.entries()) {
            promises.push(bot.changeAvatar(avatarURL));
        }
        
        const results = await Promise.all(promises);
        success = results.every(result => result);
        
        console.log(`تم تغيير صورة جميع البوتات`);
        return success;
    }
    
    // تفعيل/تعطيل نظام الأزرار لبوت معين
    toggleButtons(token, enabled) {
        const bot = this.bots.get(token);
        if (bot) {
            return bot.toggleButtons(enabled);
        }
        return false;
    }
    
    // تفعيل/تعطيل نظام الأزرار لجميع البوتات
    toggleButtonsForAllBots(enabled) {
        let success = true;
        for (const [token, bot] of this.bots.entries()) {
            if (!bot.toggleButtons(enabled)) {
                success = false;
            }
        }
        console.log(`تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الأزرار لجميع البوتات`);
        return success;
    }
    
    // تفعيل/تعطيل نظام الإمبيد لبوت معين
    toggleEmbed(token, enabled) {
        const bot = this.bots.get(token);
        if (bot) {
            return bot.toggleEmbed(enabled);
        }
        return false;
    }
    
    // تفعيل/تعطيل نظام الإمبيد لجميع البوتات
    toggleEmbedForAllBots(enabled) {
        let success = true;
        for (const [token, bot] of this.bots.entries()) {
            if (!bot.toggleEmbed(enabled)) {
                success = false;
            }
        }
        console.log(`تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام الإمبيد لجميع البوتات`);
        return success;
    }
    
    // إيقاف جميع البوتات
    stopAllBots() {
        let success = true;
        for (const [token, bot] of this.bots.entries()) {
            if (!bot.stop()) {
                success = false;
            }
        }
        
        // مسح قائمة البوتات
        this.bots.clear();
        this.activeBot = null;
        
        console.log(`تم إيقاف جميع البوتات`);
        return success;
    }
}

// تصدير الفئات
module.exports = {
    MusicBot,
    BotManager
};

// ... (كل الكود كما هو بدون تعديل)

module.exports = {
    MusicBot,
    BotManager
};

// ✅ كود التشغيل المباشر وسحب التوكن من env
if (require.main === module) {
    require('dotenv').config(); // تحميل متغيرات البيئة من .env
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
        console.error('⚠️ لم يتم العثور على التوكن في ملف .env (المتغير: DISCORD_TOKEN)');
        process.exit(1);
    }

    const bot = new MusicBot(token);
    bot.loadCommands().loadEvents().start();
}
