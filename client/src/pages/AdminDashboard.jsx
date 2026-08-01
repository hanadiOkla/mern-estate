import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحديد الاتجاه ديناميكياً لتأمين توافق واجهات RTL / LTR
  const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');

  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        const res = await fetch('/api/listing/pending');
        const data = await res.json();
        if (data.success !== false) {
          setPendingListings(data);
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    fetchPendingListings();
  }, []);

  const handleAction = async (listingId, actionType) => {
    try {
      const res = await fetch(`/api/listing/approve/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: actionType }),
      });

      const data = await res.json();

      if (data.success !== false) {
        setPendingListings((prev) => prev.filter((item) => item._id !== listingId));
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className='p-4 max-w-5xl mx-auto min-h-[calc(100vh-250px)] font-sans antialiased'
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 💡 العنوان الرئيسي من الـ JSON */}
      <h1 className='text-3xl font-bold text-center my-8 text-slate-800'>
        {t('admin.dashboard_title')}
      </h1>

      {loading ? (
        <p className='text-center text-slate-600'>{t('admin.loading')}</p>
      ) : (
        <div className='flex flex-col gap-4'>
          {pendingListings.length === 0 ? (
            <div className='text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200'>
              <p className='text-slate-600 font-medium'>{t('admin.no_pending')}</p>
            </div>
          ) : (
            pendingListings.map((listing) => (
              <div
                key={listing._id}
                className='border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white shadow-sm'
              >
                <div className='flex items-center gap-4'>
                  <img
                    src={listing.imageUrls?.[0] || 'https://via.placeholder.com/150'}
                    alt={listing.name}
                    className='w-20 h-20 object-cover rounded-lg border border-slate-100 shrink-0'
                  />
                  <div>
                    <h3 className='font-bold text-lg text-slate-800 line-clamp-1'>
                      {listing.name}
                    </h3>
                    <p className='text-sm text-slate-500 line-clamp-1 mb-1'>
                      {listing.address}
                    </p>
                    <span className='inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full'>
                      ${listing.regularPrice ? listing.regularPrice.toLocaleString() : 0}
                      {listing.type === 'rent' && ` ${t('admin.per_month')}`}
                    </span>
                  </div>
                </div>

                {/* 💡 الأزرار باستخدام مفاتيح preview, approve, reject */}
                <div className='flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100'>
                  <Link
                    to={`/listing/${listing._id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors'
                  >
                    <FaEye /> {t('admin.preview')}
                  </Link>

                  <button
                    onClick={() => handleAction(listing._id, 'approve')}
                    className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer'
                  >
                    <FaCheck /> {t('admin.approve')}
                  </button>

                  <button
                    onClick={() => handleAction(listing._id, 'reject')}
                    className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer'
                  >
                    <FaTimes /> {t('admin.reject')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}