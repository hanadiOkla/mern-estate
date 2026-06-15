// api/utils/rateLimiter.js
import rateLimit from 'express-rate-limit';

// محدد استهلاك صارم للعمليات المكلفة ماليًا وتقنيًا (توليد وتقييم الـ AI)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // نافذة زمنية مدتها ساعة كاملة (60 دقيقة)
  max: 5, // يسمح بـ 5 طلبات فقط لكل مستخدم (بناءً على الـ IP) خلال هذه الساعة
  message: {
    success: false,
    message: '⚠️ لقد تجاوزت الحد المسموح به لاستخدام تقنيات الذكاء الاصطناعي لهذه الساعة. يرجى المحاولة لاحقاً لحماية موارد النظام.'
  },
  standardHeaders: true, // إرجاع معلومات الحد في الـ headers الكلاسيكية
  legacyHeaders: false, // إيقاف الـ headers القديمة وغير القياسية
});