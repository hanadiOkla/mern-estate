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

export default function UpdateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
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

  // حالتان للتحكم في النافذة المنبثقة وصورة المستهدف حذفها
  const [showModal, setShowModal] = useState(false);
  const [imageIndexToDelete, setImageIndexToDelete] = useState(null);

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

  // 1. عند الضغط على زر الحذف، نفتح الـ Modal ونحفظ مكان الصورة المحددة
  const triggerDeleteModal = (index) => {
    setImageIndexToDelete(index);
    setShowModal(true);
  };

  // 2. عند تأكيد الحذف من داخل الـ Modal الجديد
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
      if (formData.imageUrls.length < 1) return setError('You must upload at least one image');
      if (+formData.regularPrice < +formData.discountPrice)
        return setError('Discount price must be lower than regular price');
      
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

  return (
    <main className='p-6 max-w-5xl mx-auto bg-slate-50 min-h-screen pb-16 relative'>
      <h1 className='text-3xl font-bold text-center my-8 text-slate-800 tracking-tight'>
        Update Your Listing
      </h1>
      
      <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100'>
        
        {/* القسم الأيسر: الحقول النصية والخصائص */}
        <div className='flex flex-col gap-5 flex-1'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-semibold text-slate-700'>Property Title</label>
            <input
              type='text'
              placeholder='e.g., Modern Apartment with Sea View'
              className='border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all text-sm'
              id='name'
              maxLength='62'
              minLength='10'
              required
              onChange={handleChange}
              value={formData.name}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-semibold text-slate-700'>Description</label>
            <textarea
              placeholder='Describe the property features, neighborhood, etc...'
              className='border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all text-sm min-h-[120px]'
              id='description'
              required
              onChange={handleChange}
              value={formData.description}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-semibold text-slate-700'>Address</label>
            <input
              type='text'
              placeholder='Full location address'
              className='border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all text-sm'
              id='address'
              required
              onChange={handleChange}
              value={formData.address}
            />
          </div>

          <div className='flex gap-3 flex-wrap my-2 bg-slate-50 p-4 rounded-xl border border-slate-100'>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-all text-sm ${formData.type === 'sale' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type='checkbox' id='sale' className='w-4 h-4 accent-blue-600 hidden' onChange={handleChange} checked={formData.type === 'sale'} />
              Sell
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-all text-sm ${formData.type === 'rent' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type='checkbox' id='rent' className='w-4 h-4 accent-blue-600 hidden' onChange={handleChange} checked={formData.type === 'rent'} />
              Rent
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-all text-sm ${formData.parking ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type='checkbox' id='parking' className='w-4 h-4 accent-blue-600' onChange={handleChange} checked={formData.parking} />
              Parking spot
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-all text-sm ${formData.furnished ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type='checkbox' id='furnished' className='w-4 h-4 accent-blue-600' onChange={handleChange} checked={formData.furnished} />
              Furnished
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer select-none transition-all text-sm ${formData.offer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type='checkbox' id='offer' className='w-4 h-4 accent-emerald-600' onChange={handleChange} checked={formData.offer} />
              Special Offer
            </label>
          </div>

          <div className='grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100'>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Beds</label>
              <input type='number' id='bedrooms' min='1' max='10' required className='p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white text-sm' onChange={handleChange} value={formData.bedrooms} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Baths</label>
              <input type='number' id='bathrooms' min='1' max='10' required className='p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white text-sm' onChange={handleChange} value={formData.bathrooms} />
            </div>
            <div className='flex flex-col gap-1 col-span-2 sm:col-span-1'>
              <label className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>Regular Price <span className='text-[10px] text-slate-400'>{formData.type === 'rent' && '($ / mo)'}</span></label>
              <input type='number' id='regularPrice' min='50' max='10000000' required className='p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white text-sm font-semibold text-blue-600' onChange={handleChange} value={formData.regularPrice} />
            </div>
            {formData.offer && (
              <div className='flex flex-col gap-1 col-span-2 sm:col-span-1 animate-fade-in'>
                <label className='text-xs font-semibold text-emerald-700 uppercase tracking-wider'>Discounted Price <span className='text-[10px] text-emerald-500'>{formData.type === 'rent' && '($ / mo)'}</span></label>
                <input type='number' id='discountPrice' min='0' max='10000000' required className='p-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:outline-none bg-white text-sm font-semibold text-emerald-600' onChange={handleChange} value={formData.discountPrice} />
              </div>
            )}
          </div>
        </div>

        {/* القسم الأيمن: رفع وإدارة الصور */}
        <div className='flex flex-col flex-1 gap-5 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6'>
          <div>
            <p className='font-bold text-slate-800 text-sm mb-1'>Property Images</p>
            <p className='text-xs text-slate-500'>The first image will be the main cover (maximum 6 images).</p>
          </div>
          
          <div className='flex gap-3'>
            <input
              onChange={(e) => setFiles(e.target.files)}
              className='p-2.5 border border-slate-200 rounded-xl w-full text-sm text-slate-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-slate-50'
              type='file'
              id='images'
              accept='image/*'
              multiple
            />
            <button
              type='button'
              disabled={uploading}
              onClick={handleImageSubmit}
              className='px-5 py-2.5 text-blue-600 border border-blue-200 bg-blue-50/50 rounded-xl font-semibold uppercase text-xs tracking-wider hover:bg-blue-600 hover:text-white disabled:opacity-50 transition-all shadow-sm'
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          
          {imageUploadError && <p className='text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded-lg border border-red-100'>{imageUploadError}</p>}
          
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1'>
            {formData.imageUrls.length > 0 &&
              formData.imageUrls.map((url, index) => (
                <div
                  key={url}
                  className='flex justify-between p-2.5 border border-slate-100 rounded-xl items-center bg-slate-50/50 hover:bg-slate-50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <img src={url} alt='listing thumbnail' className='w-14 h-14 object-cover rounded-lg shadow-sm border border-white' />
                    <span className='text-xs font-medium text-slate-500'>{index === 0 ? '🏆 Cover' : `Image ${index + 1}`}</span>
                  </div>
                  <button
                    type='button'
                    onClick={() => triggerDeleteModal(index)} // هنا تم التعديل لاستدعاء الـ Modal
                    className='text-xs font-bold text-red-500 hover:text-red-700 uppercase bg-white px-2.5 py-1.5 rounded-md shadow-xs border border-slate-100 hover:bg-red-50 transition-colors'
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>

          <button
            disabled={loading || uploading}
            className='w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl uppercase tracking-wider text-sm hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-75 transition-all mt-auto'
          >
            {loading ? 'Updating Property...' : 'Update Listing'}
          </button>
          
          {error && <p className='text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100 text-center'>{error}</p>}
        </div>
      </form>

      {/* 🌟 نافذة التأكيد الاحترافية والمودرن (Custom Modal Popup) 🌟 */}
      {showModal && (
        <div className='fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in'>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300'>
            
            {/* الهيدر */}
            <div className='bg-slate-50 p-4 border-b border-slate-100 text-center'>
              <h3 className='text-md font-bold text-slate-800 uppercase tracking-wider'>
                Confirmation Required
              </h3>
            </div>
            
            {/* المحتوى */}
            <div className='p-6 text-center flex flex-col gap-2'>
              <p className='text-slate-700 font-semibold text-base'>
                Do you want to permanently delete this image?
              </p>
              <p className='text-xs text-slate-400'>
                This action cannot be undone.
              </p>
            </div>
            
            {/* أزرار التحكم السفلى المنسقة مثل الصورة تماماً */}
            <div className='flex gap-3 p-4 bg-slate-50 border-t border-slate-100 justify-center'>
              <button
                type='button'
                onClick={() => setShowModal(false)}
                className='px-5 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-300 transition-colors shadow-xs'
              >
                ✕ Cancel
              </button>
              <button
                type='button'
                onClick={handleConfirmDelete}
                className='px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors shadow-md flex items-center gap-1'
              >
                🗑️ Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}