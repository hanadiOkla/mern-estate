import { useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 1. استيراد خطاف الترجمة

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // 2. تم التعديل هنا: إضافة i18n لحل مشكلة الـ ReferenceError

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

  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI Description Generation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // AI Valuation States
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState(null);
  const [valuation, setValuation] = useState(null);

  const handleImageSubmit = (e) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError("Image upload failed (2 mb max per image)");
          setUploading(false);
        });
    } else {
      setImageUploadError("You can only upload 6 images per listing");
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
        },
      );
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    if (e.target.id === "sale" || e.target.id === "rent") {
      setFormData({
        ...formData,
        type: e.target.id,
      });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }

    if (
      e.target.type === "number" ||
      e.target.type === "text" ||
      e.target.type === "textarea"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) return setError(t("err_min_image"));
      if (formData.offer && +formData.regularPrice < +formData.discountPrice)
        return setError(t("err_price_validation"));
      setLoading(true);
      setError(false);
      const res = await fetch(`${window.API_BASE_URL}/api/listing/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
        credentials: "include",
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Handles AI smart description generation
  const handleGenerateAI = async () => {
    try {
      if (!formData.name || !formData.address || !formData.type) {
        setAiError(t("ai_error_fields"));
        return;
      }

      setAiLoading(true);
      setAiError(null);

      const res = await fetch(`${window.API_BASE_URL}/api/listing/generate-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success === false) {
        setAiError(data.message);
        setAiLoading(false);
        return;
      }

      setFormData({
        ...formData,
        description: data.description,
      });

      setAiLoading(false);
    } catch (error) {
      setAiError(error.message);
      setAiLoading(false);
    }
  };

  // Handles AI property valuation request
  const handleAIValuation = async (e) => {
    e.preventDefault();

    if (!formData.address || !formData.type) {
      setValError(t("ai_val_error_fields"));
      return;
    }

    try {
      setValLoading(true);
      setValError(null);
      setValuation(null);

      const res = await fetch(`${window.API_BASE_URL}/api/listing/evaluate-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
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
      setValError(t("ai_val_connection_error"));
      setValLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 px-4 md:px-8">
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Main Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("create_title")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t("create_subtitle")}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Property Details & Options */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {t("property_info")}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wide ltr:ml-1 rtl:mr-1">
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
                <label className="text-xs font-bold text-slate-700 tracking-wide ltr:ml-1 rtl:mr-1">
                  {t("description_label")}
                </label>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAI}
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
              {aiError && (
                <div className="bg-amber-50 text-amber-700 text-xs font-semibold p-3 rounded-xl border border-amber-200/70 mt-1 animate-fadeIn">
                  {aiError}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wide ltr:ml-1 rtl:mr-1">
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

            {/* Amenities & Checkboxes */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ltr:ml-1 rtl:mr-1">
                {t("amenities_options")}
              </p>
              <div className="flex gap-5 flex-wrap">
                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="sale"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.type === "sale"}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {t("opt_sell")}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="rent"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.type === "rent"}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {t("opt_rent")}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="parking"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.parking}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {t("opt_parking")}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="furnished"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.furnished}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {t("opt_furnished")}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    id="offer"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    onChange={handleChange}
                    checked={formData.offer}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {t("opt_offer")}
                  </span>
                </label>
              </div>
            </div>

            {/* Numeric Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 ltr:ml-1 rtl:mr-1">
                  {t("lbl_beds")}
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
                <label className="text-xs font-bold text-slate-600 ltr:ml-1 rtl:mr-1">
                  {t("lbl_baths")}
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
                <label className="text-xs font-bold text-slate-600 ltr:ml-1 rtl:mr-1">
                  {t("lbl_regular_price")}{" "}
                  {formData.type === "rent" && (
                    <span className="text-slate-400 font-normal">
                      ({t("mo")})
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
                  <label className="text-xs font-bold text-rose-600 ltr:ml-1 rtl:mr-1">
                    {t("lbl_discount_price")}{" "}
                    {formData.type === "rent" && (
                      <span className="text-rose-400 font-normal">
                        ({t("mo")})
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

            {/* AI Valuation Section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <h3 className="text-sm font-bold text-slate-800">
                    {t("ai_val_box_title")}
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

              {valError && (
                <div className="bg-amber-50 text-amber-700 text-xs font-semibold p-3 rounded-xl border border-amber-200/70 mt-3">
                  {valError}
                </div>
              )}

              {valuation && (
                <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-100 mt-4 animate-fadeIn">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      {t("ai_val_result_lbl")}
                    </p>
                    <p
                      className="text-lg font-bold text-emerald-600 font-mono"
                      dir="ltr"
                    >
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
                        {t("listing.ai_val_trends_title")}
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {typeof valuation.marketTrend === "object"
                          ? valuation.marketTrend[i18n?.language || "ar"] ||
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
                          ? valuation.investmentAdvice[
                              i18n?.language || "ar"
                            ] || valuation.investmentAdvice["ar"]
                          : valuation.investmentAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Media & Publish */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
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
                    onChange={(e) => setFiles(e.target.files)}
                    className="p-2.5 border border-slate-200 rounded-xl w-full text-xs text-slate-500 bg-slate-50/50 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer ltr:file:mr-4 rtl:file:ml-4"
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleImageSubmit}
                    className="px-4 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-xl uppercase hover:bg-emerald-50 disabled:opacity-70 transition-all shrink-0"
                  >
                    {uploading ? t("btn_uploading") : t("btn_upload")}
                  </button>
                </div>
                {imageUploadError && (
                  <p className="text-red-500 text-xs font-medium mt-2 bg-red-50 p-2 rounded-lg text-center">
                    {imageUploadError}
                  </p>
                )}
              </div>

              {/* Preview Grid */}
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 max-h-[280px] overflow-y-auto">
                  {formData.imageUrls.map((url, index) => (
                    <div
                      key={url}
                      className="flex justify-between p-2.5 bg-white border border-slate-100 items-center rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <img
                          src={url}
                          alt="listing"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-100"
                        />
                        <span className="text-xs font-medium text-slate-500">
                          {index === 0
                            ? t("lbl_cover")
                            : `${t("lbl_image")} ${index + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all uppercase"
                      >
                        {t("btn_delete")}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-2">
                <button
                  disabled={loading || uploading}
                  className="w-full bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-blue-600/10 disabled:opacity-70"
                >
                  {loading
                    ? t("btn_publishing_listing")
                    : t("btn_publish_listing")}
                </button>
                {error && (
                  <p className="text-red-500 text-xs font-medium text-center mt-1 bg-red-50 p-2 rounded-lg border border-red-100">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}