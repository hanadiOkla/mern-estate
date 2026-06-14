import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // استيراد خطاف الترجمة

export default function Contact({ listing }) {
  const { t } = useTranslation(); // تفعيل دالة الترجمة
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState('');
  
  const onChange = (e) => {
    setMessage(e.target.value);
  }

  useEffect(() => {
    const fetchLandlord = async () => {
      try {
        const res = await fetch(`/api/user/${listing.userRef}`);
        const data = await res.json();
        setLandlord(data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchLandlord();
  }, [listing.userRef]);

  return (
    <>
      {landlord && (
        // إضافة text-start لضمان محاذاة النصوص حسب اتجاه اللغة تلقائياً
        <div className='bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5 mt-6 animate-fadeIn text-start'>
          
          {/* عنوان القسم */}
          <div>
            <h3 className='text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2'>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('contact.title', 'Contact Landlord')}
            </h3>
            <p className='text-xs text-slate-400 mt-1 leading-relaxed'>
              {t('contact.description', { 
                username: landlord.username, 
                listingName: listing.name,
                defaultValue: `Send a direct email to ${landlord.username} regarding ${listing.name}.`
              })}
            </p>
          </div>

          {/* حقل كتابة الرسالة */}
          <div className='flex flex-col gap-1.5'>
            {/* استبدال ml-1 بـ ltr:ml-1 rtl:mr-1 لضمان إزاحة التسمية بشكل صحيح */}
            <label htmlFor="message" className='text-xs font-bold text-slate-700 tracking-wide ltr:ml-1 rtl:mr-1'>
              {t('contact.label', 'Your Message')}
            </label>
            <textarea 
              name="message" 
              id="message" 
              rows='4' 
              value={message} 
              onChange={onChange}
              placeholder={t('contact.placeholder', 'Write your message here...')}
              className='border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20 resize-none placeholder:text-slate-400'
            ></textarea>
          </div>

          {/* زر الإرسال المحدث مع دعم تدويل الـ Subject والـ Link */}
          <Link
            to={`mailto:${landlord.email}?subject=${encodeURIComponent(t('contact.emailSubject', { listingName: listing.name, defaultValue: `Regarding ${listing.name}` }))}&body=${encodeURIComponent(message)}`}
            className='bg-slate-900 text-white rounded-xl p-3.5 font-semibold uppercase text-center hover:bg-slate-800 active:scale-[0.99] transition-all text-sm shadow-md shadow-slate-900/10 flex items-center justify-center gap-2'            
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {t('contact.button', 'Send Message')}
          </Link>

        </div>
      )}
    </>
  )
}