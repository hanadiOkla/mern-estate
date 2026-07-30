import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div 
      className={`fixed top-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
        isRtl ? 'right-5' : 'left-5'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md min-w-[220px] max-w-md ${
          isSuccess
            ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-900/20'
            : 'bg-rose-500 text-white border-rose-400 shadow-rose-900/20'
        }`}
      >
        {/* الأيقونة الرئيسية */}
        {isSuccess ? (
          <FaCheckCircle className="text-lg shrink-0 text-white" />
        ) : (
          <FaExclamationCircle className="text-lg shrink-0 text-white" />
        )}

        {/* النص - إعطائه flex-1 يضمن ظهوره واستغلال المساحة المتاحة */}
        <span className="text-sm font-semibold flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {message}
        </span>

        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          type="button"
          className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>
    </div>
  );
}

export default Toast;