import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, EffectFade } from 'swiper/modules'; 
import { HiChevronLeft, HiChevronRight } from "react-icons/hi"; // أيقونات ناعمة ونحيفة

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import ListingItem from '../components/ListingItem';
import '../index.css';

function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  
  // Refs للتحكم بالأسهم المخصصة
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  // حالة للتأكد من ربط الأسهم بالـ Swiper
  const [swiperInitialized, setSwiperInitialized] = useState(false);

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
      <div className="flex flex-col gap-6 py-24 px-6 max-w-6xl mx-auto text-center sm:text-left">
        <h1 className="text-slate-800 font-extrabold text-4xl lg:text-6xl tracking-tight leading-tight">
          Find your next <span className="text-blue-600 underline decoration-blue-200 decoration-wavy">perfect</span> <br /> place with ease
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          Sahand Estate is the best place to find your next perfect place to live.
          We have a wide range of properties for you to choose from.
        </p>
        <div className="pt-2">
          <Link to={"/search"} className="text-sm bg-slate-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-600 transition-all shadow-md shadow-slate-900/10 hover:shadow-blue-600/20 inline-block">
            Let's Start Now
          </Link>
        </div>
      </div>

      {/* Swiper Slider CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        {/* أزلنا كلاس group لأننا سنظهر الأسهم دائماً */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-100 relative">
          
          <Swiper 
            modules={[Navigation, Autoplay, EffectFade]} 
            effect={'fade'}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            // ربط الأسهم المخصصة
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            onInit={() => setSwiperInitialized(true)} // تفعيل الأسهم فوراً
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

          {/* 🏹 السهم الأيسر: ظاهر دائماً، بحجم متناسق Pixel-Perfect، وتفاعل Hover سلس ومضمون */}
          <button 
            ref={prevRef}
            // التعديل الرئيسي: أزلنا opacity-0 و scale-90، وثبتنا الظهور.
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/95 border border-slate-100 rounded-full flex items-center justify-center text-slate-800 shadow-md transition-all duration-300 pointer-events-auto disabled:opacity-40 hover:bg-white hover:text-blue-600 hover:scale-105"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>

          {/* 🏹 السهم الأيمن: ظاهر دائماً */}
          <button 
            ref={nextRef}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/95 border border-slate-100 rounded-full flex items-center justify-center text-slate-800 shadow-md transition-all duration-300 pointer-events-auto disabled:opacity-40 hover:bg-white hover:text-blue-600 hover:scale-105"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>

        </div>
      </div>
      
      {/* Listings sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-16 pb-24">
        {offerListings && offerListings.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Recent Offers</h2>
                <p className="text-sm text-slate-400 mt-0.5">Explore our latest deals and discounts</p>
              </div>
              <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors" to={'/search?offer=true'}>
                See all offers &rarr;
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
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Properties for Rent</h2>
                <p className="text-sm text-slate-400 mt-0.5">Find a cozy place to rent today</p>
              </div>
              <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors" to={'/search?type=rent'}>
                See all rentals &rarr;
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
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Properties for Sale</h2>
                <p className="text-sm text-slate-400 mt-0.5">Invest in your permanent dream home</p>
              </div>
              <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors" to={'/search?type=sale'}>
                See all for sale &rarr;
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