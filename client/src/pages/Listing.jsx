import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { useSelector } from "react-redux";
import { Navigation, Autoplay } from "swiper/modules";
import { useTranslation } from "react-i18next";

// 1️⃣ استيراد رابط الـ API المركزي والنظيف
import { API_BASE_URL } from "../config";

import "swiper/css";
import "swiper/css/navigation";

import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
} from "react-icons/fa";
import Contact from "../components/Contact";

export default function Listing() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);

  // --- States for AI Valuation ---
  const [valuation, setValuation] = useState(null);
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState(null);

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/listing/get/${params.listingId}`, {
          method: 'GET',
          credentials: 'include',
        });
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

  // جلب التقييم المالي عند استقرار بيانات العقار والمستخدم
  useEffect(() => {
    const fetchAIValuation = async () => {
      if (!listing || !currentUser) return;

      try {
        setValLoading(true);
        setValError(null);

        const res = await fetch(`${API_BASE_URL}/api/listing/evaluate-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listing),
          credentials: "include",
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
        setValError(t("listing.ai_val_conn_error"));
        setValLoading(false);
      }
    };

    fetchAIValuation();
  }, [listing, currentUser, t]);

  return (
    <main className="bg-slate-50 min-h-screen pb-12" dir={isRtl ? "rtl" : "ltr"}>
      {loading && (
        <p className="text-center my-7 text-2xl text-slate-700 font-medium">
          {t("listing.ai_val_loading")}
        </p>
      )}
      {error && (
        <p className="text-center my-7 text-2xl text-red-600 font-medium">
          {t("listing.ai_val_conn_error")}
        </p>
      )}
      {listing && !loading && !error && (
        <div>
          {/* حاوية السلايدر */}
          <div className="relative w-full group">
            {/* أزرار التنقل المخصصة بالسلايدر - يجب أن تُركّب قبل Swiper حتى تكون الـ refs جاهزة عند تهيئته */}
            <button
              ref={prevRef}
              aria-label="Previous Slide"
              className="absolute start-4 sm:start-8 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-slate-50 text-slate-800 w-11 h-11 rounded-full flex justify-center items-center shadow-lg transition-all duration-200 hover:scale-105 border border-slate-100 disabled:opacity-40"
            >
              <FaChevronLeft className="text-base font-bold rtl:rotate-180" />
            </button>

            <button
              ref={nextRef}
              aria-label="Next Slide"
              className="absolute end-4 sm:end-8 top-1/2 -translate-y-1/2 z-30 bg-white hover:bg-slate-50 text-slate-800 w-11 h-11 rounded-full flex justify-center items-center shadow-lg transition-all duration-200 hover:scale-105 border border-slate-100 disabled:opacity-40"
            >
              <FaChevronRight className="text-base font-bold rtl:rotate-180" />
            </button>

            <Swiper
              modules={[Navigation, Autoplay]}
              key={i18n.language}
              dir={isRtl ? "rtl" : "ltr"}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              onInit={(swiper) => {
                swiper.navigation.init();
                swiper.navigation.update();
              }}
              className="mySwiper w-full shadow-sm"
            >
              {listing.imageUrls?.map((url) => (
                <SwiperSlide key={url}>
                  <div
                    className="h-[350px] sm:h-[500px] md:h-[550px] w-full"
                    style={{
                      background: `url('${url}') center no-repeat`,
                      backgroundSize: "cover",
                    }}
                  ></div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* زر المشاركة */}
          <div className="fixed top-[13%] start-[3%] z-10 border border-slate-200 rounded-full w-12 h-12 flex justify-center items-center bg-white shadow-md hover:shadow-lg transition-all cursor-pointer">
            <FaShare
              className="text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
          </div>
          {copied && (
            <p className="fixed top-[21%] start-[3%] z-10 rounded-md bg-white border border-emerald-200 text-emerald-700 shadow-lg p-2 text-sm font-medium">
              {t("listing.link_copied")}
            </p>
          )}

          {/* صندوق تفاصيل العقار */}
          <div className="flex flex-col max-w-4xl mx-auto p-6 bg-white my-7 rounded-xl shadow-sm border border-slate-100 gap-5">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {listing.name}
              </h1>
              <p className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                <span dir="ltr">
                  $ {listing.offer ? listing.discountPrice.toLocaleString("en-US") : listing.regularPrice.toLocaleString("en-US")}
                </span>
                {listing.type === "rent" && (
                  <span className="text-sm text-slate-500 font-normal mx-1">
                    {t("listing.perMonth")}
                  </span>
                )}
              </p>
            </div>

            <p className="flex items-center gap-2 text-slate-500 text-sm border-b border-slate-100 pb-4">
              <FaMapMarkerAlt className="text-emerald-600 text-base" />
              {listing.address}
            </p>

            <div className="flex gap-3">
              <p className="bg-slate-900 w-full max-w-[140px] text-white text-sm font-semibold text-center py-2 rounded-md shadow-sm uppercase tracking-wider">
                {listing.type === "rent" ? t("listing.forRent") : t("listing.forSale")}
              </p>
              {listing.offer && (
                <p className="bg-emerald-600 w-full max-w-[140px] text-white text-sm font-semibold text-center py-2 rounded-md shadow-sm uppercase tracking-wider" dir="ltr">
                  ${+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>

            {/* 🛡️ شارة توثيق المشرف المعتمد */}
            {listing.approvedBy && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 my-1 flex items-center gap-3 text-xs sm:text-sm shadow-sm">
                <img 
                  src={listing.approvedBy.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                  alt={listing.approvedBy.username} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <FaCheckCircle className="text-emerald-600 text-base" />
                    <span>{t("admin.approved_by_label")} {listing.approvedBy.username}</span>
                  </div>
                  {listing.approvedAt && (
                    <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                      {t("admin.approved_at_label")}{" "}
                      {new Date(listing.approvedAt).toLocaleDateString(
                        isRtl ? "ar-SA" : "en-US",
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">{t("listing.label_desc")}</h3>
              <p className="text-sm text-slate-600">{listing.description}</p>
            </div>

            {/* لوحة التقييم العقاري بالذكاء الاصطناعي */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm my-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">✨</span>
                <h3 className="text-sm font-bold text-slate-800">
                  {t("listing.ai_val_box_title")}
                </h3>
              </div>

              {!currentUser ? (
                <div className="text-center p-5 bg-white rounded-lg border border-dashed border-slate-300 shadow-sm">
                  <p className="text-amber-600 font-bold text-sm flex items-center justify-center gap-1 mb-1">
                    🔒 {t("listing.premium_feature")}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("listing.premium_desc")}
                  </p>
                  <Link
                    to="/sign-in"
                    className="inline-block mt-3 bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg text-xs hover:bg-blue-700 shadow-sm transition-all"
                  >
                    {t("listing.sign_in_now")}
                  </Link>
                </div>
              ) : (
                <>
                  {valLoading && (
                    <p className="text-slate-500 animate-pulse text-xs">
                      {t("listing.ai_val_loading")}
                    </p>
                  )}

                  {valError && (
                    <p className="text-red-500 text-xs">
                      {valError}
                    </p>
                  )}

                  {valuation && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white p-4 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            {t("listing.ai_val_est_title")}
                          </p>
                          <p className="text-base font-bold text-slate-700 font-mono" dir="ltr">
                            ${valuation.estimatedMinPrice?.toLocaleString()} - ${valuation.estimatedMaxPrice?.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            {t("listing.ai_val_disclaimer")}
                          </p>
                        </div>

                        <div className="flex mt-2 md:mt-0 md:justify-end">
                          <span className="px-3 py-1.5 rounded-full font-bold text-xs shadow-sm bg-blue-100 text-blue-800 border border-blue-200">
                            {t("listing.ai_val_status_label")} {valuation.priceStatus || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-100">
                          <h4 className="font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1">
                            {t("listing.ai_val_trends_title")}
                          </h4>
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {typeof valuation.marketTrend === "object"
                              ? valuation.marketTrend[i18n.language] || valuation.marketTrend["ar"]
                              : valuation.marketTrend}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-100">
                          <h4 className="font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1">
                            {t("listing.ai_val_advice_title")}
                          </h4>
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {typeof valuation.investmentAdvice === "object"
                              ? valuation.investmentAdvice[i18n.language] || valuation.investmentAdvice["ar"]
                              : valuation.investmentAdvice}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* تفاصيل المواصفات */}
            <ul className="text-slate-700 font-medium text-sm flex flex-wrap items-center gap-4 sm:gap-6 border-t border-b border-slate-100 py-4">
              <li className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                <FaBed className="text-lg text-slate-500" />
                <span>
                  {t("listing.bedroomsCount", { count: listing.bedrooms })}
                </span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                <FaBath className="text-lg text-slate-500" />
                <span>
                  {t("listing.bathroomsCount", { count: listing.bathrooms })}
                </span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                <FaParking className="text-lg text-slate-500" />
                <span>{listing.parking ? t("listing.opt_parking") : t("listing.opt_parking") + " ❌"}</span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                <FaChair className="text-lg text-slate-500" />
                <span>{listing.furnished ? t("listing.opt_furnished") : t("listing.opt_furnished") + " ❌"}</span>
              </li>
            </ul>

            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <button
                onClick={() => setContact(true)}
                className={`bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all p-3.5 text-center mt-2 ${
                  i18n.language === "en" ? "uppercase tracking-wide" : ""
                }`}
              >
                {t("listing.contactBtn")}
              </button>
            )}
            {contact && <Contact listing={listing} />}
          </div>
        </div>
      )}
    </main>
  );
}