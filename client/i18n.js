import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// استيراد ملفات الترجمة
import translationAR from './src/locales/ar.json';
import translationEN from './src/locales/en.json';

const resources = {
  ar: {
    translation: translationAR
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(LanguageDetector) // كشف لغة المستخدم تلقائياً وحفظها في الـ LocalStorage
  .use(initReactI18next) // ربط المكتبة مع React
  .init({
    resources,
    fallbackLng: 'ar', // اللغة الافتراضية في حال عدم التعرف على لغة المتصفح
    interpolation: {
      escapeValue: false // React يحمي من XSS تلقائياً
    },
    detection: {
      order: ['localStorage', 'navigator'], // البحث أولاً في التخزين المحلي ثم المتصفح
      caches: ['localStorage'] // حفظ خيار المستخدم هنا دائماً
    }
  });

// تحديث اتجاه الموقع (RTL/LTR) تلقائياً عند تشغيل التطبيق بناءً على اللغة الحالية
const updateDirection = (lng) => {
  const dir = resources[lng]?.translation?.dir || 'rtl';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
};

// تفعيل الاتجاه عند البداية وعند تغيير اللغة
updateDirection(i18n.language || 'ar');
i18n.on('languageChanged', (lng) => {
  updateDirection(lng);
});

export default i18n;