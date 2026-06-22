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
      const res = await fetch(`${API_BASE_URL}/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData), 
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
      const res = await fetch(`${API_BASE_URL}/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        credentials: 'include',
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
      const res = await fetch(`${API_BASE_URL}/api/auth/signout`, {
        method: 'GET',
        credentials: 'include',
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

  const handleListingDelete = async () => {
    if (!listingToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/delete/${listingToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success === false) {
        setShowDeleteModal(false);
        return;
      }
      setUserListings((prev) => prev.filter((listing) => listing._id !== listingToDelete));
      setShowDeleteModal(false);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 4000);
      setListingToDelete(null);
    } catch (error) {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className='bg-slate-50/50 min-h-screen py-12 px-4 md:px-8 relative'>
      <div className='max-w-6xl mx-auto flex flex-col gap-8'>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>{t('profile.title')}</h1>
          <p className='text-sm text-slate-400 mt-1'>{t('profile.subtitle')}</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-3 bg-slate-50/50 py-6 rounded-2xl border border-dashed border-slate-200 relative group'>
              <input onChange={(e) => setFile(e.target.files[0])} type="file" ref={fileRef} hidden accept='image/*' />
              <div className='relative w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-white ring-4 ring-blue-50 cursor-pointer' onClick={() => fileRef.current.click()}>
                <img src={formData.avatar || currentUser.avatar} alt="profile" className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' />
              </div>
              <div className='text-xs font-semibold text-center mt-1'>
                {fileUploadError ? <span className='text-red-500 bg-red-50 px-2.5 py-1 rounded-full'>{t('profile.upload_error')}</span> : filePerc > 0 && filePerc < 100 ? <span className='text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full'>{`${t('profile.uploading')} ${filePerc}%`}</span> : filePerc === 100 ? <span className='text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full'>{t('profile.upload_success')}</span> : <span className='text-slate-400 font-medium'>{t('profile.upload_hint')}</span>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
              <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>{t('profile.username')}</label>
                <input type="text" placeholder={t('profile.username_placeholder')} defaultValue={currentUser.username} className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500' onChange={handleChange} id="username" />
              </div>
              <div className={`flex flex-col gap-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>{t('profile.email')}</label>
                <input type="email" placeholder={t('profile.email_placeholder')} defaultValue={currentUser.email} className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500' onChange={handleChange} id="email" />
              </div>
              <div className={`flex flex-col gap-1.5 mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                <label className={`text-xs font-bold text-slate-700 tracking-wide ${isRtl ? 'mr-1' : 'ml-1'}`}>{t('profile.password')}</label>
                <input type="password" placeholder="••••••••" className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500' onChange={handleChange} id="password" />
              </div>
              <div className='flex flex-col gap-3 mt-2'>
                <button disabled={loading} className='bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 transition-all text-sm disabled:opacity-70'>
                  {loading ? t('profile.saving') : t('profile.update_btn')}
                </button>
                <Link className='bg-emerald-600 text-white p-3.5 rounded-xl font-semibold text-center uppercase hover:bg-emerald-700 transition-all text-sm' to={'/create-listing'}>{t('profile.create_btn')}</Link>
              </div>
            </form>

            <div className='flex justify-between items-center border-t border-slate-100 pt-5 text-sm font-semibold'>
              <button onClick={() => { setListingToDelete(null); setShowDeleteModal(true); }} className='text-red-500 hover:text-red-600'>{t('profile.delete_account')}</button>
              <button onClick={handleSignOut} className='text-slate-500 hover:text-slate-700'>{t('profile.sign_out')}</button>
            </div>
          </div>

          <div className='lg:col-span-7 flex flex-col gap-4'>
            <div className='bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5 min-h-[300px] justify-center'>
              {userListings.length === 0 ? (
                <div className='text-center py-8 flex flex-col items-center gap-4'>
                  <h3 className='font-bold text-slate-800 text-lg'>{t('profile.listings_title')}</h3>
                  <button onClick={handleShowListings} className='mt-2 bg-slate-900 text-white font-semibold text-xs uppercase px-5 py-3 rounded-xl'>{t('profile.load_listings_btn')}</button>
                  {showListingsError && <p className='text-red-500 text-xs font-medium mt-2'>{t('profile.listings_error')}</p>}
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
                  <h2 className='text-lg font-bold text-slate-900'>{t('profile.listed_count', { count: userListings.length })}</h2>
                  <div className={`flex flex-col gap-3 max-h-[500px] overflow-y-auto`}>
                    {userListings.map((listing) => (
                      <div key={listing._id} className="border border-slate-100 rounded-2xl p-3 flex justify-between items-center gap-4">
                        <Link to={`/listing/${listing._id}`}><img src={listing.imageUrls[0]} alt="cover" className='h-16 w-20 object-cover rounded-xl' /></Link>
                        <Link to={`/listing/${listing._id}`} className='text-sm font-bold truncate flex-1'>{listing.name}</Link>
                        <div className="flex items-center gap-2">
                          <Link to={`/update-listing/${listing._id}`}><button className='bg-slate-100 text-xs px-3 py-2 rounded-lg'>{t('profile.edit')}</button></Link>
                          <button onClick={() => { setListingToDelete(listing._id); setShowDeleteModal(true); }} className='bg-rose-50 text-rose-600 text-xs px-3 py-2 rounded-lg'>{t('profile.delete')}</button>
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
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            {/* Modal content remains same as your original snippet */}
            <div className='bg-white rounded-3xl p-6 max-w-md w-full'>
              <h3 className='font-bold text-lg'>{t('profile.modal_title')}</h3>
              <p className='text-sm text-slate-500 my-4'>{listingToDelete ? t('profile.modal_desc_listing') : t('profile.modal_desc_account')}</p>
              <div className='flex justify-end gap-3'>
                <button onClick={() => setShowDeleteModal(false)} className='px-4 py-2 bg-slate-100 rounded-xl'>{t('profile.modal_cancel')}</button>
                <button onClick={listingToDelete ? handleListingDelete : hanleDeleteUser} className='px-4 py-2 bg-rose-600 text-white rounded-xl'>{t('profile.modal_confirm')}</button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default Profile;