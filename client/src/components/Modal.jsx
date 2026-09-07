import React, { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}) {
  // إغلاق المودال عند الضغط على زر Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // منع التمرير الخلفي
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity'>
      {/* خلفية قابلة للنقر للإغلاق */}
      <div 
        className='fixed inset-0' 
        onClick={onClose} 
      />

      {/* كرت المودال */}
      <div className={`relative bg-white rounded-2xl w-full ${maxWidth} shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150`}>
        
        {/* الهيدر (العنوان وزر الإغلاق) */}
        {title && (
          <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50'>
            <h3 className='font-bold text-slate-800 text-base'>{title}</h3>
            <button
              onClick={onClose}
              className='text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer'
            >
              ✕
            </button>
          </div>
        )}

        {/* محتوى المودال المتغير */}
        <div className='p-6'>
          {children}
        </div>
      </div>
    </div>
  );
}