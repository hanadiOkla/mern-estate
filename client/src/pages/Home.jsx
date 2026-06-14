import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, EffectFade } from 'swiper/modules'; 
import { HiChevronLeft, HiChevronRight } from "react-icons/hi"; 
// 1. استيراد خطاف الترجمة من react-i18next
import { useTranslation } from "react-i18next"; 

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import ListingItem from '../components/ListingItem';
import '../index.css';

function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [swiperInitialized, setSwiperInitialized] = useState(false);

  // 2. تفعيل دالة الترجمة t ومعرفة الاتجاه الحالي (rtl أو ltr) من الـ i18n
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch("/api/listing/get?offer=true&limit=4");
        const data = await res.json();
        setOfferListings(data);
        fetchRentListings();
      } catch (error) {
        console.log(error);
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch("/api/listing/get?type=rent&limit=4");
        const data = await res.json();
        setRentListings(data);
        fetchSaleListings(); 
      } catch (error) {
        console.log(error);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch("/api/listing/get?type=sale&limit=4");
        const data = await res.json();
        setSaleListings(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOfferListings();
  }, []);

  return (
    <div className="bg-slate-50/50 min-h-screen">
      
      {/* Hero Section */}
      {/* تم استبدال الكلاسات الثابتة لتدعم المحاذاة الذكية حسب الاتجاه (sm:text-left و sm:text-right) */}
      <div className={`flex flex-col gap-6 py-24 px-6 max-w-6xl mx-auto text-center ${isRtl ? 'sm:text-right' : 'sm:text-left'}`}>
        <h1 className="text-slate-800 font-extrabold text-4xl lg:text-6xl tracking-tight leading-tight">
          {/* 3. ترجمة العناوين الرئيسية مع الحفاظ على التنسيقات والـ Span */}
          {t('home.hero_title_1')} <span className="text-blue-600 underline decoration-blue-200 decoration-wavy">{t('home.hero_perfect')}</span> <br /> {t('home.hero_title_2')}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          {t('home.hero_description')}
        </p>
        <div className="pt-2">
          <Link to={"/search"} className="text-sm bg-slate-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition-all shadow-md shadow-slate-900/10 hover:shadow-blue-600/20 inline-block">
            {t('home.lets_start')}
          </Link>
        </div>
      </div>

      {/* Swiper Slider CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-100 relative">
          
          <Swiper 
            modules={[Navigation, Autoplay, EffectFade]} 
            effect={'fade'}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            // 4. إعادة بناء الـ Swiper عند تغيير الاتجاه ليعمل التلاشي والسحب بشكل سليم
            key={i18n.language}
            dir={isRtl ? 'rtl' : 'ltr'}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            onInit={() => setSwiperInitialized(true)}
            className="mySwiper"
          >
            {offerListings && offerListings.length > 0 &&
              offerListings.map((listing) => (
                <SwiperSlide key={listing._id}>
                  <div 
                    style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.3)), url(${listing.imageUrls[0]}) center no-repeat`, backgroundSize: "cover" }} 
                    className="h-[400px] sm:h-[550px] w-full"
                  ></div>
                </SwiperSlide>
              ))
            }
          </Swiper>

          {/* 🏹 السهم المخصص لـ السابق: تم استبدال left-6 و right-6 بكلاسات الاتجاه المرنة start-6 و end-6 وقلب السهم في الـ RTL */}
          <button 
            ref={prevRef}
            className="absolute start-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/95 border border-slate-100 rounded-full flex items-center justify-center text-slate-800 shadow-md transition-all duration-300 pointer-events-auto disabled:opacity-40 hover:bg-white hover:text-blue-600 hover:scale-105"
          >
            <HiChevronLeft className="w-6 h-6 rtl:rotate-180" />
          </button>

          {/* 🏹 السهم المخصص لـ التالي */}
          <button 
            ref={nextRef}
            className="absolute end-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/95 border border-slate-100 rounded-full flex items-center justify-center text-slate-800 shadow-md transition-all duration-300 pointer-events-auto disabled:opacity-40 hover:bg-white hover:text-blue-600 hover:scale-105"
          >
            <HiChevronRight className="w-6 h-6 rtl:rotate-180" />
          </button>

        </div>
      </div>
      
      {/* Listings sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-16 pb-24">
        {offerListings && offerListings.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('home.recent_offers')}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{t('home.offers_subtitle')}</p>
              </div>
              <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors" to={'/search?offer=true'}>
                {t('home.see_all_offers')} <span className="inline-block rtl:rotate-180">&rarr;</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id}/>
              ))}
            </div>
          </div>
        )}

        {rentListings && rentListings.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('home.properties_rent')}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{t('home.rent_subtitle')}</p>
              </div>
              <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors" to={'/search?type=rent'}>
                {t('home.see_all_rentals')} <span className="inline-block rtl:rotate-180">&rarr;</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id}/>
              ))}
            </div>
          </div>
        )}

        {saleListings && saleListings.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('home.properties_sale')}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{t('home.sale_subtitle')}</p>
              </div>
              <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors" to={'/search?type=sale'}>
                {t('home.see_all_sale')} <span className="inline-block rtl:rotate-180">&rarr;</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;