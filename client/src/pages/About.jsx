import React from 'react';
import { HiOutlineHome, HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineTrendingUp } from 'react-icons/hi';
import { useTranslation } from 'react-i18next'; // 1. استيراد المكتبة

export default function About() {
  const { t, i18n } = useTranslation(); // 2. تهيئة الترجمة

  // تحديد اتجاه الـ divider بناء على اتجاه اللغة الحالي لمنع تداخل الحدود
  const isRtl = i18n.language === 'ar';

  return (
    <div className='bg-slate-50/50 min-h-screen text-slate-700'>
      
      {/* 🚀 1. Hero Section (قسم العنوان الرئيسي) */}
      <div className='bg-white border-b border-slate-100 py-20 px-4 text-center relative overflow-hidden'>
        <div className='max-w-3xl mx-auto flex flex-col gap-4 relative z-10'>
          <span className='text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block mx-auto'>
            {t('about_journey')}
          </span>
          <h1 className='text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight'>
            {t('about_title_1')} <span className='text-blue-600 underline decoration-blue-200 decoration-wavy'>{t('about_title_2')}</span>
          </h1>
          <p className='text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed mt-2'>
            {t('about_description')}
          </p>
        </div>
        {/* تأثير خلفية ناعم */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-3xl -z-0 pointer-events-none'></div>
      </div>

      {/* 📊 2. Stats Section (لوحة الأرقام والإحصائيات) */}
      <div className='max-w-6xl mx-auto px-4 -mt-10 relative z-20 mb-16'>
        {/* تم تحديث اتجاه الـ divide-x ليدعم الـ RTL والـ LTR ديناميكياً */}
        <div className={`bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y-2 md:divide-y-0 divide-slate-800 ${isRtl ? 'md:divide-x-reverse md:divide-x' : 'md:divide-x'}`}>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>12K+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>{t('stats_properties')}</span>
          </div>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>8K+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>{t('stats_customers')}</span>
          </div>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>150+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>{t('stats_agents')}</span>
          </div>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>10+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>{t('stats_experience')}</span>
          </div>
        </div>
      </div>

      {/* 🏛️ 3. Our Story Section (قصتنا ورؤيتنا) */}
      <div className='max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16'>
        <div className='flex flex-col gap-5'>
          <h2 className='text-2xl md:text-3xl font-bold text-slate-900 tracking-tight'>
            {t('about_mission_title')}
          </h2>
          <p className='text-sm text-slate-500 leading-relaxed'>
            {t('about_mission_p1')}
          </p>
          <p className='text-sm text-slate-500 leading-relaxed'>
            {t('about_mission_p2')}
          </p>
        </div>
        
        {/* بطاقة الرؤية الجانبية */}
        <div className='bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-6'>
          <div className='w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm'>
            <HiOutlineTrendingUp size={24} />
          </div>
          <h3 className='text-xl font-bold text-slate-900'>{t('about_why_title')}</h3>
          <p className='text-sm text-slate-500 leading-relaxed'>
            {t('about_why_description')}
          </p>
        </div>
      </div>

      {/* 🛡️ 4. Values Section (قيمنا الأساسية) */}
      <div className='max-w-6xl mx-auto px-4 pb-24'>
        <div className='text-center max-w-xl mx-auto flex flex-col gap-2 mb-12'>
          <h2 className='text-2xl font-bold text-slate-900'>{t('about_values_title')}</h2>
          <p className='text-sm text-slate-400'>{t('about_values_subtitle')}</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* كرت 1 */}
          <div className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'>
            <div className='w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white'>
              <HiOutlineShieldCheck size={20} />
            </div>
            <h4 className='font-bold text-slate-900 text-base'>{t('value_trust_title')}</h4>
            <p className='text-xs text-slate-500 leading-relaxed'>
              {t('value_trust_desc')}
            </p>
          </div>

          {/* كرت 2 */}
          <div className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'>
            <div className='w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white'>
              <HiOutlineHome size={20} />
            </div>
            <h4 className='font-bold text-slate-900 text-base'>{t('value_premium_title')}</h4>
            <p className='text-xs text-slate-500 leading-relaxed'>
              {t('value_premium_desc')}
            </p>
          </div>

          {/* كرت 3 */}
          <div className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'>
            <div className='w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white'>
              <HiOutlineUserGroup size={20} />
            </div>
            <h4 className='font-bold text-slate-900 text-base'>{t('value_client_title')}</h4>
            <p className='text-xs text-slate-500 leading-relaxed'>
              {t('value_client_desc')}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}