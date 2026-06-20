import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getStorage, uploadBytesResumable, ref, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import { 
  updateUserStart, updateUserSuccess, updateUserFailure, 
  deleteUserFailure, deleteUserStart, deleteUserSuccess, 
  signOutUserFailure, signOutUserStart, signOutUserSuccess 
} from '../redux/user/userSlice'; 
import { Link } from 'react-router-dom';
// 1. استيراد خطاف الترجمة من react-i18next
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from '../config';
function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingsError, setShowListingsError] = useState(false);
  const [userListings, setUserListings] = useState([]);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  const dispatch = useDispatch();

  // 2. تفعيل دالة الترجمة t ومعرفة الاتجاه الحالي (rtl أو ltr)
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    if (file) {
      handleFileUpdate(file);
    }
  }, [file]);

  const handleFileUpdate = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, avatar: downloadURL });
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`${window.API_BASE_URL}/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), 
        credentials: 'include', // 👈 تم إضافة السطر هنا لتمرير الكوكيز والـ Token أونلاين عند تحديث الحساب
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 4000);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const hanleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`${window.API_BASE_URL}/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        credentials: 'include', // 👈 تم إضافة السطر هنا لتأمين عملية الحذف وتمرير الكوكيز أونلاين
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch(`${window.API_BASE_URL}/api/auth/signout`, {
        method: 'GET',
        credentials: 'include', // 👈 السطر الموحد لضمان إرسال الكوكيز ومسحها بنجاح من المتصفح أونلاين
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        return;
      }
      dispatch(signOutUserSuccess(data));
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  };

const handleShowListings = async () => {
    setShowListingsError(false);
    try {
      // 👈 تم التعديل هنا: حذفنا window. واستخدمنا API_BASE_URL المركزية مباشرة
      const res = await fetch(`${API_BASE_URL}/api/user/listings/${currentUser._id}`, {
        method: 'GET',
        credentials: 'include', 
      });
      const data = await res.json();
      if (data.success === false) {
        setShowListingsError(true);
        return;
      }
      setUserListings(data);
    } catch (error) {
      setShowListingsError(true);
    }
  };

  const confirmListingDelete = (listingId) => {
    setListingToDelete(listingId);
    setShowDeleteModal(true);
  };

  const handleListingDelete = async () => {
    if (!listingToDelete) return;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/listing/delete/${listingToDelete}`, {
        method: 'DELETE',
        credentials: 'include', // 👈 تم إضافة السطر هنا لتمرير الكوكيز والتحقق من المالك أونلاين
      });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        setShowDeleteModal(false);
        return;
      }
      setUserListings((prev) => prev.filter((listing) => listing._id !== listingToDelete));
      setShowDeleteModal(false);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 4000);
      setListingToDelete(null);
    } catch (error) {
      console.log(error.message);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className='bg-slate-50/50 min-h-screen py-12 px-4 md:px-8 relative'>
      <div className='max-w-6xl mx-auto flex flex-col gap-8'>
        
        {/* العناوين مجهزة للـ RTL تلقائياً عبر المتصفح، ولكن أضفنا تلميحات محاذاة مرنة إن لزم الأمر */}
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>{t('profile.title')}</h1>
          <p className='text-sm text-slate-400 mt-1'>{t('profile.subtitle')}</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          
          {/* العمود الأيسر: الحساب والتعديلات */}
          <div className='lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-6'>
            
            <div className='flex flex-col items-center gap-3 bg-slate-50/50 py-6 rounded-2xl border border-dashed border-slate-200 relative group'>
              <input onChange={(e) => setFile(e.target.files[0])} type="file" ref={fileRef} hidden accept='image/*' />
              <div className='relative w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-white ring-4 ring-blue-50 cursor-pointer' onClick={() => fileRef.current.click()}>
                <img 
                  src={formData.avatar || currentUser.avatar} 
                  alt="profile" 
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                />
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              
              <div className='text-xs font-semibold text-center mt-1'>
                {fileUploadError ? (
                  <span className='text-red-500 bg-red-50 px-2.5 py-1 rounded-full'>{t('profile.upload_error')}</span>
                ) : filePerc > 0 && filePerc < 100 ? (
                  <span className='text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full'>{`${t('profile.uploading')} ${filePerc}%`}</span>
                ) : filePerc === 100 ? (
                  <span className='text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full'>{t('profile.upload_success')}</span>
                ) : (
                  <span className='text-slate-400 font-medium'>{t('profile.upload_hint')}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
              <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                  {t('profile.username')}
                </label>
                <input
                  type="text" 
                  placeholder={t('profile.username_placeholder')} 
                  defaultValue={currentUser.username}
                  className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20' 
                  onChange={handleChange}
                  id="username"
                />
              </div>

              <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                  {t('profile.email')}
                </label>
                <input 
                  type="email" 
                  placeholder={t('profile.email_placeholder')} 
                  defaultValue={currentUser.email}
                  className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20' 
                  onChange={handleChange}
                  id="email"
                />
              </div>

              <div className={`flex flex-col gap-1.5 mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                  {t('profile.password')}
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20' 
                  onChange={handleChange}
                  id="password"
                />
              </div>

              <div className='flex flex-col gap-3 mt-2'>
                <button 
                  disabled={loading}
                  className='bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-blue-600/10 disabled:opacity-70'
                >
                  {loading ? t('profile.saving') : t('profile.update_btn')}          
                </button>
                <Link 
                  className='bg-emerald-600 text-white p-3.5 rounded-xl font-semibold text-center uppercase hover:bg-emerald-700 transition-all text-sm shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2' 
                  to={'/create-listing'}
                >
                  {t('profile.create_btn')}
                </Link>
              </div>
            </form>

            <div className='flex justify-between items-center border-t border-slate-100 pt-5 text-sm font-semibold'>
              <button onClick={() => { setListingToDelete(null); setShowDeleteModal(true); }} className='text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5'>
                {t('profile.delete_account')}
              </button>
              <button onClick={handleSignOut} className='text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5'>
                {t('profile.sign_out')}
              </button>
            </div>

            {error && <div className='bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-medium text-center mt-2'>{error}</div>}
            {updateSuccess && <div className='bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl text-xs font-medium text-center mt-2'>{t('profile.update_success_msg')}</div>}
            
            {deleteSuccess && <div className='bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-medium text-center mt-2'>{t('profile.delete_listing_success')}</div>}
          </div>

          {/* العمود الأيمن: العقارات */}
          <div className='lg:col-span-7 flex flex-col gap-4'>
            <div className='bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5 min-h-[300px] justify-center'>
              
              {userListings.length === 0 ? (
                <div className='text-center py-8 flex flex-col items-center gap-4'>
                  <div className='w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner'>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className='font-bold text-slate-800 text-lg'>{t('profile.listings_title')}</h3>
                    <p className='text-slate-400 text-xs max-w-xs mx-auto mt-1'>{t('profile.listings_subtitle')}</p>
                  </div>
                  <button 
                    onClick={handleShowListings} 
                    className='mt-2 bg-slate-900 text-white font-semibold text-xs uppercase px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10'
                  >
                    {t('profile.load_listings_btn')}
                  </button>
                  {showListingsError && <p className='text-red-500 text-xs font-medium mt-2'>{t('profile.listings_error')}</p>}
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <h2 className='text-lg font-bold text-slate-900'>{t('profile.listed_count', { count: userListings.length })}</h2>
                    <button onClick={handleShowListings} className='text-xs font-bold text-blue-600 hover:underline'>{t('profile.refresh')}</button>
                  </div>
                  
                  <div className={`flex flex-col gap-3 max-h-[500px] overflow-y-auto ${isRtl ? 'pl-1' : 'pr-1'}`}>
                    {userListings.map((listing) => (
                      <div key={listing._id} className="border border-slate-100 rounded-2xl p-3 flex justify-between items-center gap-4 hover:shadow-md hover:border-slate-200/80 transition-all duration-200 bg-slate-50/30">
                        <Link to={`/listing/${listing._id}`} className='shrink-0'>
                          <img src={listing.imageUrls[0]} alt="listing cover" className='h-16 w-20 object-cover rounded-xl bg-slate-100 shadow-sm' />
                        </Link>
                        <Link className='text-slate-700 text-sm font-bold hover:text-blue-600 hover:underline truncate flex-1' to={`/listing/${listing._id}`}>
                          {listing.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <Link to={`/update-listing/${listing._id}`}>
                            <button className='bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors'>{t('profile.edit')}</button>
                          </Link>
                          <button onClick={() => confirmListingDelete(listing._id)} className='bg-rose-50 text-rose-600 font-bold text-xs px-3 py-2 rounded-lg hover:bg-rose-600 hover:text-white transition-colors'>{t('profile.delete')}</button>
                        </div>
                      </div>            
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* نافذة مودال منبثقة مخصصة ومطابقة لستايل التصميم */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fadeIn'>
          <div className='bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4 scale-100 transition-transform'>
            <div className={`flex items-center gap-3 text-rose-600 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className='w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center shrink-0'>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className='font-bold text-lg text-slate-900'>{t('profile.modal_title')}</h3>
            </div>
            <p className={`text-slate-500 text-sm leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
              {listingToDelete 
                ? t('profile.modal_desc_listing')
                : t('profile.modal_desc_account')
              }
            </p>
            <div className={`flex justify-end gap-3 font-semibold text-xs uppercase pt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button 
                onClick={() => { setShowDeleteModal(false); setListingToDelete(null); }} 
                className='px-4 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors'
              >
                {t('profile.modal_cancel')}
              </button>
              <button 
                onClick={listingToDelete ? handleListingDelete : hanleDeleteUser} 
                className='px-4 py-3 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/10 transition-colors'
              >
                {t('profile.modal_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;