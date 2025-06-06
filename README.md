# بوت ميوزك متعدد البوتات

هذا المشروع عبارة عن بوت ميوزك متطور لديسكورد يدعم تشغيل بوتات متعددة في نفس المشروع، مع دعم لمنصات تشغيل متعددة (يوتيوب، ساوندكلاود، سبوتيفاي) ونظام تبديل المنصة التلقائي ونظام اشتراكات متكامل.

## المميزات الرئيسية

- **دعم تشغيل بوتات متعددة**: يمكنك تشغيل أكثر من بوت في نفس المشروع والتحكم بها جميعًا.
- **منصات تشغيل متعددة**: دعم لمنصات يوتيوب، ساوندكلاود، وسبوتيفاي.
- **نظام تبديل المنصة**: في حالة حظرك من تشغيل البوت عبر يوتيوب، يمكنك تغيير منصة التشغيل تلقائيًا.
- **إمكانية التحكم الشامل**: تغيير أسماء البوتات، الصور، تفعيل/إيقاف نظام الأزرار والإمبيد.
- **نظام حظر الأعضاء**: منع أعضاء محددين من استخدام البوتات.
- **نظام الاشتراكات**: إدارة اشتراكات المستخدمين والتحكم في عدد البوتات المسموح بها لكل مستخدم.

## متطلبات التشغيل

- Node.js v16.9.0 أو أحدث
- npm v7 أو أحدث
- توكن بوت ديسكورد (يمكنك إنشاء بوت من [بوابة مطوري ديسكورد](https://discord.com/developers/applications))
- حساب سبوتيفاي (اختياري، للاستماع من سبوتيفاي)

## التثبيت

1. قم بتنزيل أو استنساخ هذا المستودع:
```bash
git clone https://github.com/yourusername/music-bot-project.git
cd music-bot-project
```

2. قم بتثبيت الاعتماديات:
```bash
npm install
```

3. قم بإنشاء ملف `.env` في المجلد الرئيسي وأضف توكن البوت الخاص بك:
```
DISCORD_TOKEN=your_discord_bot_token_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here (اختياري)
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here (اختياري)
```

4. قم بتعديل ملف `config/config.js` حسب احتياجاتك.

5. قم بتشغيل البوت:
```bash
npm start
```

## الأوامر الرئيسية

### أوامر الميوزك

- `!play <رابط/اسم>`: تشغيل أغنية من يوتيوب، ساوندكلاود، أو سبوتيفاي.
- `!stop`: إيقاف تشغيل الموسيقى والخروج من القناة الصوتية.
- `!skip`: تخطي الأغنية الحالية.
- `!queue`: عرض قائمة الانتظار.
- `!volume <1-100>`: ضبط مستوى الصوت.
- `!platform <youtube/soundcloud/spotify>`: تغيير منصة التشغيل.

### أوامر الإدارة

- `!setname <all/token> <الاسم الجديد>`: تغيير اسم بوت واحد أو جميع البوتات.
- `!setavatar <all/token> <رابط الصورة>`: تغيير صورة بوت واحد أو جميع البوتات.
- `!togglebuttons <all/token> <on/off>`: تفعيل أو تعطيل نظام الأزرار.
- `!toggleembed <all/token> <on/off>`: تفعيل أو تعطيل نظام الإمبيد.
- `!blacklist <add/remove> <معرف المستخدم>`: حظر أو إلغاء حظر مستخدم من استخدام البوتات.
- `!invite <token>`: إنشاء رابط دعوة للبوت لنقله إلى سيرفر آخر.

### أوامر الاشتراكات

- `!subscription add <معرف المستخدم> <نوع الخطة>`: إضافة اشتراك جديد.
- `!subscription info <معرف المستخدم>`: عرض معلومات الاشتراك.
- `!subscription extend <معرف المستخدم> <عدد الأيام>`: تمديد اشتراك.
- `!subscription cancel <معرف المستخدم>`: إلغاء اشتراك.
- `!subscription addbot <معرف المستخدم> <توكن البوت>`: إضافة بوت إلى اشتراك.
- `!subscription removebot <معرف المستخدم> <توكن البوت>`: إزالة بوت من اشتراك.
- `!subscription plans`: عرض خطط الاشتراك المتاحة.

## هيكل المشروع

```
music-bot-project/
├── config/
│   └── config.js         # إعدادات البوت
├── data/
│   └── subscriptions.db  # قاعدة بيانات الاشتراكات
├── src/
│   ├── commands/         # أوامر البوت
│   │   ├── admin/        # أوامر الإدارة
│   │   ├── music/        # أوامر الميوزك
│   │   └── utility/      # أوامر المساعدة
│   ├── events/           # أحداث البوت
│   │   └── distube/      # أحداث DisTube
│   ├── utils/            # أدوات مساعدة
│   │   ├── commandHandler.js
│   │   ├── eventHandler.js
│   │   ├── multiBotManager.js
│   │   ├── platformSwitcher.js
│   │   ├── subscriptionManager.js
│   │   └── subscriptionBotManager.js
│   └── index.js          # نقطة الدخول الرئيسية
├── tests/
│   └── test.js           # اختبارات الوظائف
├── .env                  # ملف البيئة (يجب إنشاؤه)
├── package.json
└── README.md
```

## نظام الاشتراكات

يوفر المشروع نظام اشتراكات متكامل يتيح لك إدارة المستخدمين والبوتات المسموح بها لكل مستخدم. النظام يتضمن ثلاث خطط افتراضية:

- **أساسية**: بوت واحد، 30 يوم، دعم يوتيوب وساوندكلاود.
- **متميزة**: 3 بوتات، 30 يوم، دعم يوتيوب وساوندكلاود وسبوتيفاي.
- **احترافية**: 10 بوتات، 30 يوم، دعم جميع المنصات مع إمكانية تخصيص الاسم والصورة.

## نظام تبديل المنصة

في حالة حظر البوت من استخدام منصة معينة (مثل يوتيوب)، يمكن للنظام تبديل المنصة تلقائيًا إلى منصة أخرى متاحة. يمكنك أيضًا تغيير المنصة يدويًا باستخدام أمر `!platform`.

## دعم البوتات المتعددة

يمكنك تشغيل عدة بوتات في نفس الوقت والتحكم بها جميعًا من خلال البوت الرئيسي. يمكنك تغيير إعدادات جميع البوتات دفعة واحدة أو تغيير إعدادات بوت محدد.

## المساهمة

نرحب بالمساهمات! إذا كنت ترغب في المساهمة، يرجى اتباع الخطوات التالية:

1. قم بعمل fork للمستودع
2. قم بإنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. قم بإجراء تغييراتك
4. قم بعمل commit للتغييرات (`git commit -m 'إضافة ميزة رائعة'`)
5. قم بدفع التغييرات إلى الفرع (`git push origin feature/amazing-feature`)
6. قم بفتح طلب سحب

## الترخيص

هذا المشروع مرخص تحت رخصة MIT. انظر ملف `LICENSE` للمزيد من المعلومات.

## الاتصال

إذا كان لديك أي أسئلة أو اقتراحات، يرجى فتح issue في هذا المستودع أو التواصل معنا عبر [البريد الإلكتروني](mailto:your-email@example.com).

---

تم إنشاؤه بواسطة [اسمك هنا] - جميع الحقوق محفوظة © 2025
