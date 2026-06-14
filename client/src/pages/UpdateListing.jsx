import { useEffect, useState } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
// 1. استيراد خطاف الترجمة من react-i18next
import { useTranslation } from 'react-i18next';

export default function UpdateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  
  // 2. تفعيل دالة الترجمة ومعرفة الاتجاه الحالي
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
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

  // Modal states for deleting pictures
  const [showModal, setShowModal] = useState(false);
  const [imageIndexToDelete, setImageIndexToDelete] = useState(null);

  // AI Description Generation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // AI Valuation States
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState(null);
  const [valuation, setValuation] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      const listingId = params.listingId;
      const res = await fetch(`/api/listing/get/${listingId}`);
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      setFormData(data);
    };
    fetchListing();
  }, [params.listingId]);

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
          setImageUploadError(t('listing.upload_err_size'));
          setUploading(false);
        });
    } else {
      setImageUploadError(t('listing.upload_err_count'));
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
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => { reject(error); },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const triggerDeleteModal = (index) => {
    setImageIndexToDelete(index);
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    if (imageIndexToDelete !== null) {
      setFormData({
        ...formData,
        imageUrls: formData.imageUrls.filter((_, i) => i !== imageIndexToDelete),
      });
    }
    setShowModal(false);
    setImageIndexToDelete(null);
  };

  const handleChange = (e) => {
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData({ ...formData, type: e.target.id });
    }

    if (e.target.id === 'parking' || e.target.id === 'furnished' || e.target.id === 'offer') {
      setFormData({ ...formData, [e.target.id]: e.target.checked });
    }

    if (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'textarea') {
      setFormData({
        ...formData,
        [e.target.id]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) return setError(t('listing.submit_err_images'));
      if (+formData.regularPrice < +formData.discountPrice)
        return setError(t('listing.submit_err_discount'));
      
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/listing/update/${params.listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
        return;
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    try {
      if (!formData.name || !formData.address || !formData.type) {
        setAiError(t('listing.ai_desc_missing_fields'));
        return;
      }

      setAiLoading(true);
      setAiError(null);

      const res = await fetch('/api/listing/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const handleAIValuation = async (e) => {
    e.preventDefault();
    
    if (!formData.address || !formData.type) {
      setValError(t('listing.ai_val_missing_fields'));
      return;
    }

    try {
      setValLoading(true);
      setValError(null);
      setValuation(null);

      const res = await fetch('/api/listing/evaluate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      setValError(t('listing.ai_val_conn_error'));
      setValLoading(false);
    }
  };

  return (
    <div className='bg-slate-50/50 min-h-screen py-12 px-4 md:px-8' i18n={i18n.language}>
      <main className='max-w-6xl mx-auto flex flex-col gap-8'>
        
        {/* Main Header */}
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>{t('listing.update_title')}</h1>
          <p className='text-sm text-slate-400 mt-1'>{t('listing.update_subtitle')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          
          {/* Left Column: Property Details & Options */}
          <div className='lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5'>
            
            <h2 className={`text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t('listing.sec_info_title')}
            </h2>

            <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>{t('listing.label_title')}</label>
              <input
                type='text'
                placeholder={t('listing.placeholder_title')}
                className={`border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20 ${isRtl ? 'text-right' : 'text-left'}`}
                id='name'
                maxLength='62'
                minLength='10'
                required
                onChange={handleChange}
                value={formData.name}
              />
            </div>

            <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className={`flex justify-between items-center flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>{t('listing.label_desc')}</label>
                <button
                  type='button'
                  disabled={aiLoading}
                  onClick={handleGenerateAI}
                  className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold uppercase hover:opacity-95 disabled:opacity-80 flex items-center gap-2 shadow-sm transition'
                >
                  {aiLoading ? t('listing.ai_desc_loading') : t('listing.ai_desc_btn')}
                </button>
              </div>
              <textarea
                placeholder={t('listing.placeholder_desc')}
                className={`border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20 min-h-[120px] ${isRtl ? 'text-right' : 'text-left'}`}
                id='description'
                required
                onChange={handleChange}
                value={formData.description}
              />
              {aiError && (
                <div className={`bg-amber-50 text-amber-700 text-xs font-semibold p-3 rounded-xl border border-amber-200/70 mt-1 animate-fadeIn ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                  {aiError}
                </div>
              )}
            </div>

            <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>{t('listing.label_address')}</label>
              <input
                type='text'
                placeholder={t('listing.placeholder_address')}
                className={`border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20 ${isRtl ? 'text-right' : 'text-left'}`}
                id='address'
                required
                onChange={handleChange}
                value={formData.address}
              />
            </div>

            {/* Amenities & Checkboxes */}
            <div className='bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-2'>
              <p className={`text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ${isRtl ? 'text-right mr-1' : 'text-left ml-1'}`}>{t('listing.sec_amenities_title')}</p>
              <div className={`flex gap-5 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='sale'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.type === 'sale'}
                  />
                  <span className='text-sm font-medium text-slate-700'>{t('listing.opt_sell')}</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='rent'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.type === 'rent'}
                  />
                  <span className='text-sm font-medium text-slate-700'>{t('listing.opt_rent')}</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='parking'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.parking}
                  />
                  <span className='text-sm font-medium text-slate-700'>{t('listing.opt_parking')}</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='furnished'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.furnished}
                  />
                  <span className='text-sm font-medium text-slate-700'>{t('listing.opt_furnished')}</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='offer'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.offer}
                  />
                  <span className='text-sm font-medium text-slate-700'>{t('listing.opt_offer')}</span>
                </label>
              </div>
            </div>

            {/* Numeric Fields */}
            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2'>
              <div className='flex flex-col gap-1.5'>
                <label className={`text-xs font-bold text-slate-600 ${isRtl ? 'text-right mr-1' : 'text-left ml-1'}`}>{t('listing.num_beds')}</label>
                <input
                  type='number'
                  id='bedrooms'
                  min='1'
                  max='10'
                  required
                  className='p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700'
                  onChange={handleChange}
                  value={formData.bedrooms}
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className={`text-xs font-bold text-slate-600 ${isRtl ? 'text-right mr-1' : 'text-left ml-1'}`}>{t('listing.num_baths')}</label>
                <input
                  type='number'
                  id='bathrooms'
                  min='1'
                  max='10'
                  required
                  className='p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700'
                  onChange={handleChange}
                  value={formData.bathrooms}
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className={`text-xs font-bold text-slate-600 ${isRtl ? 'text-right mr-1' : 'text-left ml-1'}`}>
                  {t('listing.num_price')} {formData.type === 'rent' && <span className='text-slate-400 font-normal'>{t('listing.price_period')}</span>}
                </label>
                <input
                  type='number'
                  id='regularPrice'
                  min='50'
                  max='10000000'
                  required
                  className='p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/20 text-center font-semibold text-slate-700'
                  onChange={handleChange}
                  value={formData.regularPrice}
                />
              </div>

              {formData.offer && (
                <div className='flex flex-col gap-1.5'>
                  <label className={`text-xs font-bold text-rose-600 ${isRtl ? 'text-right mr-1' : 'text-left ml-1'}`}>
                    {t('listing.num_discount')} {formData.type === 'rent' && <span className='text-rose-400 font-normal'>{t('listing.price_period')}</span>}
                  </label>
                  <input
                    type='number'
                    id='discountPrice'
                    min='0'
                    max='10000000'
                    required
                    className='p-3 border border-rose-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 bg-rose-50/10 text-center font-bold text-rose-600 ring-1 ring-rose-100'
                    onChange={handleChange}
                    value={formData.discountPrice}
                  />
                </div>
              )}
            </div>

            {/* AI Valuation Interactive Section Component */}
            <div className='bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-3' dir={isRtl ? 'rtl' : 'ltr'}>
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className='flex items-center gap-2'>
                  <span className='text-xl'>💡</span>
                  <h3 className='text-sm font-bold text-slate-800'>{t('listing.ai_val_box_title')}</h3>
                </div>
                <button
                  type='button'
                  onClick={handleAIValuation}
                  disabled={valLoading}
                  className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl text-xs px-4 py-2.5 hover:opacity-95 shadow-sm transition-all disabled:opacity-50'
                >
                  {valLoading ? t('listing.ai_val_loading') : t('listing.ai_val_btn')}
                </button>
              </div>

              {valError && (
                <div className={`bg-amber-50 text-amber-700 text-xs font-semibold p-3 rounded-xl border border-amber-200/70 mt-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {valError}
                </div>
              )}

              {valuation && (
                <div className={`flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-100 mt-4 animate-fadeIn ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div>
                    <p className='text-xs text-slate-400 mb-1'>{t('listing.ai_val_est_title')}</p>
                    <p className='text-lg font-bold text-emerald-600 font-mono' dir="ltr">
                      ${valuation.estimatedMinPrice?.toLocaleString()} - ${valuation.estimatedMaxPrice?.toLocaleString()}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      <p className='text-xs text-slate-400'>{t('listing.ai_val_status_label')}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${valuation.priceStatus === 'Good Deal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : valuation.priceStatus === 'Fair Price' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {valuation.priceStatus}
                      </span>
                    </div>
                    <p className='text-[10px] text-slate-400 mt-1 leading-relaxed'>
                      {t('listing.ai_val_disclaimer')}
                    </p>
                  </div>
                  
                  <div className='border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div className='bg-slate-50/70 p-3 rounded-xl border border-slate-100'>
                      <h4 className='font-bold text-slate-700 text-xs mb-1'>{t('listing.ai_val_trends_title')}</h4>
                      <p className='text-slate-600 text-xs leading-relaxed'>{valuation.marketTrend}</p>
                    </div>
                    <div className='bg-slate-50/70 p-3 rounded-xl border border-slate-100'>
                      <h4 className='font-bold text-slate-700 text-xs mb-1'>{t('listing.ai_val_advice_title')}</h4>
                      <p className='text-slate-600 text-xs leading-relaxed'>{valuation.investmentAdvice}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Media Upload */}
          <div className='lg:col-span-5 flex flex-col gap-6'>
            <div className='bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5'>
              <h2 className={`text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('listing.sec_media_title')}
              </h2>
              
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <p className='text-xs font-bold text-slate-700 tracking-wide mb-1'>{t('listing.media_upload_label')}</p>
                <p className='text-xs text-slate-400 mb-3'>{t('listing.media_upload_subtitle')}</p>
                
                <div className='flex gap-3'>
                  <input
                    onChange={(e) => setFiles(e.target.files)}
                    className='p-2.5 border border-slate-200 rounded-xl w-full text-xs text-slate-500 bg-slate-50/50 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer'
                    type='file'
                    id='images'
                    accept='image/*'
                    multiple
                  />
                  <button
                    type='button'
                    disabled={uploading}
                    onClick={handleImageSubmit}
                    className='px-4 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-xl uppercase hover:bg-emerald-50 disabled:opacity-70 transition-all shrink-0'
                  >
                    {uploading ? t('listing.media_uploading_btn') : t('listing.media_upload_btn')}
                  </button>
                </div>
                {imageUploadError && <p className='text-red-500 text-xs font-medium mt-2 bg-red-50 p-2 rounded-lg text-center'>{imageUploadError}</p>}
              </div>

              {/* Uploaded Images Preview Grid */}
              {formData.imageUrls.length > 0 && (
                <div className='grid grid-cols-1 gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 max-h-[320px] overflow-y-auto'>
                  {formData.imageUrls.map((url, index) => (
                    <div
                      key={url}
                      className={`flex justify-between p-2.5 bg-white border border-slate-100 items-center rounded-xl shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex items-center gap-3 truncate ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <img
                          src={url}
                          alt='listing'
                          className='w-14 h-14 object-cover rounded-lg border border-slate-100'
                        />
                        <span className='text-xs font-medium text-slate-500'>
                          {index === 0 ? `🏆 ${t('listing.media_cover_badge')}` : `${t('listing.media_img_badge')} ${index + 1}`}
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={() => triggerDeleteModal(index)}
                        className='text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all uppercase'
                      >
                        {t('listing.media_delete_btn')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className='flex flex-col gap-3 mt-2'>
                <button
                  disabled={loading || uploading}
                  className='w-full bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-blue-600/10 disabled:opacity-70'
                >
                  {loading ? t('listing.submit_loading') : t('listing.submit_btn')}
                </button>
                {error && <p className='text-red-500 text-xs font-medium text-center mt-1 bg-red-50 p-2 rounded-lg border border-red-100'>{error}</p>}
              </div>
            </div>
          </div>

        </form>
      </main>

      {/* Confirmation Modal Container */}
      {showModal && (
        <div className='fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in'>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300'>
            <div className='bg-slate-50 p-4 border-b border-slate-100 text-center'>
              <h3 className='text-md font-bold text-slate-800 uppercase tracking-wider'>
                {t('listing.modal_title')}
              </h3>
            </div>
            <div className='p-6 text-center flex flex-col gap-2'>
              <p className='text-slate-700 font-semibold text-base'>
                {t('listing.modal_desc')}
              </p>
              <p className='text-xs text-slate-400'>
                {t('listing.modal_subdesc')}
              </p>
            </div>
            <div className={`flex gap-3 p-4 bg-slate-50 border-t border-slate-100 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                type='button'
                onClick={() => setShowModal(false)}
                className='px-5 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-300 transition-colors shadow-xs'
              >
                ✕ {t('listing.modal_cancel')}
              </button>
              <button
                type='button'
                onClick={handleConfirmDelete}
                className='px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors shadow-md flex items-center gap-1'
              >
                🗑️ {t('listing.modal_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}