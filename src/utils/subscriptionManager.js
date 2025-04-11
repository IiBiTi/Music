/**
 * نظام إدارة الاشتراكات
 * هذا الملف يوفر واجهة للتحكم في اشتراكات البوتات
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class SubscriptionManager {
    constructor() {
        // إنشاء مجلد قاعدة البيانات إذا لم يكن موجودًا
        const dbDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // إنشاء اتصال بقاعدة البيانات
        this.dbPath = path.join(dbDir, 'subscriptions.db');
        this.db = new Database(this.dbPath);
        
        // إعداد قاعدة البيانات
        this.setupDatabase();
    }

    // إعداد قاعدة البيانات وإنشاء الجداول اللازمة
    setupDatabase() {
        // إنشاء جدول الاشتراكات
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                plan_type TEXT NOT NULL,
                bot_tokens TEXT,
                start_date INTEGER NOT NULL,
                end_date INTEGER NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                UNIQUE(user_id, guild_id)
            )
        `);

        // إنشاء جدول خطط الاشتراك
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                duration_days INTEGER NOT NULL,
                max_bots INTEGER NOT NULL,
                features TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                UNIQUE(name)
            )
        `);

        // إدخال خطط الاشتراك الافتراضية إذا لم تكن موجودة
        const plansCount = this.db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get().count;
        
        if (plansCount === 0) {
            // إدخال خطط الاشتراك الافتراضية
            const defaultPlans = [
                {
                    name: 'basic',
                    description: 'خطة أساسية تتيح استخدام بوت واحد',
                    price: 5.0,
                    duration_days: 30,
                    max_bots: 1,
                    features: JSON.stringify(['youtube', 'soundcloud'])
                },
                {
                    name: 'premium',
                    description: 'خطة متميزة تتيح استخدام 3 بوتات',
                    price: 10.0,
                    duration_days: 30,
                    max_bots: 3,
                    features: JSON.stringify(['youtube', 'soundcloud', 'spotify'])
                },
                {
                    name: 'ultimate',
                    description: 'خطة احترافية تتيح استخدام 10 بوتات',
                    price: 20.0,
                    duration_days: 30,
                    max_bots: 10,
                    features: JSON.stringify(['youtube', 'soundcloud', 'spotify', 'custom_name', 'custom_avatar'])
                }
            ];
            
            const insertPlan = this.db.prepare(`
                INSERT INTO subscription_plans (name, description, price, duration_days, max_bots, features)
                VALUES (@name, @description, @price, @duration_days, @max_bots, @features)
            `);
            
            for (const plan of defaultPlans) {
                insertPlan.run(plan);
            }
        }
    }

    // إضافة اشتراك جديد
    addSubscription(userId, guildId, planType) {
        try {
            // الحصول على معلومات الخطة
            const plan = this.getPlanByName(planType);
            if (!plan) {
                throw new Error(`خطة الاشتراك "${planType}" غير موجودة.`);
            }
            
            // حساب تاريخ البدء والانتهاء
            const startDate = Math.floor(Date.now() / 1000);
            const endDate = startDate + (plan.duration_days * 24 * 60 * 60);
            
            // إدخال الاشتراك الجديد
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO subscriptions (user_id, guild_id, plan_type, bot_tokens, start_date, end_date, is_active)
                VALUES (@userId, @guildId, @planType, @botTokens, @startDate, @endDate, 1)
            `);
            
            const result = stmt.run({
                userId,
                guildId,
                planType,
                botTokens: JSON.stringify([]),
                startDate,
                endDate
            });
            
            return {
                success: true,
                subscriptionId: result.lastInsertRowid,
                message: `تم إضافة اشتراك جديد بنجاح. ينتهي في ${new Date(endDate * 1000).toLocaleDateString()}.`
            };
        } catch (error) {
            console.error('فشل إضافة الاشتراك:', error);
            return {
                success: false,
                message: `فشل إضافة الاشتراك: ${error.message}`
            };
        }
    }

    // تحديث اشتراك موجود
    updateSubscription(userId, guildId, updates) {
        try {
            // التحقق من وجود الاشتراك
            const subscription = this.getSubscription(userId, guildId);
            if (!subscription) {
                throw new Error('الاشتراك غير موجود.');
            }
            
            // إنشاء قائمة التحديثات
            const updateFields = [];
            const params = { userId, guildId };
            
            for (const [key, value] of Object.entries(updates)) {
                if (['plan_type', 'bot_tokens', 'end_date', 'is_active'].includes(key)) {
                    updateFields.push(`${key} = @${key}`);
                    params[key] = key === 'bot_tokens' ? JSON.stringify(value) : value;
                }
            }
            
            if (updateFields.length === 0) {
                throw new Error('لا توجد حقول صالحة للتحديث.');
            }
            
            // إضافة حقل updated_at
            updateFields.push('updated_at = strftime(\'%s\', \'now\')');
            
            // تنفيذ التحديث
            const stmt = this.db.prepare(`
                UPDATE subscriptions
                SET ${updateFields.join(', ')}
                WHERE user_id = @userId AND guild_id = @guildId
            `);
            
            stmt.run(params);
            
            return {
                success: true,
                message: 'تم تحديث الاشتراك بنجاح.'
            };
        } catch (error) {
            console.error('فشل تحديث الاشتراك:', error);
            return {
                success: false,
                message: `فشل تحديث الاشتراك: ${error.message}`
            };
        }
    }

    // إضافة توكن بوت إلى اشتراك
    addBotToken(userId, guildId, botToken) {
        try {
            // الحصول على الاشتراك
            const subscription = this.getSubscription(userId, guildId);
            if (!subscription) {
                throw new Error('الاشتراك غير موجود.');
            }
            
            // التحقق من حالة الاشتراك
            if (!subscription.is_active) {
                throw new Error('الاشتراك غير نشط.');
            }
            
            // التحقق من تاريخ انتهاء الاشتراك
            if (subscription.end_date < Math.floor(Date.now() / 1000)) {
                throw new Error('الاشتراك منتهي الصلاحية.');
            }
            
            // الحصول على معلومات الخطة
            const plan = this.getPlanByName(subscription.plan_type);
            if (!plan) {
                throw new Error('خطة الاشتراك غير موجودة.');
            }
            
            // التحقق من عدد البوتات
            const botTokens = JSON.parse(subscription.bot_tokens || '[]');
            if (botTokens.length >= plan.max_bots) {
                throw new Error(`لقد وصلت إلى الحد الأقصى لعدد البوتات (${plan.max_bots}) في خطتك الحالية.`);
            }
            
            // التحقق من عدم وجود التوكن بالفعل
            if (botTokens.includes(botToken)) {
                throw new Error('توكن البوت موجود بالفعل في الاشتراك.');
            }
            
            // إضافة التوكن
            botTokens.push(botToken);
            
            // تحديث الاشتراك
            return this.updateSubscription(userId, guildId, {
                bot_tokens: botTokens
            });
        } catch (error) {
            console.error('فشل إضافة توكن البوت:', error);
            return {
                success: false,
                message: `فشل إضافة توكن البوت: ${error.message}`
            };
        }
    }

    // إزالة توكن بوت من اشتراك
    removeBotToken(userId, guildId, botToken) {
        try {
            // الحصول على الاشتراك
            const subscription = this.getSubscription(userId, guildId);
            if (!subscription) {
                throw new Error('الاشتراك غير موجود.');
            }
            
            // الحصول على قائمة التوكنات
            const botTokens = JSON.parse(subscription.bot_tokens || '[]');
            
            // التحقق من وجود التوكن
            const index = botTokens.indexOf(botToken);
            if (index === -1) {
                throw new Error('توكن البوت غير موجود في الاشتراك.');
            }
            
            // إزالة التوكن
            botTokens.splice(index, 1);
            
            // تحديث الاشتراك
            return this.updateSubscription(userId, guildId, {
                bot_tokens: botTokens
            });
        } catch (error) {
            console.error('فشل إزالة توكن البوت:', error);
            return {
                success: false,
                message: `فشل إزالة توكن البوت: ${error.message}`
            };
        }
    }

    // الحصول على اشتراك
    getSubscription(userId, guildId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM subscriptions
                WHERE user_id = ? AND guild_id = ?
            `);
            
            return stmt.get(userId, guildId);
        } catch (error) {
            console.error('فشل الحصول على الاشتراك:', error);
            return null;
        }
    }

    // الحصول على جميع اشتراكات المستخدم
    getUserSubscriptions(userId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM subscriptions
                WHERE user_id = ?
                ORDER BY created_at DESC
            `);
            
            return stmt.all(userId);
        } catch (error) {
            console.error('فشل الحصول على اشتراكات المستخدم:', error);
            return [];
        }
    }

    // الحصول على جميع اشتراكات السيرفر
    getGuildSubscriptions(guildId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM subscriptions
                WHERE guild_id = ?
                ORDER BY created_at DESC
            `);
            
            return stmt.all(guildId);
        } catch (error) {
            console.error('فشل الحصول على اشتراكات السيرفر:', error);
            return [];
        }
    }

    // الحصول على خطة اشتراك بالاسم
    getPlanByName(planName) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM subscription_plans
                WHERE name = ?
            `);
            
            return stmt.get(planName);
        } catch (error) {
            console.error('فشل الحصول على خطة الاشتراك:', error);
            return null;
        }
    }

    // الحصول على جميع خطط الاشتراك
    getAllPlans() {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM subscription_plans
                ORDER BY price ASC
            `);
            
            return stmt.all();
        } catch (error) {
            console.error('فشل الحصول على خطط الاشتراك:', error);
            return [];
        }
    }

    // التحقق من صلاحية اشتراك
    isSubscriptionValid(userId, guildId) {
        try {
            const subscription = this.getSubscription(userId, guildId);
            
            if (!subscription) {
                return false;
            }
            
            return (
                subscription.is_active === 1 &&
                subscription.end_date > Math.floor(Date.now() / 1000)
            );
        } catch (error) {
            console.error('فشل التحقق من صلاحية الاشتراك:', error);
            return false;
        }
    }

    // التحقق من صلاحية توكن بوت في اشتراك
    isBotTokenValid(botToken) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM subscriptions
                WHERE json_extract(bot_tokens, '$') LIKE ?
                AND is_active = 1
                AND end_date > strftime('%s', 'now')
            `);
            
            const result = stmt.get(`%${botToken}%`);
            return !!result;
        } catch (error) {
            console.error('فشل التحقق من صلاحية توكن البوت:', error);
            return false;
        }
    }

    // تمديد اشتراك
    extendSubscription(userId, guildId, durationDays) {
        try {
            // الحصول على الاشتراك
            const subscription = this.getSubscription(userId, guildId);
            if (!subscription) {
                throw new Error('الاشتراك غير موجود.');
            }
            
            // حساب تاريخ الانتهاء الجديد
            const currentEndDate = subscription.end_date;
            const newEndDate = currentEndDate + (durationDays * 24 * 60 * 60);
            
            // تحديث الاشتراك
            return this.updateSubscription(userId, guildId, {
                end_date: newEndDate,
                is_active: 1
            });
        } catch (error) {
            console.error('فشل تمديد الاشتراك:', error);
            return {
                success: false,
                message: `فشل تمديد الاشتراك: ${error.message}`
            };
        }
    }

    // إلغاء اشتراك
    cancelSubscription(userId, guildId) {
        try {
            // التحقق من وجود الاشتراك
            const subscription = this.getSubscription(userId, guildId);
            if (!subscription) {
                throw new Error('الاشتراك غير موجود.');
            }
            
            // تحديث الاشتراك
            return this.updateSubscription(userId, guildId, {
                is_active: 0
            });
        } catch (error) {
            console.error('فشل إلغاء الاشتراك:', error);
            return {
                success: false,
                message: `فشل إلغاء الاشتراك: ${error.message}`
            };
        }
    }

    // إغلاق اتصال قاعدة البيانات
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = SubscriptionManager;
