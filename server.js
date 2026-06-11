import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
dotenv.config();
const app = express();
const PORT = 5000;

// تفعيل الـ CORS لتسمح للـ Front-end (المرفوع على Vercel مثلاً) بالاتصال بالباك-إند
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("خطأ: يرجى التأكد من إضافة بيانات Supabase في ملف الـ .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
// === 1. إعدادات الـ CORS والأمن الحساسة ===
// يجب تحديد الـ Origin بدقة (رابط الفرونت-إند) وتفعيل credentials لكي يسمح بتبادل الكوكيز
// تأكد من ضبط الإعدادات بهذا الشكل الدقيق
// app.use(cors({
//     // 1. تحديد رابط الفرونت-إند بدقة (بدون سكايب / في الآخر)
//     origin: 'http://localhost:5173', 
    
//     // 2. السماح بتبادل الكوكيز و الـ Credentials عبر المتصفح
//     credentials: true,
    
//     // 3. السماح بأساليب الطلبات التي تستخدمها
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
//     // 4. السماح بـ الـ Headers القياسية التي يرسلها الـ Fetch
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));


app.use(express.json());
app.use(cookieParser()); // تفعيل قارئ الكوكيز لتبسيط الـ Authentication

const insertLimiter = rateLimit({
  windowMs: 4 * 60 * 1000, // 5 دقائق
  max: 10, // أقصى حد 3 طلبات فقط من نفس الجهاز
  message: { error: "لقد تجاوزت الحد المسموح من المحاولات، يرجى الانتظار 4 دقائق." },
  standardHeaders: true, 
  legacyHeaders: false, 
});
// === 2. الـ API الرئيسي: تسجيل الدخول والمصادقة الصارمة ===
app.post('/api/verify-key',insertLimiter, async (req, res) => {
    try {
        const { keyUser } = req.body;

        if (!keyUser) {
            return res.status(400).json({ success: false, message: "المفتاح السري مطلوب." });
        }

        // جلب بيانات المستخدم من سوبابيز بناءً على الـ key_user
        const { data: user, error: fetchError } = await supabase
            .from('users_app')
            .select('key_user, date_expired, key_use')
            .eq('key_user', keyUser)
            .maybeSingle();

        if (fetchError) {
            console.error("خطأ أثناء جلب البيانات من سوبابيز:", fetchError.message);
            return res.status(500).json({ success: false, message: "خطأ داخلي في خادم الفحص." });
        }

        // أ) التحقق من وجود المفتاح أصلاً بالنظام
        if (!user) {
            return res.status(401).json({ success: false, message: "المفتاح المدخل غير صحيح أو غير مسجل." });
        }

        // ب) التحقق من الصلاحية الزمنية: تاريخ اليوم يجب أن يكون أصغر من تاريخ الانتهاء
        const today = new Date();
        const expiredDate = new Date(user.date_expired);

        if (today >= expiredDate) {
            return res.status(403).json({ success: false, message: "عذراً، هذا المفتاح انتهت صلاحيته الزمنية." });
        }

        // ج) التحقق من قيد الاستخدام: يجب أن يكون false لم يستعمل بعد
        if (user.key_use === true) {
            return res.status(403).json({ success: false, message: "هذا المفتاح تم تفعيله واستخدامه مسبقاً على جهاز آخر." });
        }

        // === التحديث الأمني: تحويل كود الاستخدام إلى True ===
        const { error: updateError } = await supabase
            .from('users_app')
            .update({ key_use: true })
            .eq('key_user', keyUser);

        if (updateError) {
            console.error("فشل تحديث حالة المفتاح إلى مستخدم:", updateError.message);
            return res.status(500).json({ success: false, message: "فشل تفعيل المفتاح في النظام." });
        }

        // === تفعيل جلسة المتصفح: زرع الـ HttpOnly Cookie بأمان عالٍ ===
        res.cookie('secure_user_key', keyUser, {
            httpOnly: true, // تمنع الـ JavaScript (الفرونت-إند) من سرقة الكوكي لحماية ضد هجمات XSS
            secure: process.env.NODE_ENV === 'production', // تشتغل فقط عبر HTTPS في البيئة الحية الحقيقية
            sameSite: 'strict', // تمنع إرسال الكوكي مع طلبات المواقع الخارجية لحماية ضد هجمات CSRF
            maxAge: 30 * 24 * 60 * 60 * 1000 // مدة صلاحية الكوكي بمتصفح العميل (30 يوماً كمثال)
        });

        // إرجاع رد النجاح المتوافق مع الفرونت إند
        return res.status(200).json({
            success: true,
            message: "تم التحقق التام وتفعيل الحساب بنجاح!",
            key_user: keyUser
        });

    } catch (err) {
        console.error("خطأ غير متوقع بـ الـ Login API:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// === 3. الـ API الصامت: لفحص الكوكي تلقائياً عند تحديث الصفحة (F5) ===
app.get('/api/check-session',insertLimiter, async (req, res) => {
    try {
        // قراءة الكوكي المشفرة القادمة تلقائياً من المتصفح عبر cookie-parser
        const savedKey = req.cookies.secure_user_key;

        if (!savedKey) {
            return res.status(401).json({ success: false, message: "لا توجد جلسة نشطة." });
        }

        // التأكد من سوبابيز أن المفتاح لا يزال صالحاً زمنيًا (لزيادة الحماية إذا قام الأدمن بحظره)
        const { data: user } = await supabase
            .from('users_app')
            .select('key_user, date_expired')
            .eq('key_user', savedKey)
            .maybeSingle();

        if (!user || new Date() >= new Date(user.date_expired)) {
            // إذا تم التلاعب أو انتهت الصلاحية، نمسح الكوكي فوراً
            res.clearCookie('secure_user_key');
            return res.status(401).json({ success: false, message: "الجلسة منتهية أو غير صالحة." });
        }

        return res.status(200).json({
            success: true,
            key_user: user.key_user
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// === 4. الـ API المسؤول عن تسجيل الخروج (تدمير الكوكي) ===
app.post('/api/logout',insertLimiter, (req, res) => {
    res.clearCookie('secure_user_key', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    return res.status(200).json({ success: true, message: "تم تسجيل الخروج بنجاح وتطهير الجلسة." });
});



app.listen(5000, () => {
  console.log(`سيرفر الباك-إند شغال بنجاح على المنفذ: http://localhost:5000`);
});
