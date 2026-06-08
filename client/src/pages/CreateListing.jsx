import { useState } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
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
          setImageUploadError('Image upload failed (2 mb max per image)');
          setUploading(false);
        });
    } else {
      setImageUploadError('You can only upload 6 images per listing');
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

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData({
        ...formData,
        type: e.target.id,
      });
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }

    if (
      e.target.type === 'number' ||
      e.target.type === 'text' ||
      e.target.type === 'textarea'
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
      if (formData.imageUrls.length < 1)
        return setError('You must upload at least one image');
      if (formData.offer && +formData.regularPrice < +formData.discountPrice)
        return setError('Discount price must be lower than regular price');
      setLoading(true);
      setError(false);
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
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

  return (
    <div className='bg-slate-50/50 min-h-screen py-12 px-4 md:px-8'>
      <main className='max-w-6xl mx-auto flex flex-col gap-8'>
        
        {/* العناوين الرئيسية */}
        <div>
          <h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>Create a Listing</h1>
          <p className='text-sm text-slate-400 mt-1'>Fill out the details below to publish your property to the marketplace.</p>
        </div>

        <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          
          {/* القسم الأيسر: تفاصيل العقار وخياراته */}
          <div className='lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5'>
            
            <h2 className='text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2'>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Property Information
            </h2>

            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-slate-700 tracking-wide ml-1'>Property Title</label>
              <input
                type='text'
                placeholder='e.g., Luxury Apartment with Sea View'
                className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20'
                id='name'
                maxLength='62'
                minLength='10'
                required
                onChange={handleChange}
                value={formData.name}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-slate-700 tracking-wide ml-1'>Description</label>
              <textarea
                type='text'
                placeholder='Describe the property features, neighborhood, utilities...'
                className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20 min-h-[120px]'
                id='description'
                required
                onChange={handleChange}
                value={formData.description}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-slate-700 tracking-wide ml-1'>Address</label>
              <input
                type='text'
                placeholder='Full location address'
                className='border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/20'
                id='address'
                required
                onChange={handleChange}
                value={formData.address}
              />
            </div>

            {/* صناديق الاختيار المعدلة بالكامل */}
            <div className='bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-2'>
              <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1'>Amenities & Options</p>
              <div className='flex gap-5 flex-wrap'>
                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='sale'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.type === 'sale'}
                  />
                  <span className='text-sm font-medium text-slate-700'>Sell Property</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='rent'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.type === 'rent'}
                  />
                  <span className='text-sm font-medium text-slate-700'>Rent Property</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='parking'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.parking}
                  />
                  <span className='text-sm font-medium text-slate-700'>Parking Spot</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='furnished'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.furnished}
                  />
                  <span className='text-sm font-medium text-slate-700'>Furnished</span>
                </label>

                <label className='flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none'>
                  <input
                    type='checkbox'
                    id='offer'
                    className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300'
                    onChange={handleChange}
                    checked={formData.offer}
                  />
                  <span className='text-sm font-medium text-slate-700'>Special Offer</span>
                </label>
              </div>
            </div>

            {/* الغرف والأسعار الرقمية */}
            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-xs font-bold text-slate-600 ml-1'>Beds</label>
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
                <label className='text-xs font-bold text-slate-600 ml-1'>Baths</label>
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
                <label className='text-xs font-bold text-slate-600 ml-1'>
                  Regular Price {formData.type === 'rent' && <span className='text-slate-400 font-normal'>($/mo)</span>}
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
                  <label className='text-xs font-bold text-rose-600 ml-1'>
                    Discount Price {formData.type === 'rent' && <span className='text-rose-400 font-normal'>($/mo)</span>}
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

          </div>

          {/* القسم الأيمن: رفع الصور والاعتماد النهائي */}
          <div className='lg:col-span-5 flex flex-col gap-6'>
            
            <div className='bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col gap-5'>
              <h2 className='text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2'>
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Media Gallery
              </h2>
              
              <div>
                <p className='text-xs font-bold text-slate-700 tracking-wide mb-1'>Upload Images</p>
                <p className='text-xs text-slate-400 mb-3'>The first image will be set as the main cover cover (Max 6 images).</p>
                
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
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                {imageUploadError && <p className='text-red-500 text-xs font-medium mt-2 bg-red-50 p-2 rounded-lg text-center'>{imageUploadError}</p>}
              </div>

              {/* شبكة استعراض الصور المرفوعة */}
              {formData.imageUrls.length > 0 && (
                <div className='flex flex-col gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 max-h-[280px] overflow-y-auto'>
                  {formData.imageUrls.map((url, index) => (
                    <div
                      key={url}
                      className='flex justify-between p-2.5 bg-white border border-slate-100 items-center rounded-xl shadow-sm'
                    >
                      <div className='flex items-center gap-3 truncate'>
                        <img
                          src={url}
                          alt='listing image'
                          className='w-14 h-14 object-cover rounded-lg border border-slate-100'
                        />
                        {index === 0 && (
                          <span className='bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-blue-100'>Cover</span>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => handleRemoveImage(index)}
                        className='text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all uppercase'
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* الأزرار النهائية وحالة الطلب */}
              <div className='flex flex-col gap-3 mt-2'>
                <button
                  disabled={loading || uploading}
                  className='w-full bg-blue-600 text-white rounded-xl p-3.5 font-semibold uppercase hover:bg-blue-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-blue-600/10 disabled:opacity-70'
                >
                  {loading ? 'Publishing Property...' : 'Create Listing'}
                </button>
                {error && <p className='text-red-500 text-xs font-medium text-center mt-1 bg-red-50 p-2 rounded-lg border border-red-100'>{error}</p>}
              </div>

            </div>

          </div>

        </form>
      </main>
    </div>
  );
}