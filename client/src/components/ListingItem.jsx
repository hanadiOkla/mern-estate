import React from "react";
import { Link } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { FaBed, FaBath } from "react-icons/fa"; // إضافة أيقونات مودرن للميزات

export default function ListingItem({ listing }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col w-full group">
      
      {/* تصحيح رابط الـ Link ليصبح مسار نظيف */}
      <Link to={`/listing/${listing._id}`} className="flex flex-col h-full">
        
        {/* حاوية الصورة: لمنع تمدد أو تشوه الأبعاد */}
        <div className="relative overflow-hidden aspect-[4/3] w-full bg-slate-100">
          <img
            src={listing.imageUrls?.[0] || 'https://media.istockphoto.com/id/1409298953/photo/real-estate-agents-shake-hands-after-the-signing-of-the-contract-agreement-is-complete.jpg?s=612x612&w=0&k=20&c=SFybbpGMB0wIoI0tJotFqptzAYK_mICVITNdQIXqnyc='}
            alt="listing cover"
            // تعديل: تأثير الزوم عند تمرير الماوس على الكارت بالكامل (باستخدام group-hover)
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          
          {/* شارة (Badge) نوع العقار: تضفي لمسة احترافية */}
          <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow-sm ${listing.type === 'rent' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
            For {listing.type}
          </span>
        </div>

        {/* النصوص والمحتوى */}
        <div className="p-4 flex flex-col flex-grow gap-2.5">
          
          {/* السعر: رفعه للأعلى يمنحه أهمية بصرية كعادة المواقع العالمية */}
          <p className="text-xl font-extrabold text-slate-950 flex items-baseline">
            ${listing.offer
              ? listing.discountPrice.toLocaleString("en-US")
              : listing.regularPrice.toLocaleString("en-US")}
            {listing.type === 'rent' && (
              <span className="text-xs font-normal text-slate-500 ml-1">/ month</span>
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

          {/* المميزات (المساحة، الغرف، الحمامات): تم استبدال النصوص الجامدة بأيقونات خفيفة وأنيقة */}
          <div className="text-slate-500 flex gap-4 mt-auto pt-3 border-t border-slate-100 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <FaBed className="text-slate-400 text-sm" />
              <span>{listing.bedrooms} {listing.bedrooms > 1 ? 'Beds' : 'Bed'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaBath className="text-slate-400 text-sm" />
              <span>{listing.bathrooms} {listing.bathrooms > 1 ? 'Baths' : 'Bath'}</span>
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}