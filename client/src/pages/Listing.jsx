import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useSelector } from 'react-redux';
import { Navigation } from 'swiper/modules';

import 'swiper/css';

import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import Contact from '../components/Contact';

export default function Listing() {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);
  
  // --- States for AI---
  const [valuation, setValuation] = useState(null);
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState(null);
  // --------------------------------------------------
  
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [swiperInstance, setSwiperInstance] = useState(null);

  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
        setError(false);
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId]);

  // 2. الأثر البيئي الجديد: استدعاء تقييم الـ AI بمجرد تحميل بيانات العقار بنجاح
  useEffect(() => {
    const fetchAIValuation = async () => {
      if (!listing) return; // لا نرسل طلب إذا لم تكن البيانات جاهزة بعد
      
      try {
        setValLoading(true);
        setValError(null);
        
        const res = await fetch('/api/listing/evaluate-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(listing), // تمرير بيانات العقار الحالية ليحللها الـ Backend
        });
        
        const data = await res.json();
        
        if (data.success === false) {
          setValError(data.message);
          setValLoading(false);
          return;
        }
        
        setValuation(data.valuation);
        setValLoading(false);
      } catch (err) {
        setValError(err.message);
        setValLoading(false);
      }
    };

    fetchAIValuation();
  }, [listing]);

  useEffect(() => {
    if (swiperInstance && swiperInstance.params) {
      swiperInstance.params.navigation.prevEl = prevRef.current;
      swiperInstance.params.navigation.nextEl = nextRef.current;
      swiperInstance.navigation.destroy();
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance, listing]);

  return (
    <main className="bg-slate-50 min-h-screen pb-12">
      {loading && <p className='text-center my-7 text-2xl text-slate-700 font-medium'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl text-red-600 font-medium'>Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          {/* حاوية السلايدر - تم تعديلها لتأخذ عرض الشاشة بالكامل وبدون حواف دائرية */}
          <div className="relative w-full group">
            
            <Swiper 
              modules={[Navigation]} 
              onSwiper={setSwiperInstance}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              className="mySwiper w-full shadow-sm"
            >
              {listing.imageUrls.map((url) => (
                <SwiperSlide key={url}>
                  <div
                    className='h-[350px] sm:h-[500px] md:h-[550px] w-full'
                    style={{
                      background: `url('${url}') center no-repeat`,
                      backgroundSize: 'cover',
                    }}
                  ></div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* سهم التنقل الأيسر المخصص */}
            <button 
              ref={prevRef}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-slate-50 text-slate-800 w-11 h-11 rounded-full flex justify-center items-center shadow-lg transition-all duration-200 hover:scale-105 border border-slate-100"
            >
              <FaChevronLeft className="text-base font-bold" />
            </button>

            {/* سهم التنقل الأيمن المخصص */}
            <button 
              ref={nextRef}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-slate-50 text-slate-800 w-11 h-11 rounded-full flex justify-center items-center shadow-lg transition-all duration-200 hover:scale-105 border border-slate-100"
            >
              <FaChevronRight className="text-base font-bold" />
            </button>

          </div>

          {/* زر المشاركة */}
          <div className='fixed top-[13%] right-[3%] z-10 border border-slate-200 rounded-full w-12 h-12 flex justify-center items-center bg-white shadow-md hover:shadow-lg transition-all cursor-pointer'>
            <FaShare
              className='text-slate-600 hover:text-blue-600 transition-colors'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            />
          </div>
          {copied && (
            <p className='fixed top-[21%] right-[3%] z-10 rounded-md bg-white border border-emerald-200 text-emerald-700 shadow-lg p-2 text-sm font-medium'>
              Link copied!
            </p>
          )}

          {/* صندوق تفاصيل العقار (يظل منسقاً ومنتصفاً في الشاشة) */}
          <div className='flex flex-col max-w-4xl mx-auto p-6 bg-white my-7 rounded-xl shadow-sm border border-slate-100 gap-5'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 mb-2'>
                {listing.name}
              </h1>
              <p className='text-2xl font-bold text-blue-600 flex items-center gap-1'>
                ${' '}
                {listing.offer
                  ? listing.discountPrice.toLocaleString('en-US')
                  : listing.regularPrice.toLocaleString('en-US')
                }
                {listing.type === 'rent' && <span className='text-sm text-slate-500 font-normal ml-1'>/ month</span>}
              </p>
            </div>

            <p className='flex items-center gap-2 text-slate-500 text-sm border-b border-slate-100 pb-4'>
              <FaMapMarkerAlt className='text-emerald-600 text-base' />
              {listing.address}
            </p>

            <div className='flex gap-3'>
              <p className='bg-slate-900 w-full max-w-[140px] text-white text-sm font-semibold text-center py-2 rounded-md shadow-sm uppercase tracking-wider'>
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
              {listing.offer && (
                <p className='bg-emerald-600 w-full max-w-[140px] text-white text-sm font-semibold text-center py-2 rounded-md shadow-sm uppercase tracking-wider'>
                  ${+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>

            <div className='text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100'>
              <h3 className='font-bold text-slate-900 mb-1'>Description</h3>
              <p className='text-sm text-slate-600'>{listing.description}</p>
            </div>

            {/* ========================================================================= */}
            {/* 🌟 إضافة لوحة التقييم العقاري بالذكاء الاصطناعي (AI Valuation Dashboard) 🌟 */}
            {/* ========================================================================= */}
            <div className='bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm my-2' dir="rtl">
              <div className='flex items-center gap-2 mb-4'>
                <span className='text-xl'>✨</span>
                <h3 className='text-lg font-bold text-slate-800 font-sans'>التحليل المالي والتقييم الذكي (AI Valuation)</h3>
              </div>

              {valLoading && (
                <p className='text-slate-500 animate-pulse text-xs text-right'>
                  جاري تحليل أسعار الحي وحساب القيمة السوقية العادلة للعقار...
                </p>
              )}
              
              {valError && (
                <p className='text-red-500 text-xs text-right'>
                  تعذر تحميل التقييم الذكي حالياً (تأكد من تفعيل السيرفر والرصيد).
                </p>
              )}

              {valuation && (
                <div className='flex flex-col gap-4 text-right'>
                  {/* نطاق السعر والبادج الذكي */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white p-4 rounded-lg border border-slate-100'>
                    <div>
                      <p className='text-xs text-slate-400 mb-1'>القيمة التقديرية العادلة في السوق:</p>
                      <p className='text-base font-bold text-slate-700 font-mono' dir="ltr">
                        ${valuation.estimatedMinPrice?.toLocaleString()} - ${valuation.estimatedMaxPrice?.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className='flex md:justify-end mt-2 md:mt-0'>
                      <span className={`px-3 py-1.5 rounded-full font-bold text-xs shadow-sm ${
                        valuation.priceStatus === 'Good Deal' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        valuation.priceStatus === 'Fair Price' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        valuation.priceStatus === 'Overpriced' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {valuation.priceStatus === 'Good Deal' && '🔥 صفقة لُقطة (أقل من سعر السوق)'}
                        {valuation.priceStatus === 'Fair Price' && '✅ سعر عادل ومتوافق مع السوق'}
                        {valuation.priceStatus === 'Overpriced' && '⚠️ سعر مرتفع عن متوسط المنطقة'}
                        {valuation.priceStatus === 'Unknown' && 'ℹ️ لا يوجد سعر معروض للمقارنة'}
                      </span>
                    </div>
                  </div>

                  {/* اتجاهات السوق والنصيحة الاستثمارية */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-white p-4 rounded-lg border border-slate-100'>
                      <h4 className='font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1'>📈 مستقبل الحي (3-5 سنوات):</h4>
                      <p className='text-slate-600 text-xs leading-relaxed'>{valuation.marketTrend}</p>
                    </div>
                    
                    <div className='bg-white p-4 rounded-lg border border-slate-100'>
                      <h4 className='font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1'>🎯 النصيحة الاستثمارية للمشتري:</h4>
                      <p className='text-slate-600 text-xs leading-relaxed'>{valuation.investmentAdvice}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* ========================================================================= */}

            <ul className='text-slate-700 font-medium text-sm flex flex-wrap items-center gap-4 sm:gap-6 border-t border-b border-slate-100 py-4'>
              <li className='flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100'>
                <FaBed className='text-lg text-slate-500' />
                <span>
                  {listing.bedrooms > 1 ? `${listing.bedrooms} Beds` : `${listing.bedrooms} Bed`}
                </span>
              </li>
              <li className='flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100'>
                <FaBath className='text-lg text-slate-500' />
                <span>
                  {listing.bathrooms > 1 ? `${listing.bathrooms} Baths` : `${listing.bathrooms} Bath`}
                </span>
              </li>
              <li className='flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100'>
                <FaParking className='text-lg text-slate-500' />
                <span>{listing.parking ? 'Parking Spot' : 'No Parking'}</span>
              </li>
              <li className='flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100'>
                <FaChair className='text-lg text-slate-500' />
                <span>{listing.furnished ? 'Furnished' : 'Unfurnished'}</span>
              </li>
            </ul>

            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <button
                onClick={() => setContact(true)}
                className='bg-blue-600 text-white font-semibold rounded-lg uppercase tracking-wide hover:bg-blue-700 shadow-md hover:shadow-lg transition-all p-3.5 text-center mt-2'
              >
                Contact landlord
              </button>
            )}
            {contact && <Contact listing={listing}/>}
          </div>
        </div>
      )}
    </main>
  );
}