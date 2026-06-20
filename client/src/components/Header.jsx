import { FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const handelSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFormUrl = urlParams.get('searchTerm');
    if (searchTermFormUrl) {
      setSearchTerm(searchTermFormUrl);
    }
  }, [location.search]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className='bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 transition-all'>
      <div className='flex justify-between items-center max-w-7xl mx-auto p-4 px-6 gap-4'>
        
        {/* 1. اللوجو: يظهر في جميع الشاشات دائماً */}
        <Link to="/" className="shrink-0">
          <h1 className='font-extrabold text-xl sm:text-2xl tracking-tight flex items-center gap-1'>
            <span className='text-blue-600'>ApexReal</span>
            <span className='text-slate-800 font-light'>Estate</span>
          </h1>
        </Link>

        {/* 2. صندوق البحث: يختفي في الموبايل الصغير جداً، ويظهر بدءاً من التابلت (md) فما فوق */}
        <form onSubmit={handelSubmit} className='hidden md:flex bg-slate-50 border border-slate-200/80 p-2.5 px-4 rounded-full items-center w-full max-w-xs md:max-w-md transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm'>
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            className='bg-transparent focus:outline-none w-full text-sm text-slate-700 placeholder-slate-400'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className='p-1 hover:scale-11 transition-transform'>
            <FaSearch className='text-slate-400 hover:text-blue-600 transition-colors text-sm'/>
          </button>
        </form>

        {/* 3. الروابط للـ Desktop فقط (تظهر فقط من شاشات lg فما فوق وتختفي في التابلت والموبايل) */}
        <ul className='hidden lg:flex gap-6 items-center font-medium text-sm text-slate-600'>
          <Link to="/">
            <li className='hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-blue-600 after:transition-all'>
              {t('nav_home')}
            </li>
          </Link>    
          <Link to="/about">
            <li className='hover:text-blue-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-blue-600 after:transition-all'>
              {t('nav_about')}
            </li>
          </Link>

          <li>
            <button 
              onClick={toggleLanguage}
              className='px-3 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer'
            >
              {i18n.language === 'ar' ? 'انجليزي' : 'Arabic'}
            </button>
          </li>
        </ul>

        {/* 4. قسم البروفايل وزر المنيو (يظهر في الموبايل والتابلت، ويختفي في الـ Desktop الكبير) */}
        <div className='flex items-center gap-4'>
          
          {/* صورة البروفايل أو زر تسجيل الدخول: يظهر دائماً في الخارج بالتابلت والـ Desktop، وفي الموبايل يظهر البروفايل فقط */}
          <Link to="/profile" className='flex items-center'>
            {currentUser ? (
              <img className='rounded-full h-8 w-8 object-cover border-2 border-blue-500/20 hover:border-blue-500 transition-all' src={currentUser.avatar} alt="profile" />
            ) : (
              // زر تسجيل الدخول يختفي في الموبايل الصغير (sm) ويظهر في التابلت (md) والديكستوب خارج المنيو
              <li className='hidden md:block bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all shadow-sm font-semibold text-sm whitespace-nowrap list-none'>
                {t('sign_in')}
              </li>
            )}
          </Link>

          {/* زر المنيو (الهامبرغر): يظهر في الموبايل والتابلت ويختفي فقط في الشاشات الكبيرة جداً lg */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className='lg:hidden text-slate-700 hover:text-blue-600 text-xl focus:outline-none transition-colors'
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

      </div>

      {/* --- القائمة المنسدلة للموبايل والتابلت (تفتح للشاشات أقل من lg) --- */}
      <div className={`lg:hidden fixed inset-x-0 top-[73px] bg-white border-b border-slate-200 p-6 transition-all duration-300 ease-in-out z-40 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
        <div className='flex flex-col gap-5'>
          
          {/* حقل البحث يظهر هنا للموبايل فقط ويختفي للتابلت لأن التابلت لديه حقل بحث بالخارج */}
          <form onSubmit={handelSubmit} className='md:hidden bg-slate-50 border border-slate-200 p-2.5 px-4 rounded-full flex items-center w-full'>
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              className='bg-transparent focus:outline-none w-full text-sm text-slate-700'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className='p-1'>
              <FaSearch className='text-slate-400 text-sm'/>
            </button>
          </form>

          {/* الروابط الداخلية للمنيو */}
          <ul className='flex flex-col gap-4 font-semibold text-base text-slate-700'>
            <Link to="/" onClick={() => setIsOpen(false)}>
              <li className='py-2 hover:text-blue-600 border-b border-slate-50 transition-colors'>
                {t('nav_home')}
              </li>
            </Link>
            <Link to="/about" onClick={() => setIsOpen(false)}>
              <li className='py-2 hover:text-blue-600 border-b border-slate-50 transition-colors'>
                {t('nav_about')}
              </li>
            </Link>
            
            {/* في حال عدم تسجيل الدخول بالموبايل الصغير، يظهر زر تسجيل الدخول هنا داخل المنيو */}
            {!currentUser && (
              <Link to="/profile" onClick={() => setIsOpen(false)} className="md:hidden">
                <li className='py-2 text-blue-600 font-bold'>
                  {t('sign_in')}
                </li>
              </Link>
            )}
          </ul>

          {/* زر تغيير اللغة داخل المنيو للتابلت والموبايل */}
          <div className='pt-2 border-t border-slate-100 flex justify-between items-center'>
            <span className='text-xs text-slate-400 font-medium'>Language / اللغة</span>
            <button 
              onClick={() => { toggleLanguage(); setIsOpen(false); }}
              className='px-4 py-2 border border-slate-200 rounded-full bg-slate-50 text-xs font-bold text-slate-700'
            >
              {i18n.language === 'ar' ? 'انجليزي' : 'Arabic'}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;