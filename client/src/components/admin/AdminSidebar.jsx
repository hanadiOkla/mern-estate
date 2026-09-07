import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminSidebar({ activeTab, setActiveTab, pendingCount }) {
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');

  // مصفوفة الأقسام المتكاملة
  const menuGroups = [
    {
      groupTitle: isRtl ? 'إدارة المنصة' : 'Management',
      items: [
        {
          id: 'listings',
          label: t('admin.pending_listings_tab'),
          badge: pendingCount,
          icon: (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
            </svg>
          ),
        },
        {
          id: 'categories',
          label: isRtl ? 'إدارة الفئات' : 'Categories',
          icon: (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 10h16M4 14h16M4 18h16' />
            </svg>
          ),
        },
        {
          id: 'users',
          label: t('admin.users_tab'),
          icon: (
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
            </svg>
          ),
        },
      ],
    },
  ];

  const activeItem = menuGroups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeTab);

  // إغلاق المنسدلة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tabId) => {
    setActiveTab(tabId);
    setIsDropdownOpen(false);
  };

  return (
    <>
      {/* 📱 1. للموبايل */}
      <div className='md:hidden mb-6 relative' ref={dropdownRef}>
        <div className='bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm flex items-center justify-between'>
          <div className='flex items-center gap-2 text-xs font-bold text-slate-400'>
            <span className='bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[11px] font-extrabold'>
              Admin
            </span>
            <span>/</span>
            <span className='text-slate-800 font-bold flex items-center gap-1.5'>
              {activeItem?.label}
              {activeItem?.badge > 0 && (
                <span className='bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black'>
                  {activeItem.badge}
                </span>
              )}
            </span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className='flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer'
          >
            <span>{isRtl ? 'الأقسام' : 'Sections'}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M19 9l-7 7-7-7' />
            </svg>
          </button>
        </div>

        {isDropdownOpen && (
          <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xl z-30 animate-fade-in'>
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className='flex flex-col gap-1'>
                <span className='text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1'>
                  {group.groupTitle}
                </span>

                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className='flex items-center gap-2.5'>
                        {item.icon}
                        <span>{item.label}</span>
                      </div>

                      {item.badge > 0 && (
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                            isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🖥️ 2. للشاشات الكبيرة */}
      <aside className='hidden md:block w-64 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm shrink-0 h-fit sticky top-24'>
        <div className='flex items-center gap-3 pb-4 mb-5 border-b border-slate-100'>
          <div className='w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20'>
            A
          </div>
          <div>
            <h2 className='font-bold text-slate-800 text-base'>Admin Control</h2>
            <p className='text-xs text-slate-400 font-medium'>
              {isRtl ? 'لوحة إدارة المنصة' : 'Control Center'}
            </p>
          </div>
        </div>

        <nav className='flex flex-col gap-5'>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className='flex flex-col gap-1.5'>
              <span className='text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1'>
                {group.groupTitle}
              </span>

              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>

                    {item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                          isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}