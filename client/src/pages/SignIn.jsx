import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import OAuth from '../components/OAuth';
// 1. استيراد خطاف الترجمة من react-i18next
import { useTranslation } from "react-i18next";

function SignIn() {
  const [formData, setFormDate] = useState({});
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  // 2. تفعيل دالة الترجمة ومعرفة الاتجاه الحالي
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const handleChange = (e) => {
    setFormDate({
        ...formData, 
        [e.target.id]: e.target.value,
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    try {
      dispatch(signInStart());
      const res = await fetch(`${window.API_BASE_URL}/api/auth/signin`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success === false) {
        dispatch(signInFailure(data.message));
        return;
      }
      dispatch(signInSuccess(data));
      navigate('/');
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center bg-slate-50/50 px-4 py-12'>
      
      {/* بطاقة تسجيل الدخول الرئيسية */}
      <div className='bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-md flex flex-col gap-6 transition-all duration-300'>
        
        {/* العناوين والترحيب */}
        <div className='text-center flex flex-col gap-1.5'>
          <h1 className='text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight'>
            {t('signin.welcome_title')}
          </h1>
          <p className='text-xs md:text-sm text-slate-400 font-medium'>
            {t('signin.welcome_subtitle')}
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4.5'>
          
          {/* حقل البريد الإلكتروني */}
          <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
            <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>
              {t('signin.email_label')}
            </label>
            <input 
              type="email" 
              placeholder='name@example.com' 
              className={`border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 bg-slate-50/30 ${isRtl ? 'text-right' : 'text-left'}`} 
              id='email'  
              onChange={handleChange}
              required
            />
          </div>

          {/* حقل كلمة المرور */}
          <div className={`flex flex-col gap-1.5 mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>
              {t('signin.password_label')}
            </label>
            <input 
              type="password" 
              placeholder='••••••••' 
              className={`border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 bg-slate-50/30 ${isRtl ? 'text-right' : 'text-left'}`} 
              id='password'  
              onChange={handleChange}
              required
            />
          </div>

          {/* زر تسجيل الدخول الأساسي مع حالة التحميل */}
          <button 
            disabled={loading} 
            className='bg-blue-600 text-white p-3.5 rounded-xl font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-600/10 text-sm disabled:opacity-70 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2'
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('signin.loading_text')}</span>
              </>
            ) : (
              t('signin.submit_btn')
            )}
          </button>

          {/* الفاصل البصري بين الأزرار */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {t('signin.or')}
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* مكون جوجل الخارجي */}
          <OAuth />
        </form>

        {/* روابط الانتقال وإنشاء الحساب */}
        <div className={`flex items-center justify-center gap-1.5 mt-2 text-sm font-medium border-t border-slate-100/80 pt-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <p className='text-slate-500'>{t('signin.no_account')}</p>
          <Link to={"/sign-up"}>
            <span className='text-blue-600 hover:text-blue-700 hover:underline transition-colors font-semibold'>
              {t('signin.signup_link')}
            </span>
          </Link>
        </div>

        {/* صندوق عرض الأخطاء الاحترافي */}
        {error && (
          <div className='bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium text-center animate-shake mt-1'>
            {error}
          </div>
        )}

      </div>
    </div>
  )
}

export default SignIn;