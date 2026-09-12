import { useEffect, useState, useRef } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import apiClient from "../api/apiClient";
import DynamicAttributes from "../components/listing/DynamicAttributes";
import CategorySelect from "../components/category/CategorySelect";

export default function UpdateListing() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language?.startsWith("ar") ? "ar" : "en";
  const isRtl = currentLang === "ar";

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "sale",
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    category: "",
    attributesMap: {},
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [valLoading, setValLoading] = useState(false);
  const [valuation, setValuation] = useState(null);

  // Confirmation Modal State
  const [showModal, setShowModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get("/api/categories");
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Listing Data
  useEffect(() => {
    let isMounted = true;

    const fetchListing = async () => {
      try {
        setPageLoading(true);
        const listingId = params.listingId;

        if (!listingId) {
          toast.error(isRtl ? "معرف العقار غير موجود" : "Listing ID missing");
          return;
        }

        const { data } = await apiClient.get(`/api/listing/get/${listingId}`);

        if (data.success === false) {
          toast.error(data?.message || t("fetch_error"));
          return;
        }

        if (isMounted) {
          setFormData({
            ...data,
            category: data.category?._id || data.category || "",
            attributesMap: data.attributesMap || {},
          });

          // ضبط الفئة المحددة عند تحميل البيانات
          if (data.category && categories.length > 0) {
            const catId = data.category?._id || data.category;
            const catObj = categories.find((c) => c._id === catId);
            setSelectedCategory(catObj || null);
          }
        }
      } catch (err) {
        toast.error(
          !navigator.onLine
            ? (isRtl ? "أنت غير متصل بالإنترنت حالياً 📡" : "You are offline 📡")
            : err.response?.data?.message || err.message || t("fetch_error")
        );
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    fetchListing();

    return () => {
      isMounted = false;
    };
  }, [params.listingId, categories.length, t, isRtl]);

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const catObj = categories.find((c) => c._id === catId);
    setSelectedCategory(catObj || null);
    setFormData((prev) => ({
      ...prev,
      category: catId,
      attributesMap: {}, // تفريغ الخصائص السابقة عند تغيير الفئة
    }));
  };

  const isRealEstate = Boolean(
    selectedCategory &&
      (selectedCategory.slug === "real-estate" ||
        selectedCategory.slug === "realestate" ||
        selectedCategory.name?.en?.toLowerCase() === "real estate" ||
        selectedCategory.name?.ar === "عقارات" ||
        selectedCategory.name?.ar === "عقار")
  );

  const handleImageSubmit = () => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      const toastId = toast.loading(t("btn_uploading"));
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.concat(urls),
          }));
          setUploading(false);
          setFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast.success(isRtl ? "تم رفع الصور بنجاح!" : "Images uploaded successfully!", { id: toastId });
        })
        .catch(() => {
          toast.error(isRtl ? "فشل رفع الصور (2 ميجابايت أقصى حد لكل صورة)" : "Upload failed (2MB max per image)", { id: toastId });
          setUploading(false);
        });
    } else {
      toast.error(isRtl ? "يمكنك رفع 6 صور كحد أقصى لكل إعلان" : "You can upload up to 6 images max");
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => reject(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const triggerDeleteModal = (index) => {
    setImageToDelete(index);
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    if (imageToDelete !== null) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== imageToDelete),
      }));
      setShowModal(false);
      setImageToDelete(null);
      toast.success(isRtl ? "تم حذف الصورة بنجاح" : "Image deleted successfully");
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.name?.trim() || !formData.address?.trim()) {
      toast.error(t("ai_error_fields"));
      return;
    }

    const toastId = toast.loading(t("btn_generating_ai"));
    try {
      setAiLoading(true);

      const { data } = await apiClient.post("/api/listing/generate-ai", formData);
      if (data.success === false) {
        throw new Error(data.message || t("ai_error_fields"));
      }

      setFormData((prev) => ({
        ...prev,
        description: data.description,
      }));
      toast.success(isRtl ? "تم توليد الوصف بنجاح! ✨" : "Description generated! ✨", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIValuation = async () => {
    if (!formData.name?.trim() || !formData.address?.trim() || !formData.category) {
      toast.error(isRtl ? "⚠️ يرجى ملء كافة المعلومات المطلوبة للتأكد من التقييم." : "Please fill required fields first.");
      return;
    }

    const toastId = toast.loading(t("btn_ai_evaluating"));
    try {
      setValLoading(true);

      const { data } = await apiClient.post("/api/listing/evaluate-ai", formData);
      if (data.success === false) {
        throw new Error(data.message || t("ai_val_connection_error"));
      }

      setValuation(data.valuation);
      toast.success(isRtl ? "تم حساب التقييم بنجاح!" : "Valuation calculated!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    } finally {
      setValLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;

    if (id === "sale" || id === "rent") {
      setFormData((prev) => ({ ...prev, type: id }));
      return;
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [id]: checked }));
      return;
    }

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [id]: value === "" ? "" : Number(value),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) {
        toast.error(t("err_min_image"));
        return;
      }
      if (formData.offer && +formData.regularPrice < +formData.discountPrice) {
        toast.error(t("err_price_validation"));
        return;
      }

      setLoading(true);
      const toastId = toast.loading(t("btn_publishing_listing"));

      const { data } = await apiClient.post(`/api/listing/update/${params.listingId}`, {
        ...formData,
        userRef: currentUser._id,
      });
      setLoading(false);

      if (data.success === false) {
        toast.error(data.message, { id: toastId });
        return;
      }

      toast.success(isRtl ? "تم تحديث الإعلان بنجاح!" : "Listing updated successfully!", { id: toastId });
      navigate(`/listing/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="bg-slate-50/50 min-h-screen py-10 px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 animate-pulse">
          <div className="flex flex-col items-center mb-8 gap-3">
            <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
            <div className="h-8 w-64 bg-slate-200 rounded-xl"></div>
            <div className="h-4 w-48 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-slate-100 p-6 rounded-3xl flex flex-col gap-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
                <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
                <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
                <div className="h-28 w-full bg-slate-200 rounded-xl"></div>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-slate-100 p-6 rounded-3xl flex flex-col gap-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
                <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
                <div className="h-32 w-full bg-slate-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 px-4 md:px-8">
      <Toaster position={isRtl ? "bottom-left" : "bottom-right"} toastOptions={{ duration: 4000 }} />

      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRtl ? "تعديل الإعلان" : "Update Listing"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isRtl ? "تعديل بيانات وإعدادات الإعلان الحالي" : "Edit your current listing details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* الجانب الأيمن */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t("property_info")}
            </h2>

            {/* اختيار الفئة */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wide">
                {currentLang === "ar" ? "التصنيف" : "Category"}
              </label>
              <CategorySelect
                id="category"
                categories={categories}
                value={formData.category}
                onChange={handleCategoryChange}
                required
                placeholder={
                  currentLang === "ar" ? "-- اختر التصنيف --" : "-- Select Category --"
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wide">
                {t("property_title_label")}
              </label>
              <input
                type="text"
                placeholder={t("property_title_placeholder")}
                className="border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20"
                id="name"
                maxLength="62"
                minLength="10"
                required
                onChange={handleChange}
                value={formData.name}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 tracking-wide">
                  {t("description_label")}
                </label>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAIDescription}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold uppercase hover:opacity-95 disabled:opacity-80 flex items-center gap-2 shadow-sm transition"
                >
                  {aiLoading ? t("btn_generating_ai") : t("btn_generate_ai")}
                </button>
              </div>
              <textarea
                placeholder={t("description_placeholder")}
                className="border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20 min-h-[120px]"
                id="description"
                required
                onChange={handleChange}
                value={formData.description}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wide">
                {t("address_label")}
              </label>
              <input
                type="text"
                placeholder={t("address_placeholder")}
                className="border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20"
                id="address"
                required
                onChange={handleChange}
                value={formData.address}
              />
            </div>

            {/* الخصائص الديناميكية للفئة */}
            {selectedCategory && (
              <DynamicAttributes
                mode="form"
                attributes={selectedCategory.attributes}
                formData={formData}
                setFormData={setFormData}
              />
            )}

            {/* الخيارات والميزات */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                {currentLang === "ar" ? "الميزات والخيارات" : "Options & Features"}
              </p>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="sale"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.type === "sale"}
                  />
                  <span className="text-sm font-medium text-slate-700">{t("opt_sell")}</span>
                </label>

                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="rent"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.type === "rent"}
                  />
                  <span className="text-sm font-medium text-slate-700">{t("opt_rent")}</span>
                </label>

                {isRealEstate && (
                  <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                    <input
                      type="checkbox"
                      id="parking"
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      onChange={handleChange}
                      checked={formData.parking}
                    />
                    <span className="text-sm font-medium text-slate-700">{t("opt_parking")}</span>
                  </label>
                )}

                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="offer"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.offer}
                  />
                  <span className="text-sm font-medium text-slate-700">{t("opt_offer")}</span>
                </label>
              </div>
            </div>

            {/* الأسعار */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">
                  {t("lbl_regular_price")}{" "}
                  {formData.type === "rent" && (
                    <span className="text-slate-400 font-normal">({t("mo")})</span>
                  )}
                </label>
                <input
                  type="number"
                  id="regularPrice"
                  min="1"
                  max="10000000"
                  required
                  className="p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700"
                  onChange={handleChange}
                  value={formData.regularPrice}
                />
              </div>

              {formData.offer && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-rose-600">
                    {t("lbl_discount_price")}{" "}
                    {formData.type === "rent" && (
                      <span className="text-rose-400 font-normal">({t("mo")})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="discountPrice"
                    min="0"
                    max="10000000"
                    required
                    className="p-3 border border-rose-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 bg-rose-50/10 text-center font-bold text-rose-600 ring-1 ring-rose-100"
                    onChange={handleChange}
                    value={formData.discountPrice}
                  />
                </div>
              )}
            </div>

            {/* الذكاء الاصطناعي للتقييم */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <h3 className="text-sm font-bold text-slate-800">
                    {isRtl ? "التقييم بواسطة الذكاء الاصطناعي" : "AI Valuation"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAIValuation}
                  disabled={valLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl text-xs px-4 py-2.5 hover:opacity-95 shadow-sm transition-all disabled:opacity-50"
                >
                  {valLoading ? t("btn_ai_evaluating") : t("btn_ai_evaluate")}
                </button>
              </div>

              {valuation && (
                <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-100 mt-4 animate-fadeIn">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">{t("ai_val_result_lbl")}</p>
                    <p className="text-lg font-bold text-emerald-600 font-mono" dir="ltr">
                      ${valuation.estimatedMinPrice?.toLocaleString()} - $
                      {valuation.estimatedMaxPrice?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {t("ai_val_disclaimer")}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-700 text-xs mb-1">
                        {isRtl ? "اتجاهات السوق" : "Market Trends"}
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {typeof valuation.marketTrend === "object"
                          ? valuation.marketTrend[currentLang] || valuation.marketTrend["ar"]
                          : valuation.marketTrend}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-700 text-xs mb-1">
                        {isRtl ? "نصيحة الاستثمار" : "Investment Advice"}
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {typeof valuation.investmentAdvice === "object"
                          ? valuation.investmentAdvice[currentLang] || valuation.investmentAdvice["ar"]
                          : valuation.investmentAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الجانب الأيسر: الصور */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t("media_gallery")}
              </h2>

              <div>
                <p className="text-xs font-bold text-slate-700 tracking-wide mb-1">
                  {t("upload_images_lbl")}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  {t("upload_images_hint")}
                </p>

                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    onChange={(e) => setFiles(e.target.files)}
                    className="p-2.5 border border-slate-200 rounded-xl w-full text-xs text-slate-500 bg-slate-50/50 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleImageSubmit}
                    className="px-4 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-xl uppercase hover:bg-emerald-50 disabled:opacity-70 transition-all shrink-0 cursor-pointer"
                  >
                    {uploading ? t("btn_uploading") : t("btn_upload")}
                  </button>
                </div>
              </div>

              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 max-h-[280px] overflow-y-auto">
                  {formData.imageUrls.map((url, index) => (
                    <div key={`${url}_${index}`} className="flex justify-between p-2.5 bg-white border border-slate-100 items-center rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 truncate">
                        <img src={url} alt="listing" className="w-14 h-14 object-cover rounded-lg border border-slate-100" />
                        <span className="text-xs font-medium text-slate-500">
                          {index === 0 ? t("lbl_cover") : `${t("lbl_image")} ${index + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerDeleteModal(index)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all uppercase cursor-pointer"
                      >
                        {t("btn_delete")}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-blue-600/10 disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (isRtl ? "جاري التحديث..." : "Updating...") : (isRtl ? "تحديث الإعلان" : "Update Listing")}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* مودال تأكيد الحذف */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 text-center">
              <h3 className="text-md font-bold text-slate-800 uppercase tracking-wider">
                {isRtl ? "حذف الصورة" : "Delete Image"}
              </h3>
            </div>
            <div className="p-6 text-center flex flex-col gap-2">
              <p className="text-slate-700 font-semibold text-base">
                {isRtl ? "هل أنت تأكد من رغبتك في حذف هذه الصورة؟" : "Are you sure you want to delete this image?"}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-slate-50 border-t border-slate-100 justify-center">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-300 transition-colors"
              >
                ✕ {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors"
              >
                🗑️ {isRtl ? "تأكيد الحذف" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}