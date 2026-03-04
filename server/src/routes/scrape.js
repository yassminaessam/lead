import { Router } from 'express';
import Lead from '../models/Lead.js';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const router = Router();

// ============================================================
// Google Maps — direct scrape via headless browser (no API key)
// Supports single query or multi-query comprehensive search
// ============================================================

// City neighborhoods for comprehensive area-based search
const CITY_AREAS = {
  'القاهرة': [
    'مدينة نصر', 'المعادي', 'الدقي', 'المهندسين', 'الزمالك', 'وسط البلد',
    'مصر الجديدة', 'العباسية', 'شبرا', 'حلوان', 'التجمع الخامس', 'الرحاب',
    'مدينتي', 'المقطم', 'عين شمس', 'النزهة', 'السيدة زينب', 'الدرب الاحمر',
    'حدائق القبة', 'المرج', 'الشروق', 'بدر', 'العبور', 'الزيتون',
    'روض الفرج', 'المطرية', 'بولاق', 'الوايلي', 'حدائق المعادي',
    'دار السلام', 'طره', 'المعصرة', 'التبين', 'الخليفة',
    'منشية ناصر', 'الساحل', 'شبرا الخيمة', 'الموسكي', 'الأزهر',
    'جاردن سيتي', 'المنيل', 'الشيخ زايد', 'القطامية',
    'البساتين', 'السلام', 'الأميرية', 'عزبة النخل', 'حدائق حلوان',
    '15 مايو', 'الشرابية', 'الجمالية', 'غمرة', 'عابدين', 'باب الشعرية',
    'الأزبكية', 'الحسين',
  ],
  'الجيزة': [
    'الهرم', 'فيصل', '6 اكتوبر', 'الشيخ زايد', 'حدائق الأهرام', 'العمرانية',
    'الحوامدية', 'البدرشين', 'أبو النمرس', 'الوراق', 'إمبابة', 'الدقي',
    'العجوزة', 'بولاق الدكرور', 'أوسيم', 'كرداسة', 'المنيب',
    'الطالبية', 'ساقية مكي', 'حدائق الاهرام',
    'الجيزة', 'المريوطية', 'أبو رواش', 'الصف', 'أطفيح',
    'منشأة القناطر', 'الطوابق', 'أرض اللواء',
  ],
  'الإسكندرية': [
    'سيدي جابر', 'سموحة', 'المنتزه', 'سيدي بشر', 'كليوباترا', 'رشدي',
    'ستانلي', 'الابراهيمية', 'العصافرة', 'المندرة', 'جليم', 'لوران',
    'محرم بك', 'العطارين', 'بحري', 'العجمي', 'الدخيلة', 'المعمورة',
    'كامب شيزار', 'فليمنج', 'ميامي', 'أبو قير', 'المنشية', 'الشاطبي',
    'باكوس', 'بولكلي', 'زيزينيا', 'الحضرة', 'كرموز', 'العامرية',
    'برج العرب', 'المكس',
    'سابا باشا', 'مصطفى كامل', 'الشلالات', 'الأميرية', 'سيدي كرير',
    'الهانوفيل', 'غيط العنب', 'الورديان', 'النخيل', 'العوايد',
    'الجمرك', 'الأنفوشي',
  ],
  'المنصورة': [
    'المنصورة', 'ميت غمر', 'طلخا', 'دكرنس', 'أجا', 'السنبلاوين', 'شربين',
    'بلقاس', 'المنزلة', 'تمي الأمديد', 'نبروه', 'منية النصر', 'الجمالية',
  ],
  'طنطا': [
    'طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'بسيون', 'سمنود',
    'قطور', 'السنطة', 'المحلة', 'صفط تراب',
  ],
  'الزقازيق': [
    'الزقازيق', 'بلبيس', 'العاشر من رمضان', 'أبو حماد', 'منيا القمح', 'فاقوس',
    'أبو كبير', 'ههيا', 'كفر صقر', 'ديرب نجم', 'الحسينية', 'الصالحية الجديدة',
  ],
  'أسيوط': [
    'أسيوط', 'ديروط', 'القوصية', 'أبنوب', 'الفتح', 'منفلوط',
    'أسيوط الجديدة', 'الغنايم', 'ساحل سليم', 'أبو تيج', 'صدفا', 'البداري',
  ],
  'الأقصر': [
    'الأقصر', 'الأقصر شرق', 'الأقصر غرب', 'الزينية', 'الطود', 'البياضية',
    'أرمنت', 'القرنة', 'إسنا', 'الأقالتة',
  ],
  'أسوان': [
    'أسوان', 'إدفو', 'كوم أمبو', 'دراو', 'نصر النوبة',
    'أبو سمبل', 'البصيلية', 'السباعية',
  ],
  'بورسعيد': [
    'بورسعيد', 'الزهور', 'المناخ', 'الشرق', 'الضواحي', 'بور فؤاد',
    'العرب', 'الجنوب', 'حي الضواحي',
  ],
  'الإسماعيلية': [
    'الإسماعيلية', 'القنطرة شرق', 'فايد', 'التل الكبير', 'أبو صوير',
    'القنطرة غرب', 'القصاصين', 'نفيشة',
  ],
  'السويس': [
    'السويس', 'الأربعين', 'عتاقة', 'فيصل', 'الجناين',
    'السويس الجديدة', 'حي الأربعين', 'الهجانة',
  ],
  'دمياط': [
    'دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'كفر سعد',
    'الزرقا', 'السرو', 'عزبة البرج', 'كفر البطيخ',
  ],
  'المنيا': [
    'المنيا', 'المنيا الجديدة', 'ملوي', 'سمالوط', 'مطاي', 'بني مزار',
    'أبو قرقاص', 'دير مواس', 'العدوة', 'مغاغة', 'المنيا الأقصى',
  ],
  'سوهاج': [
    'سوهاج', 'أخميم', 'جرجا', 'طهطا', 'المراغة', 'البلينا',
    'سوهاج الجديدة', 'ساقلتة', 'دار السلام', 'المنشاة', 'جهينة',
  ],
  'بني سويف': [
    'بني سويف', 'الواسطى', 'ناصر', 'إهناسيا', 'ببا',
    'بني سويف الجديدة', 'الفشن', 'سمسطا', 'نيدة',
  ],
  'الفيوم': [
    'الفيوم', 'الفيوم الجديدة', 'سنورس', 'إبشواي', 'طامية', 'يوسف الصديق',
    'أطسا', 'الشواشنة', 'دمو',
  ],
  'شبين الكوم': [
    'شبين الكوم', 'مدينة السادات', 'منوف', 'قويسنا', 'أشمون', 'الباجور', 'تلا',
    'بركة السبع', 'الشهداء', 'سرس الليان',
  ],
  'كفر الشيخ': [
    'كفر الشيخ', 'دسوق', 'فوه', 'بيلا', 'الحامول', 'مطوبس',
    'الرياض', 'سيدي سالم', 'قلين', 'بلطيم',
  ],
  'مرسى مطروح': [
    'مرسى مطروح', 'الحمام', 'العلمين', 'الضبعة', 'سيدي عبد الرحمن',
    'الساحل الشمالي', 'رأس الحكمة', 'سيوة',
  ],
  'قنا': [
    'قنا', 'نجع حمادي', 'دشنا', 'قوص', 'أبو تشت', 'نقادة',
    'فرشوط', 'الوقف', 'قنا الجديدة',
  ],
  'الغردقة': [
    'الغردقة', 'سهل حشيش', 'الجونة', 'مكادي', 'القصير',
    'سفاجا', 'مرسى علم', 'الاحياء',
  ],
  'شرم الشيخ': [
    'شرم الشيخ', 'نبق', 'خليج نعمة', 'هضبة أم السيد', 'رأس محمد',
    'شرم القديمة', 'دهب', 'نويبع', 'طابا',
  ],
  'بنها': [
    'بنها', 'شبرا الخيمة', 'قليوب', 'القناطر الخيرية', 'كفر شكر',
    'طوخ', 'شبين القناطر', 'الخصوص', 'العبور',
  ],
};

// Sub-areas (streets, landmarks, sub-neighborhoods) for deep search within a neighborhood
const AREA_SUB_ZONES = {
  // ===== القاهرة =====
  'مدينة نصر': ['شارع عباس العقاد','شارع مصطفى النحاس','شارع مكرم عبيد','شارع الطيران','شارع النزهة','شارع حسن المأمون','شارع عبد الرزاق السنهوري','شارع أحمد فخري','الحي السابع','الحي الثامن','الحي العاشر','زهراء مدينة نصر','المنطقة التاسعة','المنطقة السادسة','أمام سيتي ستارز','شارع عمر بن الخطاب','شارع الميثاق','منطقة ألف مسكن','حي السفارات','شارع يوسف عباس'],
  'المعادي': ['المعادي الجديدة','المعادي القديمة','دجلة','زهراء المعادي','ثكنات المعادي','شارع 9','شارع النصر','كورنيش المعادي','ميدان الحرية','شارع 100','شارع 200','حدائق المعادي','صقر قريش','أرض الجولف'],
  'الدقي': ['شارع مصدق','شارع التحرير','ميدان المساحة','شارع الدقي','شارع شهاب','شارع بطرس غالي','شارع جامعة الدول','ميدان الدقي','شارع محيي الدين أبو العز','شارع يثرب'],
  'المهندسين': ['شارع جامعة الدول العربية','شارع شهاب','شارع السودان','شارع لبنان','ميدان لبنان','شارع وادي النيل','شارع أحمد عرابي','شارع دمشق','شارع بيروت','شارع محيي الدين أبو العز'],
  'الزمالك': ['شارع 26 يوليو','شارع البرازيل','شارع حسن صبري','شارع أبو الفدا','شارع شجرة الدر','شارع الشيخ المرصفي','شارع محمد مظهر','شارع إسماعيل محمد','شارع الجزيرة'],
  'وسط البلد': ['شارع طلعت حرب','شارع قصر النيل','شارع محمد فريد','ميدان التحرير','شارع 26 يوليو','شارع عدلي','شارع عبد الخالق ثروت','شارع رمسيس','شارع الجمهورية','ميدان عابدين','شارع محمد علي'],
  'مصر الجديدة': ['شارع الحجاز','شارع بغداد','شارع الأهرام','شارع الميرغني','شارع الخليفة المأمون','ميدان تريومف','ميدان هليوبوليس','شارع الثورة','شارع النزهة','روكسي','ميدان المحكمة','كوربة مصر الجديدة','ميدان الإسماعيلية','شارع ابراهيم اللقاني'],
  'العباسية': ['شارع رمسيس','ميدان العباسية','شارع الخليفة المأمون','أمام جامعة عين شمس','شارع أحمد سعيد','شارع يوسف عباس'],
  'شبرا': ['شارع شبرا','شارع أحمد حلمي','شارع خلوصي','ميدان شبرا','شارع الترعة البولاقية','شارع طوسون','شارع رئيس'],
  'حلوان': ['شارع منصور','شارع المراغي','شارع محمد سعيد','حلوان الجديدة','عين حلوان','وادي حوف','شارع الجمهورية'],
  'التجمع الخامس': ['التسعين الشمالي','التسعين الجنوبي','الحي الأول','الحي الثاني','الحي الثالث','الحي الخامس','البنفسج','الياسمين','اللوتس','النرجس','الأندلس','شارع التسعين','جنوب الأكاديمية','أمام الجامعة الأمريكية','داون تاون القطامية'],
  'الرحاب': ['المرحلة الأولى','المرحلة الثانية','المرحلة الثالثة','المرحلة الرابعة','المرحلة الخامسة','السوق التجاري','الممشى السياحي','المول التجاري','البوابة الرئيسية','ميدان الرحاب'],
  'مدينتي': ['المرحلة الأولى','المرحلة الثانية','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12','الممشى السياحي','المول التجاري','نادي مدينتي','الحديقة المركزية'],
  'المقطم': ['هضبة المقطم','المقطم الهضبة الوسطى','شارع 9','المنطقة الأولى','المنطقة التاسعة','الأوتوستراد','شارع المقطم','الهضبة العليا','محور المشير','شارع سعد زغلول'],
  'عين شمس': ['عين شمس الشرقية','عين شمس الغربية','شارع أحمد إسماعيل','شارع عين شمس','الزيتون','شارع نادي الصيد','المنطقة الحرة','ميدان عين شمس','حدائق عين شمس'],
  'النزهة': ['شارع النزهة','النزهة الجديدة','مطار القاهرة','شيراتون','شارع الثورة','شارع عبد الحميد بدوي','ميدان المحكمة','ألماظة'],
  'السيدة زينب': ['شارع المنيرة','شارع الخليج المصري','ميدان السيدة زينب','شارع بور سعيد','شارع القصر العيني','شارع المبتديان','شارع الملك الصالح','ميدان لاظوغلي'],
  'الدرب الاحمر': ['شارع الأزهر','باب زويلة','شارع المعز','شارع الدرب الأحمر','شارع التبانة','ميدان صلاح الدين','القلعة','شارع محمد علي'],
  'حدائق القبة': ['شارع ترعة الإسماعيلية','شارع منشية البكري','ميدان حدائق القبة','شارع السلام','قصر القبة','شارع المطرية','شارع أحمد تيسير'],
  'المرج': ['المرج القديمة','المرج الجديدة','شارع المرج','عزبة أبو حشيش','المرج الغربية','شارع الشهيد أحمد حمدي','ميدان المرج'],
  'الشروق': ['الحي الأول','الحي الثاني','الحي الثالث','الحي الرابع','الحي الخامس','الحي السابع','الحي التاسع','المنطقة الصناعية','سوق الشروق','الشروق سبرنجز'],
  'بدر': ['الحي الأول','الحي الثاني','الحي الثالث','المنطقة الصناعية','الحي المتميز','إسكان الشباب','الحي السكني'],
  'العبور': ['الحي الأول','الحي الثاني','الحي الثالث','الحي الرابع','الحي الخامس','الحي السادس','الحي السابع','جولف سيتي','الجامعة العمالية','الحي التاسع','كارفور العبور'],
  'الزيتون': ['شارع الزيتون','شارع سليم الأول','شارع الأصبغ','حدائق الزيتون','شارع أحمد تيسير','ميدان الزيتون','شارع ابن الأثير','شارع القبة'],
  'روض الفرج': ['شارع النيل','شارع الترجمان','شارع الشرابية','ميدان روض الفرج','شارع شبرا','شارع المسطحات','كورنيش روض الفرج','محور روض الفرج'],
  'المطرية': ['شارع المطرية','شارع الحرية','ميدان المطرية','عين شمس','المطرية البلد','شارع معهد المطرية','حلمية المطرية','عزبة النخل'],
  'بولاق': ['بولاق أبو العلا','شارع 26 يوليو','شارع بولاق','شارع الجلاء','كورنيش النيل','ميدان بولاق','شارع أحمد عرابي','وكالة البلح'],
  'الوايلي': ['شارع رمسيس','ميدان العباسية','شارع الفجالة','شارع السكة الحديد','حدائق الوايلي','الوايلي الصغير','الوايلي الكبير','شارع أحمد سعيد'],
  'حدائق المعادي': ['شارع 9 حدائق','صقر قريش','شارع النصر حدائق','ميدان الحرية حدائق','شارع 151','شارع 100 حدائق'],
  'دار السلام': ['شارع دار السلام','شارع عقبة بن نافع','شارع مسطرد','ميدان دار السلام','شارع إمبابة','زين العابدين'],
  'طره': ['طره البلد','طره الأسمنت','شارع الكورنيش','طره الجديدة','المعصرة','شارع طره','وادي حوف'],
  'المعصرة': ['شارع المعصرة','المعصرة البلد','المعصرة العسكري','شارع مصطفى كامل','حدائق حلوان'],
  'التبين': ['شارع التبين','مصنع الحديد والصلب','التبين الجديدة','شارع الجمهورية','حلوان'],
  'الخليفة': ['شارع الخليفة','شارع السيدة عائشة','شارع صلاح سالم','ميدان القلعة','شارع السيوفية','الحطابة','باب الوزير'],
  'منشية ناصر': ['شارع الأوتوستراد','الدويقة','شارع السلطان حسن','استاد القاهرة','شارع صلاح سالم','ميدان صلاح الدين'],
  'الساحل': ['شارع بورسعيد','شارع الساحل','شارع الترعة','ميدان الساحل','شبرا الساحل','شارع أحمد حلمي'],
  'شبرا الخيمة': ['شارع أحمد عرابي','شارع 15 مايو','شارع شبين','شارع كورنيش النيل','ميدان المؤسسة','المنطقة الصناعية','شارع أحمد عصمت','ميدان شبرا الخيمة','مسطرد'],
  'الموسكي': ['شارع الموسكي','شارع المعز لدين الله','شارع الأزهر','خان الخليلي','شارع الجمالية','ميدان الحسين','باب الفتوح','سوق الموسكي'],
  'الأزهر': ['الجامع الأزهر','شارع الأزهر','مشيخة الأزهر','ميدان الأزهر','شارع المعز','ميدان الحسين','باب الغوري'],
  'جاردن سيتي': ['شارع قصر العيني','كورنيش النيل','شارع القصر العيني','شارع الطلمبات','ميدان سيمون بوليفار','شارع أيوب','شارع حسن صبري'],
  'المنيل': ['شارع المنيل','شارع الروضة','كوبري المنيل','الروضة','قصر العيني','شارع الملك الصالح','ميدان المنيل','جزيرة المنيل','شارع محمد المقريزي'],
  'القطامية': ['طريق القطامية العين السخنة','كمبوند القطامية','القطامية هايتس','قطامية هيلز','القطامية ريزيدنس','مول كايرو فستيفال'],
  'البساتين': ['شارع البساتين','شارع زين العابدين','ميدان البساتين','شارع عرب المعادي','منطقة عرب البساتين','شارع محمد سيد أحمد','شارع صقر قريش','التونسي'],
  'السلام': ['السلام أول','السلام ثاني','شارع الثورة','شارع بلبيس','شارع السلام','ميدان السلام','المنطقة الصناعية','عزبة أول','عزبة تاني','الخصوص'],
  'الأميرية': ['شارع الأميرية','شارع ترعة الإسماعيلية','ميدان الأميرية','شارع المطرية','شارع عين شمس','حلمية الزيتون','الأميرية الشرقية','الأميرية الغربية'],
  'عزبة النخل': ['شارع عزبة النخل','شارع بلبيس','ميدان عزبة النخل','شارع المشروع','شارع النخل','عزبة النخل الشرقية','عزبة النخل الغربية','إسكان عزبة النخل'],
  'حدائق حلوان': ['شارع حدائق حلوان','شارع المنيل','ميدان حدائق حلوان','شارع الجمهورية','وادي حوف','شارع المحطة','إسكان حدائق حلوان'],
  '15 مايو': ['المنطقة الأولى','المنطقة الثانية','المنطقة الثالثة','المنطقة الرابعة','المنطقة الخامسة','شارع الجمهورية','ميدان 15 مايو','المنطقة الصناعية','إسكان الشباب'],
  'الشرابية': ['شارع الشرابية','شارع القصاصين','ميدان الشرابية','شارع بيبرس','شارع أحمد حلمي','شارع الترعة البولاقية','الزاوية الحمراء','المظلات'],
  'الجمالية': ['شارع المعز لدين الله','باب الفتوح','باب النصر','شارع الجمالية','بيت السحيمي','وكالة الغوري','سبيل محمد علي','شارع الأزهر','حارة الدرب الأصفر','ميدان الحسين'],
  'غمرة': ['شارع غمرة','شارع رمسيس','ميدان غمرة','شارع الفجالة','شارع كلوت بك','محطة غمرة','شارع بورسعيد','شارع السكة الحديد'],
  'عابدين': ['ميدان عابدين','قصر عابدين','شارع الجمهورية','شارع نوبار','شارع محمد فريد','شارع الشيخ ريحان','ميدان لاظوغلي','شارع بورسعيد','شارع مجلس الشعب'],
  'باب الشعرية': ['شارع باب الشعرية','شارع الأزهر','شارع بورسعيد','ميدان باب الشعرية','شارع كلوت بك','شارع الجيش','الفجالة'],
  'الأزبكية': ['شارع الأزبكية','حديقة الأزبكية','شارع الجمهورية','ميدان الأوبرا','شارع 26 يوليو','شارع عماد الدين','شارع الأزهر','ميدان العتبة','شارع محمد علي'],
  'الحسين': ['ميدان الحسين','مسجد الحسين','شارع الأزهر','خان الخليلي','شارع المعز','سوق الحسين','شارع الجمالية','ميدان الأزهر'],
  // ===== الجيزة =====
  'الهرم': ['شارع الهرم','شارع فيصل','ميدان الرماية','ميدان الحصري','شارع العريش','شارع الملك فيصل','ميدان سفنكس','المنصورية','شارع مراد','شارع الثلاثيني','اللبيني','الطالبية','شارع ترسا','المريوطية','كفر نصار'],
  'فيصل': ['شارع فيصل','شارع العشرين','شارع الملكة','العمرانية','الطالبية','ميدان فيصل','شارع الثلاثيني','شارع المنيرة','حدائق الأهرام','شارع الميزان','اللبيني'],
  '6 اكتوبر': ['الحي الأول','الحي الثاني','الحي الثالث','الحي الرابع','الحي الخامس','الحي السابع','الحي الثامن','الحي الحادي عشر','الحي الثاني عشر','الحي المتميز','المحور المركزي','مول العرب','ميدان جهينة','جاردنز','دريم لاند','مدينة الإنتاج الإعلامي','المنطقة الصناعية','الحصري','حدائق أكتوبر'],
  'الشيخ زايد': ['شارع الغابة','مول مصر','هايبر وان','أركان','الحي الأول','الحي الثاني','الحي الرابع','الحي السابع','الحي الثامن','بيفرلي هيلز','كمبوند الربوة','كمبوند بالم هيلز','كمبوند صن سيتي','الجزيرة بلازا','وصلة دهشور'],
  'حدائق الأهرام': ['البوابة الأولى','البوابة الثانية','البوابة الثالثة','البوابة الرابعة','شارع الجيش','الحي الأول','المنطقة التجارية','شارع 90','خلف هايبر','ميدان حدائق الأهرام'],
  'العمرانية': ['شارع الهرم','شارع ترسا','شارع سليمان','ميدان العمرانية','الطوابق','شارع النيل','شارع د.مجدي يعقوب','أرض اللواء'],
  'الحوامدية': ['شارع الحوامدية','شارع النيل','شارع المصنع','ميدان الحوامدية','كورنيش الحوامدية','شارع المحافظة'],
  'البدرشين': ['شارع البدرشين','شارع المدرسة','ميدان البدرشين','شارع الجسر','الحوامدية'],
  'أبو النمرس': ['شارع أبو النمرس','شارع المحافظة','ميدان أبو النمرس','شارع الجيزة','شارع النيل'],
  'الوراق': ['شارع الوراق','شارع النيل','جزيرة الوراق','ميدان الوراق','شارع ترعة المنصورية','شارع التحرير'],
  'إمبابة': ['شارع السودان','شارع الوحدة','ميدان إمبابة','شارع كورنيش النيل','شارع فيصل','أرض اللواء','شارع طلبة عويضة','سوق إمبابة','ميدان كيت كات','ميدان ابن الحكم'],
  'العجوزة': ['شارع النيل','شارع أحمد عرابي','شارع السودان','شارع وادي النيل','ميدان الجلاء','شارع شهاب','كورنيش العجوزة','ميدان كيت كات'],
  'بولاق الدكرور': ['شارع ناهيا','شارع المحولات','ميدان بولاق الدكرور','شارع العمرانية','شارع المنيب','عزبة الصعايدة','شارع الثلاثيني'],
  'أوسيم': ['شارع أوسيم','شارع الجيزة','ميدان أوسيم','شارع المقريزي','ترعة المنصورية'],
  'كرداسة': ['شارع كرداسة','شارع السياحة','ميدان كرداسة','سوق كرداسة','شارع الأهرام','شارع نهضة مصر'],
  'المنيب': ['شارع المنيب','ميدان المنيب','شارع النيل','محطة المنيب','كوبري المنيب','شارع الجيزة','أول المنيب'],
  'الطالبية': ['شارع الطالبية','شارع فيصل','شارع الهرم','ميدان الطالبية','شارع الملكة','اللبيني'],
  'ساقية مكي': ['شارع ساقية مكي','شارع المنيب','ميدان ساقية مكي','شارع فيصل','كوبري ساقية مكي'],
  'حدائق الاهرام': ['البوابة الأولى','البوابة الثانية','البوابة الثالثة','البوابة الرابعة','شارع الجيش','المنطقة التجارية'],
  'الجيزة': ['شارع الجيزة','ميدان الجيزة','شارع المحطة','شارع النيل','كورنيش الجيزة','جامعة القاهرة','شارع الملك فيصل','شارع السودان','حديقة الحيوان','ميدان الدقي'],
  'المريوطية': ['شارع المريوطية','ترعة المريوطية','شارع الهرم','المنصورية','كفر غطاطي','شارع اللبيني','كفر الجبل'],
  'أبو رواش': ['شارع أبو رواش','المنطقة الصناعية','ميدان أبو رواش','طريق القاهرة الإسكندرية الصحراوي','شارع المدرسة'],
  'الصف': ['شارع الصف','ميدان الصف','شارع الجيزة','شارع المحافظة','أطفيح','شارع النيل'],
  'أطفيح': ['شارع أطفيح','ميدان أطفيح','شارع المحافظة','شارع النيل','شارع الجمهورية'],
  'منشأة القناطر': ['شارع منشأة القناطر','ميدان المنشأة','شارع المحافظة','القناطر الخيرية','شارع النيل','شارع الرئيسي'],
  'الطوابق': ['شارع الطوابق','ميدان الطوابق','شارع الهرم','شارع فيصل','شارع العمرانية','الطالبية'],
  'أرض اللواء': ['شارع أرض اللواء','شارع السودان','ميدان أرض اللواء','شارع بولاق الدكرور','شارع ناهيا','شارع الوفاء والأمل','شارع ترعة الساحل'],
  // ===== الإسكندرية =====
  'سيدي جابر': ['شارع بورسعيد','محطة سيدي جابر','جناكليس','شارع مصطفى كامل','شارع أبو قير','ميدان سيدي جابر','شارع الحرية','شارع خليل حمادة','سيدي جابر الشيخ'],
  'سموحة': ['شارع فوزي معاذ','ميدان سموحة','نادي سموحة','شارع النصر','شارع 14 مايو','شارع توت عنخ أمون','شارع أحمد شوقي','شارع الحرية','شارع المشير'],
  'المنتزه': ['قصر المنتزه','شارع الجيش','شارع أبو قير','كورنيش المنتزه','حدائق المنتزه','معمورة','شارع مصطفى كامل','ميدان المنتزه'],
  'سيدي بشر': ['شارع خالد بن الوليد','شارع الأمل','سيدي بشر قبلي','سيدي بشر بحري','ميدان سيدي بشر','شارع 45','شارع فوزي معاذ','شارع مصطفى كامل'],
  'كليوباترا': ['شارع أبو قير','كليوباترا الصغيرة','ميدان كليوباترا','شارع كليوباترا','شارع 10','شارع الحرية'],
  'رشدي': ['شارع أبو قير','شارع رشدي','ميدان رشدي','شارع السلطان حسين','شارع النبي دانيال','شارع فؤاد'],
  'ستانلي': ['كوبري ستانلي','شارع الجيش','شاطئ ستانلي','ميدان ستانلي','شارع أبو قير','عمارات ستانلي'],
  'الابراهيمية': ['شارع مصطفى فهمي','شارع بورسعيد','ميدان الإبراهيمية','شارع أبو قير','محطة الإبراهيمية','شارع السلطان حسين'],
  'العصافرة': ['العصافرة قبلي','العصافرة بحري','شارع المعسكر الروماني','شارع 45','شارع 10','شارع حافظ إبراهيم','ميدان العصافرة'],
  'المندرة': ['المندرة قبلي','المندرة بحري','شاطئ المندرة','شارع الجيش','شارع 45','شارع مصطفى كامل','ميدان المندرة'],
  'جليم': ['شارع أبو قير','شارع جليم','ميدان جليم','شارع 14 مايو','كورنيش جليم','شارع رشدي'],
  'لوران': ['شارع لوران','شارع الترام','شارع مصطفى فهمي','ميدان لوران','شارع السلطان حسين','شارع 10'],
  'محرم بك': ['شارع محرم بك','شارع المحطة','ميدان محرم بك','شارع الحرية','شارع السلطان حسين','محطة مصر','شارع النبي دانيال'],
  'العطارين': ['شارع العطارين','شارع فؤاد','شارع النبي دانيال','ميدان العطارين','سوق العطارين','شارع السبع بنات','شارع الحرية'],
  'بحري': ['شارع رأس التين','قلعة قايتباي','ميدان أبو العباس','شارع الميناء الشرقي','الأنفوشي','شارع قصر رأس التين','شارع الكورنيش'],
  'العجمي': ['البيطاش','هانوفيل','العجمي البلد','شاطئ العجمي','شارع الملك مريوط','الهانوفيل','الدخيلة','كيلو 21'],
  'الدخيلة': ['شارع الدخيلة','الميناء','شارع النهضة','ميدان الدخيلة','الورديان','الدخيلة البلد','شارع المصنع'],
  'المعمورة': ['شاطئ المعمورة','المعمورة البلد','المعمورة الشاطئ','عزبة سعد','شارع الجيش','شارع أبو قير','منتزه المعمورة'],
  'كامب شيزار': ['شارع بورسعيد','شارع 14 مايو','شارع محمد فريد','ميدان كامب شيزار','شارع النصر','شارع إسكندر إبراهيم','المحكمة'],
  'فليمنج': ['شارع فليمنج','شارع أبو قير','ميدان فليمنج','شارع مصطفى كامل','شارع الترام','شارع 10'],
  'ميامي': ['شارع ميامي','شاطئ ميامي','شارع خالد بن الوليد','ميدان ميامي','شارع 45','شارع جمال عبد الناصر'],
  'أبو قير': ['شارع أبو قير','خليج أبو قير','قلعة أبو قير','شارع الكورنيش','الأنفوشي','طابية أبو قير','المعهد'],
  'المنشية': ['ميدان المنشية','شارع فؤاد','شارع صلاح سالم','ميدان التحرير','شارع النبي دانيال','سوق المنشية','شارع الحرية'],
  'الشاطبي': ['شارع بور سعيد','جامعة الإسكندرية','مستشفى الشاطبي','شارع الشاطبي','شارع الحرية','كلية الطب','ميدان الشاطبي'],
  'باكوس': ['شارع باكوس','شارع الإسكندر الأكبر','ميدان باكوس','محطة باكوس','شارع أبو قير','شارع 10'],
  'بولكلي': ['شارع بولكلي','شارع أبو قير','ميدان بولكلي','شارع السلطان حسين','شارع الترام','شارع مصطفى فهمي'],
  'زيزينيا': ['شارع زيزينيا','شارع أبو قير','ميدان زيزينيا','شارع بورسعيد','شارع الحرية','كورنيش زيزينيا'],
  'الحضرة': ['شارع الحضرة','شارع مصطفى كامل','ميدان الحضرة','شارع بورسعيد','مستشفى الحضرة','شارع المحطة'],
  'كرموز': ['شارع كرموز','شارع الميدان','ميدان كرموز','شارع المحمودية','شارع الحرية','عمود السواري','شارع النصر'],
  'العامرية': ['العامرية القديمة','العامرية الجديدة','المنطقة الصناعية','شارع الإسكندرية مطروح','ميدان العامرية','شارع التحرير','كينج مريوط'],
  'برج العرب': ['برج العرب القديمة','برج العرب الجديدة','المنطقة الصناعية','شارع الإسكندرية مطروح','ميدان برج العرب','مدينة برج العرب الجديدة'],
  'المكس': ['شارع المكس','الميناء','شارع الكورنيش','ميدان المكس','الورديان','شارع الحرية','منطقة النقل البحري'],
  'سابا باشا': ['شارع سابا باشا','شارع أبو قير','ميدان سابا باشا','شارع الحرية','شارع مصطفى كامل','شارع 10','شارع ألبرت الأول'],
  'مصطفى كامل': ['شارع مصطفى كامل','ميدان مصطفى كامل','شارع الفتح','شارع أبو قير','شارع جمال عبد الناصر','شارع 45','محطة مصطفى كامل'],
  'الشلالات': ['شارع الشلالات','حدائق الشلالات','شارع بورسعيد','ميدان الشلالات','شارع محطة الترام','شارع مصطفى كامل','شارع النبي دانيال'],
  'الأميرية': ['شارع الأميرية','شارع مصطفى كامل','ميدان الأميرية','شارع بورسعيد','شارع 45','محطة الأميرية','شارع جليم'],
  'سيدي كرير': ['شارع سيدي كرير','شاطئ سيدي كرير','طريق الإسكندرية مطروح','قرية مارينا','قرية هاسيندا','قرية ماربيلا','الساحل الشمالي'],
  'الهانوفيل': ['شارع الهانوفيل','شاطئ الهانوفيل','البيطاش','العجمي','طريق 45','شارع الملك مريوط','شارع النصر'],
  'غيط العنب': ['شارع غيط العنب','شارع الترعة','ميدان غيط العنب','شارع المحمودية','شارع الحرية','شارع الإسكندرية','محطة غيط العنب'],
  'الورديان': ['شارع الورديان','شارع بورسعيد','ميدان الورديان','شارع الكورنيش','شارع الحرية','شارع المصنع','محطة الورديان'],
  'النخيل': ['شارع النخيل','شارع الإسكندرية مطروح','ميدان النخيل','شارع الملك مريوط','العامرية','البيطاش','شارع 45'],
  'العوايد': ['شارع العوايد','شارع بورسعيد','ميدان العوايد','شارع محمد علي','شارع الحرية','شارع المحطة','سيدي بشر'],
  'الجمرك': ['شارع الجمرك','ميناء الإسكندرية','ميدان الجمرك','شارع رأس التين','شارع الكورنيش','الأنفوشي','شارع الحرية','المنشية'],
  'الأنفوشي': ['شارع الأنفوشي','قلعة قايتباي','شاطئ الأنفوشي','شارع رأس التين','ميدان أبو العباس','شارع الكورنيش','مقابر الأنفوشي','شارع الميناء'],
};

// Build comprehensive queries for a specific area using its sub-zones
function buildAreaQueries(searchTerm, area, city) {
  const zones = AREA_SUB_ZONES[area] || [];
  const queries = [
    `${searchTerm} في ${area}`,
    `${searchTerm} ${area}`,
  ];
  for (const zone of zones) {
    queries.push(`${searchTerm} ${zone} ${area}`);
  }
  if (city && city !== area) {
    queries.push(`${searchTerm} في ${area} ${city}`);
  }
  return [...new Set(queries.filter(q => q.trim()))];
}

// Helper: scrape a single Google Maps query using an existing page
async function scrapeGMapsQuery(page, query, maxPerQuery) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Handle cookie consent if it appears
  try {
    const consentBtn = await page.$('button[aria-label*="Accept"], button[aria-label*="قبول"], form[action*="consent"] button');
    if (consentBtn) await consentBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  } catch {}

  // Wait for search results to load
  try {
    await page.waitForSelector('div[role="feed"], div.Nv2PK', { timeout: 15000 });
  } catch {}

  // Scroll the results panel to load more items
  await autoScroll(page, maxPerQuery);

  // Extract business data from the rendered DOM
  const businesses = await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const items = document.querySelectorAll('div.Nv2PK');

    for (const item of items) {
      const nameEl = item.querySelector('.qBF1Pd, .fontHeadlineSmall, .NrDZNb');
      let name = nameEl ? nameEl.textContent.trim() : '';
      if (!name) {
        const linkEl = item.querySelector('a.hfpxzc');
        name = linkEl ? (linkEl.getAttribute('aria-label') || '').trim() : '';
      }
      if (!name || seen.has(name)) continue;
      seen.add(name);

      const ratingEl = item.querySelector('.MW4etd');
      const rating = ratingEl ? parseFloat(ratingEl.textContent) || 0 : 0;

      const infoDivs = item.querySelectorAll('.W4Efsd');
      const textSegments = [];
      for (const div of infoDivs) {
        const rawText = div.textContent || '';
        const parts = rawText.split(/\s*\u00b7\s*/);
        for (const p of parts) {
          const t = p.trim();
          if (t && t.length > 1) textSegments.push(t);
        }
      }

      let phone = '';
      let address = '';
      let category = '';

      for (const seg of textSegments) {
        if (/^\d+\.\d+\(\d+\)$/.test(seg) || /^\(\d+\)$/.test(seg)) continue;
        if (/^[\d\.\s]+$/.test(seg)) continue;

        const digits = seg.replace(/[^\d]/g, '');
        if (digits.length >= 8 && /^[\+\d]/.test(seg.trim()) && !phone) {
          phone = seg.trim();
          continue;
        }
        if (!category && seg.length < 30 && !seg.includes(',')) {
          category = seg;
          continue;
        }
        if (!address && seg.length > 3) {
          address = seg;
        }
      }

      const websiteEl = item.querySelector('a[data-value="Website"], a[href*="http"]:not([href*="google"])');
      const website = websiteEl ? websiteEl.href || '' : '';

      results.push({ name, phone, address, website, rating, category });
    }

    return results;
  });

  // Enrich: click into EVERY business to extract phone from detail panel
  for (let i = 0; i < Math.min(businesses.length, maxPerQuery); i++) {
    try {
      const links = await page.$$('a.hfpxzc');
      if (i >= links.length) break;
      await links[i].click();

      try {
        await page.waitForSelector(
          'button[data-item-id^="phone:"], [data-item-id="authority"], div.m6QErb',
          { timeout: 4000 }
        );
      } catch {}
      await new Promise(r => setTimeout(r, 800));

      const detail = await page.evaluate(() => {
        let phone = '';
        let website = '';
        let address = '';

        const phoneEl = document.querySelector('button[data-item-id^="phone:"]');
        if (phoneEl) {
          const attr = phoneEl.getAttribute('data-item-id') || '';
          const m = attr.match(/phone:tel:(.+)/) || attr.match(/phone:(.+)/);
          if (m) phone = m[1];
        }

        if (!phone) {
          const allBtns = document.querySelectorAll('button[aria-label], a[aria-label]');
          for (const btn of allBtns) {
            const label = btn.getAttribute('aria-label') || '';
            const m = label.match(/(?:هاتف|Phone|رقم)[:\s]*(\+?[\d][\d\s\-\(\)]{6,})/i);
            if (m) { phone = m[1]; break; }
          }
        }

        if (!phone) {
          const infoItems = document.querySelectorAll('.CsEnBe, .RcCsl, div[data-tooltip]');
          for (const el of infoItems) {
            const text = (el.textContent || '').trim();
            const digits = text.replace(/[^\d]/g, '');
            if (digits.length >= 8 && digits.length <= 15 && /^[\+\d]/.test(text)) {
              phone = text;
              break;
            }
          }
        }

        const webEl = document.querySelector('a[data-item-id="authority"]');
        if (webEl) website = webEl.href || '';

        const addrEl = document.querySelector('button[data-item-id="address"]');
        if (addrEl) address = (addrEl.getAttribute('aria-label') || '').replace(/^(عنوان|Address)[:\s]*/i, '').trim();

        return { phone, website, address };
      });

      if (detail.phone) businesses[i].phone = detail.phone;
      if (detail.website && !businesses[i].website) businesses[i].website = detail.website;
      if (detail.address && !businesses[i].address) businesses[i].address = detail.address;

      const backBtn = await page.$('button[aria-label*="Back"], button[aria-label*="رجوع"], button[jsaction*="back"]');
      if (backBtn) {
        await backBtn.click();
        await new Promise(r => setTimeout(r, 800));
      } else {
        await page.goBack({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1200));
      }

      try {
        await page.waitForSelector('div[role="feed"], div.Nv2PK', { timeout: 4000 });
      } catch {}
    } catch {
      // If enrichment fails for one item, continue to next
    }
  }

  return businesses;
}

// Clean and normalize a single business record
function cleanBusiness(b, industry, city) {
  let phone = (b.phone || '').replace(/^tel:/, '').replace(/\s+/g, '').trim();
  let address = (b.address || '')
    .replace(/[\s\u200b]*(مفتوح|مغلق|Open|Closed|سيغلق قريبًا|يفتح قريبًا|على مدار الساعة|24 ساعة)[\s\u200b]*/gi, '')
    .replace(/\d{3}[\s-]?\d{7,}$/g, '')
    .trim();

  return {
    company_name: b.name,
    phone,
    email: '',
    website: b.website || '',
    industry: industry || b.category || '',
    city: city || '',
    source: 'gmaps',
    address,
    rating: b.rating || 0,
  };
}

// Build query list helper
function buildQueryList(searchQuery, city, industry, comprehensive, area) {
  const baseQuery = searchQuery || `${industry || ''} في ${area || city || ''}`.trim();
  if (!comprehensive) return [baseQuery];

  // If a specific area is selected, do deep comprehensive search within that area
  // by searching across all streets/sub-zones
  if (area) {
    const searchTerm = searchQuery
      ? searchQuery.replace(new RegExp((area || city || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').replace(/\s*(في|بـ|ب|فى)\s*$/g, '').trim()
      : (industry || '');
    return buildAreaQueries(searchTerm, area, city);
  }

  // Comprehensive search across all city areas
  if (!city) return [baseQuery];
  const areas = CITY_AREAS[city] || [];
  const queries = [baseQuery];
  const searchTerm = searchQuery
    ? searchQuery.replace(new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').replace(/\s*(في|بـ|ب|فى)\s*$/g, '').trim()
    : (industry || '');
  for (const a of areas) {
    queries.push(`${searchTerm} في ${a}`);
  }
  return queries;
}

// ============================================================
// Google Maps — SSE streaming endpoint (results sent in real-time)
// ============================================================
router.get('/gmaps/stream', async (req, res) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let browser = null;
  const { searchQuery, city, industry, maxResults: maxResultsStr, comprehensive: compStr, area } = req.query;
  const maxResults = parseInt(maxResultsStr) || 40;
  const comprehensive = compStr === 'true';

  if (!searchQuery && !city) {
    send('error', { error: 'searchQuery or city is required' });
    res.end();
    return;
  }

  try {
    const queries = buildQueryList(searchQuery, city, industry, comprehensive, area);
    const limit = Math.min(maxResults, 10000);
    // In comprehensive mode, limit per-area to 40 (breadth over depth)
    const maxPerQuery = comprehensive ? Math.min(100, limit) : limit;

    send('status', { 
      message: comprehensive ? `بدء البحث الشامل — ${queries.length} منطقة` : 'بدء البحث...', 
      totalQueries: queries.length 
    });

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=ar',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,en-US;q=0.9' });

    const seenNames = new Set();
    const seenPhones = new Set();
    let totalScraped = 0;
    let totalWithPhone = 0;
    let totalNew = 0;
    let totalAlreadySaved = 0;
    const queryStats = [];

    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];

      // Check if client disconnected
      if (res.writableEnded || res.destroyed) {
        console.log('[gmaps/stream] Client disconnected, stopping scrape');
        break;
      }

      send('progress', { 
        queryIndex: qi, 
        totalQueries: queries.length, 
        currentQuery: q,
        message: `جاري البحث في: ${q}` 
      });

      try {
        const businesses = await scrapeGMapsQuery(page, q, maxPerQuery);
        const newBusinesses = [];
        
        for (const b of businesses) {
          const key = b.name.trim().toLowerCase();
          const phoneKey = (b.phone || '').replace(/[^\d]/g, '');
          if (seenNames.has(key)) continue;
          if (phoneKey && seenPhones.has(phoneKey)) continue;
          seenNames.add(key);
          if (phoneKey) seenPhones.add(phoneKey);
          newBusinesses.push(b);
        }

        // Clean and filter for phone
        const cleaned = newBusinesses.map(b => cleanBusiness(b, industry, city));
        const withPhone = cleaned.filter(r => r.phone && r.phone.length >= 8);

        // Check DB for dedup
        let results = withPhone;
        if (withPhone.length > 0) {
          const phoneNumbers = withPhone.map(r => r.phone);
          const existingLeads = await Lead.find(
            { phone: { $in: phoneNumbers } },
            { phone: 1 }
          ).lean();
          const existingPhones = new Set(existingLeads.map(l => l.phone));
          results = withPhone.map(r => ({
            ...r,
            alreadySaved: existingPhones.has(r.phone),
          }));
        }

        totalScraped += cleaned.length;
        totalWithPhone += results.length;
        const qNewCount = results.filter(r => !r.alreadySaved).length;
        const qSavedCount = results.filter(r => r.alreadySaved).length;
        totalNew += qNewCount;
        totalAlreadySaved += qSavedCount;

        const stat = { query: q, found: businesses.length, new: qNewCount };
        queryStats.push(stat);

        // Stream the results for this area immediately
        if (results.length > 0) {
          send('results', { 
            area: q, 
            areaIndex: qi,
            leads: results,
            areaStat: stat,
          });
        }

        // Send cumulative stats update
        send('stats', {
          totalScraped,
          withPhone: totalWithPhone,
          newLeads: totalNew,
          alreadySaved: totalAlreadySaved,
          queriesCompleted: qi + 1,
          totalQueries: queries.length,
        });

      } catch (err) {
        console.error(`[gmaps/stream] Error scraping "${q}":`, err.message);
        queryStats.push({ query: q, found: 0, new: 0, error: err.message });
        send('areaError', { query: q, error: err.message, queryIndex: qi });
      }

      if (totalWithPhone >= limit) break;
    }

    await browser.close();
    browser = null;

    // Send final completion event
    send('done', {
      total: totalWithPhone,
      totalScraped,
      withPhone: totalWithPhone,
      newLeads: totalNew,
      alreadySaved: totalAlreadySaved,
      queriesRun: queries.length,
      queryStats,
      query: { searchQuery: searchQuery || `${industry || ''} في ${city || ''}`.trim(), city, industry, comprehensive },
    });

    res.end();
  } catch (err) {
    console.error('[gmaps/stream] Fatal error:', err.message);
    send('error', { error: err.message });
    res.end();
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
});

// Keep the POST endpoint for non-streaming (backward compat)
router.post('/gmaps', async (req, res) => {
  let browser = null;
  try {
    const { searchQuery, city, industry, maxResults = 40, comprehensive = false, area } = req.body;
    if (!searchQuery && !city) {
      return res.status(400).json({ error: 'searchQuery or city is required' });
    }

    const queries = buildQueryList(searchQuery, city, industry, comprehensive, area);
    const limit = Math.min(maxResults, 10000);
    const maxPerQuery = comprehensive ? Math.min(100, limit) : limit;

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=ar',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,en-US;q=0.9' });

    const allBusinesses = [];
    const seenNames = new Set();
    const seenPhones = new Set();
    const queryStats = [];

    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      try {
        const businesses = await scrapeGMapsQuery(page, q, maxPerQuery);
        let added = 0;
        for (const b of businesses) {
          const key = b.name.trim().toLowerCase();
          const phoneKey = (b.phone || '').replace(/[^\d]/g, '');
          if (seenNames.has(key)) continue;
          if (phoneKey && seenPhones.has(phoneKey)) continue;
          seenNames.add(key);
          if (phoneKey) seenPhones.add(phoneKey);
          allBusinesses.push(b);
          added++;
        }
        queryStats.push({ query: q, found: businesses.length, new: added });
      } catch (err) {
        queryStats.push({ query: q, found: 0, new: 0, error: err.message });
      }
      if (allBusinesses.length >= limit) break;
    }

    await browser.close();
    browser = null;

    const allResults = allBusinesses.slice(0, limit).map(b => cleanBusiness(b, industry, city));
    const withPhone = allResults.filter(r => r.phone && r.phone.length >= 8);

    const phoneNumbers = withPhone.map(r => r.phone);
    const existingLeads = await Lead.find(
      { phone: { $in: phoneNumbers } },
      { phone: 1 }
    ).lean();
    const existingPhones = new Set(existingLeads.map(l => l.phone));

    const results = withPhone.map(r => ({
      ...r,
      alreadySaved: existingPhones.has(r.phone),
    }));
    results.sort((a, b) => (a.alreadySaved === b.alreadySaved ? 0 : a.alreadySaved ? 1 : -1));

    const newCount = results.filter(r => !r.alreadySaved).length;
    const existingCount = results.filter(r => r.alreadySaved).length;

    res.json({
      total: results.length,
      totalScraped: allResults.length,
      withPhone: results.length,
      newLeads: newCount,
      alreadySaved: existingCount,
      queriesRun: queries.length,
      queryStats,
      query: { searchQuery: searchQuery || `${industry || ''} في ${city || ''}`.trim(), city, industry, comprehensive },
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
});

async function autoScroll(page, targetCount) {
  const feedSelector = 'div[role="feed"]';
  const scrollable = await page.$(feedSelector);
  if (!scrollable) return;

  let prevCount = 0;
  let staleRounds = 0;

  for (let i = 0; i < 200; i++) {
    const count = await page.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      'div.Nv2PK'
    );

    // Check if we've hit Google's "end of list" marker
    const reachedEnd = await page.evaluate((sel) => {
      const feed = document.querySelector(sel);
      if (!feed) return false;
      // Google Maps shows a message or a specific element at the end of results
      const endText = feed.querySelector('.HlvSq, .m6QErb + div, p.fontBodyMedium');
      if (endText && /نهاية|end of|لا توجد نتائج أخرى|No more results/i.test(endText.textContent || '')) return true;
      return false;
    }, feedSelector);

    if (count >= targetCount || reachedEnd || staleRounds >= 5) break;
    if (count === prevCount) staleRounds++;
    else staleRounds = 0;
    prevCount = count;

    // Scroll aggressively — large distance + scroll to bottom
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollBy(0, 10000);
        el.scrollTop = el.scrollHeight;
      }
    }, feedSelector);

    // Longer wait to allow lazy-loading, especially for slower connections
    await new Promise(r => setTimeout(r, 2000));
  }
}

// ============================================================
// Save scraped results as leads (bulk import with dedup)
// ============================================================
router.post('/save', async (req, res) => {
  try {
    const { leads: leadsData, assignTo } = req.body;
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ error: 'leads array is required' });
    }

    let success = 0;
    let failed = 0;
    let duplicates = 0;
    let noPhone = 0;
    const created = [];

    for (const data of leadsData) {
      if (!data.company_name) { failed++; continue; }
      if (!data.phone) { noPhone++; continue; }

      try {
        const lead = await Lead.create({
          company_name: data.company_name,
          phone: data.phone.replace(/\s+/g, ''),
          email: data.email || '',
          website: data.website || '',
          industry: data.industry || 'غير محدد',
          city: data.city || 'غير محدد',
          source: data.source || 'gmaps',
          status: 'new',
          assigned_to: assignTo || '',
          notes: data.address ? `العنوان: ${data.address}` : '',
          rating: data.rating || 0,
        });
        created.push(lead);
        success++;
      } catch (err) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          failed++;
        }
      }
    }

    res.status(201).json({ success, failed, duplicates, noPhone, leads: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
