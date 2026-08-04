import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDanger, isLoading }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');

  if (!isOpen) return null;

  return (
    <div 
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in'
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Modal Container */}
      <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all scale-100'>
        
        {/* Icon Header */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          isDanger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {isDanger ? (
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
            </svg>
          ) : (
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
            </svg>
          )}
        </div>

        {/* Content */}
        <h3 className='text-lg font-bold text-slate-800 mb-2'>
          {title || t('admin.confirm_title')}
        </h3>
        <p className='text-sm text-slate-600 mb-6 leading-relaxed'>
          {message}
        </p>

        {/* Actions */}
        <div className='flex items-center justify-end gap-3'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50'
          >
            {t('admin.cancel')}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {isLoading && (
              <span className='animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full' />
            )}
            {t('admin.confirm_action')}
          </button>
        </div>

      </div>
    </div>
  );
}