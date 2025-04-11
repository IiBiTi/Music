/**
 * نظام معالجة الأوامر
 * هذا الملف يقوم بتسجيل وإدارة جميع الأوامر المتاحة في البوت
 */

const fs = require('fs');
const path = require('path');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.commandsDir = path.join(__dirname, '..', 'commands');
        this.categories = new Map();
    }

    // تحميل جميع الأوامر من المجلدات
    loadCommands() {
        // التحقق من وجود مجلد الأوامر
        if (!fs.existsSync(this.commandsDir)) {
            fs.mkdirSync(this.commandsDir, { recursive: true });
        }

        // قراءة مجلدات الفئات
        const categories = fs.readdirSync(this.commandsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        // تحميل الأوامر من كل فئة
        for (const category of categories) {
            const categoryPath = path.join(this.commandsDir, category);
            const commandFiles = fs.readdirSync(categoryPath)
                .filter(file => file.endsWith('.js'));

            // إنشاء مجموعة للفئة
            this.categories.set(category, []);

            // تحميل كل أمر في الفئة
            for (const file of commandFiles) {
                const commandPath = path.join(categoryPath, file);
                const command = require(commandPath);

                // التحقق من صحة الأمر
                if (!command.name || !command.execute) {
                    console.warn(`الأمر في ${commandPath} غير صالح. يجب أن يحتوي على خاصية name وdescription وexecute.`);
                    continue;
                }

                // إضافة الأمر إلى مجموعة الأوامر
                this.bot.commands.set(command.name, command);
                
                // إضافة الأمر إلى فئته
                this.categories.get(category).push(command.name);

                // تسجيل الاختصارات إذا وجدت
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        this.bot.aliases.set(alias, command.name);
                    });
                }
            }
        }

        console.log(`تم تحميل ${this.bot.commands.size} أمر من ${this.categories.size} فئة.`);
        return this;
    }

    // الحصول على قائمة الفئات
    getCategories() {
        return Array.from(this.categories.keys());
    }

    // الحصول على أوامر فئة معينة
    getCategoryCommands(category) {
        return this.categories.get(category) || [];
    }

    // الحصول على معلومات الأمر
    getCommandInfo(commandName) {
        return this.bot.commands.get(commandName) || this.bot.commands.get(this.bot.aliases.get(commandName));
    }
}

module.exports = CommandHandler;
