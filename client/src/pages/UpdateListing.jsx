import { useEffect, useState } from "react";
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

// ----------------------------------------------------------------------
// Skeleton Loader Component (يظهر أثناء جلب البيانات الأولية)
// ----------------------------------------------------------------------
const ListingFormSkeleton = ({ isRtl }) => (
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
          <div className="bg-slate-100 p-6 rounded-3xl flex flex-col gap-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-100 p-6 rounded-3xl flex flex-col gap-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
            <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
            <div className="h-32 w-full bg-slate-200 rounded-2xl"></div>
            <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function UpdateListing() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();

  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI Description Generation State
  const [aiLoading, setAiLoading] = useState(false);

  // AI Valuation States
  const [valLoading, setValLoading] = useState(false);
  const [valuation, setValuation] = useState(null);

  // Confirmation Modal State
  const [showModal, setShowModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // Fetch Listing Data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setPageLoading(true);
        const listingId = params.listingId;
        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();
        if (data.success === false) {
          toast.error(data.message || t("listing.fetch_error"));
          return;
        }
        setFormData(data);
      } catch (err) {
        toast.error(err.message || t("listing.fetch_error"));
      } finally {
        setPageLoading(false);
      }
    };

    fetchListing();
  }, [params.listingId, t]);

  const handleImageSubmit = () => {
    if (files.length > 0 && files.length + formData.imageUrls.length <= 6) {
      setUploading(true);
      const toastId = toast.loading(t("listing.media_uploading_btn"));
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
          toast.success(t("listing.images_upload_success") || "تم رفع الصور بنجاح!", {
            id: toastId,
          });
        })
        .catch(() => {
          toast.error(t("listing.media_err_max_size"), { id: toastId });
          setUploading(false);
        });
    } else {
      toast.error(t("listing.media_err_max_count"));
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
        (error) => {
          reject(error);
        },
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
      toast.success(t("listing.image_deleted_success") || "تم حذف الصورة بنجاح");
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.name || !formData.address) {
      toast.error(t("listing.ai_desc_err_missing"));
      return;
    }

    const toastId = toast.loading(t("listing.ai_desc_loading"));
    try {
      setAiLoading(true);

      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          type: formData.type,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          parking: formData.parking,
          furnished: formData.furnished,
          offer: formData.offer,
          regularPrice: formData.regularPrice,
          discountPrice: formData.discountPrice,
          language: i18n.language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t("listing.ai_desc_err_failed"));
      }

      setFormData((prev) => ({
        ...prev,
        description: data.description,
      }));
      toast.success(t("listing.ai_desc_success") || "تم توليد الوصف بالذكاء الاصطناعي! ✨", {
        id: toastId,
      });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIValuation = async () => {
    if (!formData.address) {
      toast.error(t("listing.ai_val_err_missing_address"));
      return;
    }

    const toastId = toast.loading(t("listing.ai_val_loading"));
    try {
      setValLoading(true);

      const res = await fetch("/api/ai/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formData.address,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          type: formData.type,
          regularPrice: formData.regularPrice,
          furnished: formData.furnished,
          parking: formData.parking,
          language: i18n.language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t("listing.ai_val_err_failed"));
      }

      setValuation(data.valuation);
      toast.success(t("listing.ai_val_success") || "تم حساب التقييم العقاري بنجاح!", {
        id: toastId,
      });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setValLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;

    if (id === "sale" || id === "rent") {
      setFormData((prev) => ({
        ...prev,
        type: id,
      }));
      return;
    }

    if (id === "parking" || id === "furnished" || id === "offer") {
      setFormData((prev) => ({
        ...prev,
        [id]: checked,
      }));
      return;
    }

    if (type === "number" || type === "text" || type === "textarea") {
      setFormData((prev) => ({
        ...prev,
        [id]: type === "number" ? (value === "" ? "" : +value) : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) {
        toast.error(t("listing.submit_err_min_img"));
        return;
      }
      if (+formData.regularPrice < +formData.discountPrice) {
        toast.error(t("listing.submit_err_discount_price"));
        return;
      }

      setLoading(true);
      const toastId = toast.loading(t("listing.submit_loading"));

      const res = await fetch(`/api/listing/update/${params.listingId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        toast.error(data.message, { id: toastId });
        return;
      }

      toast.success(t("listing.update_success") || "تم تحديث العقار بنجاح!", {
        id: toastId,
      });
      navigate(`/listing/${data._id}`);
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  // عرض الـ Skeleton عند التحميل الأولي
  if (pageLoading) return <ListingFormSkeleton isRtl={isRtl} />;

  return (
    <div className="bg-slate-50/50 min-h-screen py-10 px-4 transition-colors duration-300">
      {/* Toast Notifications Provider */}
      <Toaster
        position={isRtl ? "bottom-left" : "bottom-right"}
        toastOptions={{ duration: 4000 }}
      />

      <main className="p-4 md:p-8 max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <span className="bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full mb-3 border border-blue-100">
            {t("listing.update_badge")}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {t("listing.update_title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-md">
            {t("listing.update_subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column: Form Controls & Inputs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
              <h2
                className={`text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 ${
                  isRtl ? "flex-row-reverse text-right" : "text-left"
                }`}
              >
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("listing.sec_general_title")}
              </h2>

              <div className="flex flex-col gap-2">
                <label
                  className={`text-xs font-bold text-slate-600 ${
                    isRtl ? "text-right mr-1" : "text-left ml-1"
                  }`}
                >
                  {t("listing.title_label")}
                </label>
                <input
                  type="text"
                  placeholder={t("listing.title_placeholder")}
                  className={`p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/30 text-slate-700 font-medium ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                  id="name"
                  maxLength="62"
                  minLength="10"
                  required
                  onChange={handleChange}
                  value={formData.name}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className={`text-xs font-bold text-slate-600 ${
                    isRtl ? "text-right mr-1" : "text-left ml-1"
                  }`}
                >
                  {t("listing.address_label")}
                </label>
                <input
                  type="text"
                  placeholder={t("listing.address_placeholder")}
                  className={`p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/30 text-slate-700 font-medium ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                  id="address"
                  required
                  onChange={handleChange}
                  value={formData.address}
                />
              </div>

              {/* Description Field with AI Generation Option */}
              <div className="flex flex-col gap-2">
                <div
                  className={`flex justify-between items-center ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <label
                    className={`text-xs font-bold text-slate-600 ${
                      isRtl ? "text-right mr-1" : "text-left ml-1"
                    }`}
                  >
                    {t("listing.desc_label")}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={aiLoading}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs px-3 py-1.5 transition-all border border-purple-200/60 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>✨</span>
                    {aiLoading
                      ? t("listing.ai_desc_loading")
                      : t("listing.ai_desc_btn")}
                  </button>
                </div>

                <textarea
                  placeholder={t("listing.desc_placeholder")}
                  className={`p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/30 text-slate-700 font-medium min-h-[120px] ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                  id="description"
                  required
                  onChange={handleChange}
                  value={formData.description}
                />
              </div>
            </div>

            {/* Checkboxes Options Group */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
              <h2
                className={`text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 ${
                  isRtl ? "flex-row-reverse text-right" : "text-left"
                }`}
              >
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("listing.sec_features_title")}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/20 cursor-pointer transition-all ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    id="sale"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.type === "sale"}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {t("listing.type_sale")}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/20 cursor-pointer transition-all ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    id="rent"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.type === "rent"}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {t("listing.type_rent")}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/20 cursor-pointer transition-all ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    id="parking"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.parking}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {t("listing.feat_parking")}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/20 cursor-pointer transition-all ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    id="furnished"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.furnished}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {t("listing.feat_furnished")}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/20 cursor-pointer transition-all ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    id="offer"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.offer}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {t("listing.feat_offer")}
                  </span>
                </label>
              </div>
            </div>

            {/* Price and Specifications Group */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
              <h2
                className={`text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 ${
                  isRtl ? "flex-row-reverse text-right" : "text-left"
                }`}
              >
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("listing.sec_pricing_title")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-bold text-slate-600 ${
                      isRtl ? "text-right mr-1" : "text-left ml-1"
                    }`}
                  >
                    {t("listing.num_beds")}
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    min="1"
                    max="10"
                    required
                    className="p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700"
                    onChange={handleChange}
                    value={formData.bedrooms}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-bold text-slate-600 ${
                      isRtl ? "text-right mr-1" : "text-left ml-1"
                    }`}
                  >
                    {t("listing.num_baths")}
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    min="1"
                    max="10"
                    required
                    className="p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700"
                    onChange={handleChange}
                    value={formData.bathrooms}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-bold text-slate-600 ${
                      isRtl ? "text-right mr-1" : "text-left ml-1"
                    }`}
                  >
                    {t("listing.num_price")}{" "}
                    {formData.type === "rent" && (
                      <span className="text-slate-400 font-normal">
                        {t("listing.price_period")}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="regularPrice"
                    min="50"
                    max="10000000"
                    required
                    className="p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700"
                    onChange={handleChange}
                    value={formData.regularPrice}
                  />
                </div>

                {formData.offer && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      className={`text-xs font-bold text-rose-600 ${
                        isRtl ? "text-right mr-1" : "text-left ml-1"
                      }`}
                    >
                      {t("listing.num_discount")}{" "}
                      {formData.type === "rent" && (
                        <span className="text-rose-400 font-normal">
                          {t("listing.price_period")}
                        </span>
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

              {/* AI Valuation Interactive Section Component */}
              <div
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-3"
                dir={isRtl ? "rtl" : "ltr"}
              >
                <div
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <h3 className="text-sm font-bold text-slate-800">
                      {t("listing.ai_val_box_title")}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAIValuation}
                    disabled={valLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl text-xs px-4 py-2.5 hover:opacity-95 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {valLoading
                      ? t("listing.ai_val_loading")
                      : t("listing.ai_val_btn")}
                  </button>
                </div>

                {valuation && (
                  <div
                    className={`flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-100 mt-4 animate-fadeIn ${
                      isRtl ? "text-right" : "text-left"
                    }`}
                  >
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        {t("listing.ai_val_est_title")}
                      </p>
                      <p
                        className="text-lg font-bold text-emerald-600 font-mono"
                        dir="ltr"
                      >
                        ${valuation.estimatedMinPrice?.toLocaleString()} - $
                        {valuation.estimatedMaxPrice?.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400">
                          {t("listing.ai_val_status_label")}
                        </p>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            valuation.priceStatus === "Good Deal"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : valuation.priceStatus === "Fair Price"
                              ? "bg-blue-50 text-blue-600 border border-blue-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}
                        >
                          {valuation.priceStatus}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        {t("listing.ai_val_disclaimer")}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-slate-700 text-xs mb-1">
                          {t("listing.ai_val_trends_title")}
                        </h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {typeof valuation.marketTrend === "object"
                            ? valuation.marketTrend[i18n.language] ||
                              valuation.marketTrend["ar"]
                            : valuation.marketTrend}
                        </p>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-slate-700 text-xs mb-1">
                          {t("listing.ai_val_advice_title")}
                        </h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {typeof valuation.investmentAdvice === "object"
                            ? valuation.investmentAdvice[i18n.language] ||
                              valuation.investmentAdvice["ar"]
                            : valuation.investmentAdvice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Media Upload */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
              <h2
                className={`text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 ${
                  isRtl ? "flex-row-reverse text-right" : "text-left"
                }`}
              >
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t("listing.sec_media_title")}
              </h2>

              <div className={isRtl ? "text-right" : "text-left"}>
                <p className="text-xs font-bold text-slate-700 tracking-wide mb-1">
                  {t("listing.media_upload_label")}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  {t("listing.media_upload_subtitle")}
                </p>

                <div className="flex gap-3">
                  <input
                    onChange={(e) => setFiles(e.target.files)}
                    className="p-2.5 border border-slate-200 rounded-xl w-full text-xs text-slate-500 bg-slate-50/50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
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
                    {uploading
                      ? t("listing.media_uploading_btn")
                      : t("listing.media_upload_btn")}
                  </button>
                </div>
              </div>

              {/* Uploaded Images Preview Grid */}
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 max-h-[320px] overflow-y-auto">
                  {formData.imageUrls.map((url, index) => (
                    <div
                      key={url}
                      className={`flex justify-between p-2.5 bg-white border border-slate-100 items-center rounded-xl shadow-sm ${
                        isRtl ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-3 truncate ${
                          isRtl ? "flex-row-reverse" : ""
                        }`}
                      >
                        <img
                          src={url}
                          alt="listing"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-100"
                        />
                        <span className="text-xs font-medium text-slate-500">
                          {index === 0
                            ? `🏆 ${t("listing.media_cover_badge")}`
                            : `${t("listing.media_img_badge")} ${index + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerDeleteModal(index)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all uppercase cursor-pointer"
                      >
                        {t("listing.media_delete_btn")}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-2">
                <button
                  disabled={loading || uploading}
                  className="w-full bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-blue-600/10 disabled:opacity-70 cursor-pointer"
                >
                  {loading
                    ? t("listing.submit_loading")
                    : t("listing.submit_btn")}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Confirmation Modal Container */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300">
            <div className="bg-slate-50 p-4 border-b border-slate-100 text-center">
              <h3 className="text-md font-bold text-slate-800 uppercase tracking-wider">
                {t("listing.modal_title")}
              </h3>
            </div>
            <div className="p-6 text-center flex flex-col gap-2">
              <p className="text-slate-700 font-semibold text-base">
                {t("listing.modal_desc")}
              </p>
              <p className="text-xs text-slate-400">
                {t("listing.modal_subdesc")}
              </p>
            </div>
            <div
              className={`flex gap-3 p-4 bg-slate-50 border-t border-slate-100 justify-center ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-300 transition-colors shadow-xs cursor-pointer"
              >
                ✕ {t("listing.modal_cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors shadow-md flex items-center gap-1 cursor-pointer"
              >
                🗑️ {t("listing.modal_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}