import React from "react";
import { Link } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { FaBed, FaBath } from "react-icons/fa";
import { useTranslation } from "react-i18next"; // استيراد خطاف الترجمة

export default function ListingItem({ listing }) {
  const { t, i18n } = useTranslation();
  
  // تحديد السعر النشط بناءً على وجود خصم/عرض
  const activePrice = listing.offer ? listing.discountPrice : listing.regularPrice;

  return (
    // استخدام text-start يضمن محاذاة النصوص تلقائياً حسب اتجاه اللغة (يمين في RTL ويسار في LTR)
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col w-full group text-start">
      
      <Link to={`/listing/${listing._id}`} className="flex flex-col h-full">
        
        {/* حاوية الصورة مع دعم مرن لموقع الشارة (Badge) */}
        <div className="relative overflow-hidden aspect-[4/3] w-full bg-slate-100">
          <img
            src={listing.imageUrls?.[0] || 'https://media.istockphoto.com/id/1409298953/photo/real-estate-agents-shake-hands-after-the-signing-of-the-contract-agreement-is-complete.jpg?s=612x612&w=0&k=20&c=SFybbpGMB0wIoI0tJotFqptzAYK_mICVITNdQIXqnyc='}
            alt={listing.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          
          {/* استبدال left-3 بـ ltr:left-3 و rtl:right-3 لمنع تداخل الشارة عند تحول الاتجاه */}
          <span className={`absolute top-3 ltr:left-3 rtl:right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow-sm transition-all ${
            listing.type === 'rent' ? 'bg-blue-600' : 'bg-emerald-600'
          }`}>
            {listing.type === 'rent' ? t('listing.forRent', 'For Rent') : t('listing.forSale', 'For Sale')}
          </span>
        </div>

        {/* النصوص والمحتوى */}
        <div className="p-4 flex flex-col flex-grow gap-2.5">
          
          {/* السعر: تنسيق العملة عبر Intl لمنع انقلاب الرموز والأرقام في الـ RTL */}
          <p className="text-xl font-extrabold text-slate-950 flex items-baseline gap-1">
            <span>
              {new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              }).format(activePrice)}
            </span>
            {listing.type === 'rent' && (
              <span className="text-xs font-normal text-slate-500">
                {t('listing.perMonth', '/ month')}
              </span>
            )}
          </p>

          {/* العنوان */}
          <h3 className="truncate text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            {listing.name}
          </h3>

          {/* الموقع */}
          <div className="flex items-center gap-1 text-slate-400">
            <MdLocationOn className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-slate-500 truncate w-full font-medium">
              {listing.address}
            </p>
          </div>

          {/* الوصف */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* المميزات: دعم الجمع والمفرد الذكي عبر i18next */}
          <div className="text-slate-500 flex gap-4 mt-auto pt-3 border-t border-slate-100 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <FaBed className="text-slate-400 text-sm" />
              <span>
                {t('listing.bedroomsCount', { count: listing.bedrooms, defaultValue: `${listing.bedrooms} Beds` })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaBath className="text-slate-400 text-sm" />
              <span>
                {t('listing.bathroomsCount', { count: listing.bathrooms, defaultValue: `${listing.bathrooms} Baths` })}
              </span>
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}