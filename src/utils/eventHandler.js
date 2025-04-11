/**
 * نظام معالجة الأحداث
 * هذا الملف يقوم بتسجيل وإدارة جميع الأحداث في البوت
 */

const fs = require('fs');
const path = require('path');

class EventHandler {
    constructor(bot) {
        this.bot = bot;
        this.eventsDir = path.join(__dirname, '..', 'events');
        this.distubeEventsDir = path.join(this.eventsDir, 'distube');
    }

    // تحميل أحداث Discord
    loadDiscordEvents() {
        // التحقق من وجود مجلد الأحداث
        if (!fs.existsSync(this.eventsDir)) {
            fs.mkdirSync(this.eventsDir, { recursive: true });
            return this;
        }

        // قراءة ملفات الأحداث (فقط في المجلد الرئيسي، وليس المجلدات الفرعية)
        const eventFiles = fs.readdirSync(this.eventsDir)
            .filter(file => file.endsWith('.js') && !fs.statSync(path.join(this.eventsDir, file)).isDirectory());

        // تحميل كل حدث
        for (const file of eventFiles) {
            const eventPath = path.join(this.eventsDir, file);
            const event = require(eventPath);

            // التحقق من صحة الحدث
            if (!event.name || !event.execute) {
                console.warn(`الحدث في ${eventPath} غير صالح. يجب أن يحتوي على خاصية name وexecute.`);
                continue;
            }

            // تسجيل الحدث
            if (event.once) {
                this.bot.client.once(event.name, (...args) => event.execute(this.bot, ...args));
            } else {
                this.bot.client.on(event.name, (...args) => event.execute(this.bot, ...args));
            }
        }

        console.log(`تم تحميل أحداث Discord.`);
        return this;
    }

    // تحميل أحداث DisTube
    loadDistubeEvents() {
        // التحقق من وجود مجلد أحداث DisTube
        if (!fs.existsSync(this.distubeEventsDir)) {
            fs.mkdirSync(this.distubeEventsDir, { recursive: true });
            return this;
        }

        // قراءة ملفات أحداث DisTube
        const eventFiles = fs.readdirSync(this.distubeEventsDir)
            .filter(file => file.endsWith('.js'));

        // تحميل كل حدث
        for (const file of eventFiles) {
            const eventPath = path.join(this.distubeEventsDir, file);
            const eventHandler = require(eventPath);
            
            // استخراج اسم الحدث من اسم الملف
            const eventName = file.split('.')[0];
            
            // تسجيل الحدث
            this.bot.distube.on(eventName, (...args) => eventHandler(this.bot, ...args));
        }

        // تسجيل أحداث DisTube الافتراضية
        const distubeEvents = [
            'playSong',
            'addSong',
            'addList',
            'error',
            'finish',
            'noRelated',
            'empty',
            'searchNoResult',
            'searchResult',
            'searchCancel',
            'searchInvalidAnswer',
            'searchDone',
            'disconnect'
        ];

        for (const event of distubeEvents) {
            const eventPath = path.join(this.distubeEventsDir, `${event}.js`);
            
            // إذا لم يكن الحدث موجودًا، قم بإنشاء معالج افتراضي
            if (!fs.existsSync(eventPath)) {
                this.bot.distube.on(event, (...args) => {
                    if (this.bot.options.logging && this.bot.options.logging.level === 'debug') {
                        console.log(`[DisTube] حدث ${event}:`, args);
                    }
                });
            }
        }

        console.log(`تم تحميل أحداث DisTube.`);
        return this;
    }

    // تحميل جميع الأحداث
    loadAllEvents() {
        this.loadDiscordEvents();
        this.loadDistubeEvents();
        return this;
    }
}

module.exports = EventHandler;
