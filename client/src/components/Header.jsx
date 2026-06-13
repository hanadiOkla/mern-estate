import { FaSearch } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // 1. استيراد الـ Hook الخاص بالترجمة

function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState(''); 
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(); // 2. تفعيل الترجـمة داخل المكون

  const handelSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search); 
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFormUrl = urlParams.get('searchTerm');
    if (searchTermFormUrl) {
      setSearchTerm(searchTermFormUrl);
    }
  }, [location.search]);

  // دالة تبديل اللغة ديناميكياً
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className='bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 transition-all'>
      <div className='flex justify-between items-center max-w-7xl mx-auto p-4 px-6'>
        
        {/* اللوجو */}
        <Link to="/">
          <h1 className='font-extrabold text-lg sm:text-2xl tracking-tight flex items-center gap-1'>
            <span className='text-blue-600'>Sahand</span>
            <span className='text-slate-800 font-light'>Estate</span>
          </h1>
        </Link>

        {/* صندوق البحث: ترجمة الـ Placeholder ديناميكياً */}
        <form onSubmit={handelSubmit} className='bg-slate-50 border border-slate-200/80 p-2.5 px-4 rounded-full flex items-center w-full max-w-xs sm:max-w-md md:max-w-lg transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm'>
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            className='bg-transparent focus:outline-none w-full text-sm text-slate-700 placeholder-slate-400'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className='p-1 hover:scale-11 transition-transform'>
            <FaSearch className='text-slate-400 hover:text-blue-600 transition-colors text-sm'/>
          </button>
        </form>

        {/* القائمة وزر تبديل اللغة */}
        <ul className='flex gap-4 sm:gap-6 items-center font-medium text-sm text-slate-600'>
          
          {/* الروابط: ترجمة الكلمات والأنيميشن متوافق مع الاتجاهين بفضل Tailwind */}
          <Link to="/">
            <li className='hidden sm:inline hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-blue-600 after:transition-all'>
              {t('nav_home')}
            </li>
          </Link>    
          <Link to="/about">
            <li className='hidden sm:inline hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-blue-600 after:transition-all'>
              {t('nav_about')}
            </li>
          </Link>

          {/* زر تبديل اللغة الأنيق */}
          <li>
            <button 
              onClick={toggleLanguage}
              className='px-3 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer'
            >
              {i18n.language === 'ar' ? 'انجليزي' : 'Arabic'}
            </button>
          </li>

          {/* الملف الشخصي أو تسجيل الدخول */}
          <Link to="/profile" className='flex items-center'>
            {currentUser ? (
              <img className='rounded-full h-8 w-8 object-cover border-2 border-blue-500/20 hover:border-blue-500 transition-all' src={currentUser.avatar} alt="profile" />
            ) : (
              <li className='bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition-all shadow-sm hover:shadow-blue-500/20 font-semibold text-xs sm:text-sm whitespace-nowrap'>
                {t('sign_in')}
              </li>
            )}
          </Link>
        </ul>
      </div>
    </header>
  );
}

export default Header;