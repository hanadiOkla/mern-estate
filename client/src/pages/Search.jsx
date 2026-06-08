import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom' 
import ListingItem from '../components/ListingItem';

export default function Search() {
    const navigate = useNavigate();
    const location = useLocation();

    const [ sidebardata, setSidebardata ] = useState({
        searchTerm: '',
        type: 'all',
        parking: false,
        furnished: false,
        offer: false,
        sort: 'created_at',
        order: 'desc',
    });

    const [ loading , setLoading ] = useState(false);
    const [ listings , setListings ] = useState([]);
    const [ showMore, setShowMore ] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const searchTermFormUrl = urlParams.get('searchTerm');
        const typeFormUrl = urlParams.get('type');
        const parkingFormUrl = urlParams.get('parking');
        const furnishedFormUrl = urlParams.get('furnished');
        const offerFormUrl = urlParams.get('offer');
        const sortFormUrl = urlParams.get('sort');
        const orderFormUrl = urlParams.get('order');

        if(
            searchTermFormUrl ||
            typeFormUrl ||
            parkingFormUrl ||
            furnishedFormUrl ||
            offerFormUrl ||
            sortFormUrl 
        ){
            setSidebardata({
                searchTerm: searchTermFormUrl || '',
                type: typeFormUrl || 'all',
                parking: parkingFormUrl === 'true' ? true : false,
                furnished: furnishedFormUrl === 'true' ? true : false,
                offer: offerFormUrl === 'true' ? true : false,
                sort: sortFormUrl || 'created_at',
                order: orderFormUrl || 'desc' 
            });
        }

        const fetchListings = async() => {
            setLoading(true);
            setShowMore(false);
            const searchQuery = urlParams.toString();
            const res = await fetch(`/api/listing/get?${searchQuery}`);
            const data = await res.json();
            if(data.length > 8 ){
                setShowMore(true);
            } else {
                setShowMore(false);
            }
            setListings(data);
            setLoading(false);            
        };
        fetchListings();
    }, [location.search]);

    const handleChange = (e) => {
        if(e.target.id === 'all' || e.target.id === 'rent' || e.target.id === 'sale'){
            setSidebardata({...sidebardata, type: e.target.id})
        }
        
        if(e.target.id === 'searchTerm'){
            setSidebardata({...sidebardata, searchTerm: e.target.value})
        }

        if(e.target.id === 'parking' || e.target.id === 'furnished' || e.target.id === 'offer'){
            setSidebardata({...sidebardata, [e.target.id]: e.target.checked})
        }

        if(e.target.id === 'sort_order'){
            const sort = e.target.value.split('_')[0] || 'created_at';
            const order = e.target.value.split('_')[1] || 'desc';
            setSidebardata({...sidebardata , sort , order});
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams();
        urlParams.set('searchTerm' , sidebardata.searchTerm);
        urlParams.set('type', sidebardata.type);
        urlParams.set('parking' , sidebardata.parking);
        urlParams.set('furnished' , sidebardata.furnished);
        urlParams.set('offer', sidebardata.offer);
        urlParams.set('sort', sidebardata.sort);
        urlParams.set('order', sidebardata.order);
        const searchQuery = urlParams.toString();
        navigate(`/search?${searchQuery}`);
    };

    const onShowMoreClick = async () => {
        const numberOfListings = listings.length;
        const startIndex = numberOfListings;
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('startIndex', startIndex);
        const searchQuery = urlParams.toString();
        const res = await fetch(`/api/listing/get?${searchQuery}`);
        const data = await res.json();
        if(data.length < 9){
            setShowMore(false);
        }
        setListings([...listings, ...data]);
    };

    return (
        <div className='flex flex-col md:flex-row min-h-screen bg-slate-50/50'>
            {/* القائمة الجانبية (Sidebar) بتصميم عصري وأنيق */}
            <div className='p-8 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 w-full md:w-80 lg:w-96 shrink-0 shadow-sm'>
                <form onSubmit={handleSubmit} className='flex flex-col gap-7 sticky top-6'>
                    
                    {/* حقل البحث الرئيسي */}
                    <div className='flex flex-col gap-2'>
                        <label className='text-sm font-bold text-slate-700 tracking-wide'>Search Term</label>
                        <input 
                            type="text"
                            id='searchTerm'
                            placeholder='What are you looking for?...'
                            className='border border-slate-200 rounded-xl p-3 w-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 bg-slate-50/40'
                            value={sidebardata.searchTerm}
                            onChange={handleChange}
                        />
                    </div>

                    {/* فلاتر النوع: تحويل الـ Checkboxes العادية إلى أزرار فخمة (Chips) */}
                    <div className='flex flex-col gap-2.5'>
                        <label className='text-sm font-bold text-slate-700 tracking-wide'>Property Type</label>
                        <div className='flex flex-wrap gap-2'>
                            {[
                                { id: 'all', label: 'Rent & Sale' },
                                { id: 'rent', label: 'For Rent' },
                                { id: 'sale', label: 'For Sale' }
                            ].map((item) => (
                                <label 
                                    key={item.id} 
                                    className={`text-xs font-semibold px-4 py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200
                                        ${sidebardata.type === item.id 
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-900/10' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <input type="checkbox" id={item.id} checked={sidebardata.type === item.id} onChange={handleChange} className="hidden" />
                                    {item.label}
                                </label>
                            ))}

                            {/* زر العروض المنفصل */}
                            <label 
                                className={`text-xs font-semibold px-4 py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200
                                    ${sidebardata.offer 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <input type="checkbox" id="offer" checked={sidebardata.offer} onChange={handleChange} className="hidden" />
                                Offer
                            </label>
                        </div>
                    </div>

                    {/* فلاتر المميزات الإضافية */}
                    <div className='flex flex-col gap-2.5'>
                        <label className='text-sm font-bold text-slate-700 tracking-wide'>Amenities</label>
                        <div className='flex flex-wrap gap-2'>
                            {[
                                { id: 'parking', label: 'Parking Space' },
                                { id: 'furnished', label: 'Furnished' }
                            ].map((item) => (
                                <label 
                                    key={item.id} 
                                    className={`text-xs font-semibold px-4 py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200
                                        ${sidebardata[item.id] 
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <input type="checkbox" id={item.id} checked={sidebardata[item.id]} onChange={handleChange} className="hidden" />
                                    {item.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* خيارات الترتيب والفرز */}
                    <div className='flex flex-col gap-2'>
                        <label className='text-sm font-bold text-slate-700 tracking-wide'>Sort By</label>
                        <select 
                            onChange={handleChange} 
                            value={`${sidebardata.sort}_${sidebardata.order}`} 
                            id="sort_order" 
                            className='border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 bg-slate-50/40 font-medium text-slate-700 cursor-pointer'
                        >
                            <option value="regularPrice_desc">Price: High to Low</option>
                            <option value="regularPrice_asc">Price: Low to High</option>
                            <option value="createdAt_desc">Latest Properties</option>
                            <option value="createdAt_asc">Oldest Properties</option>
                        </select>
                    </div>

                    {/* زر البحث المحسن */}
                    <button className='bg-blue-600 text-white p-3.5 rounded-xl font-semibold uppercase hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/10 text-sm mt-2'>
                        Apply Filters
                    </button>
                </form>
            </div>

            {/* قسم نتائج البحث (الـ Grid المتجاوب والذكي) */}
            <div className='flex-1 p-8 md:p-10'>
                <h1 className='text-2xl font-bold border-b border-slate-200 pb-4 text-slate-800 tracking-tight'>
                    Listing Results
                </h1>
                
                {/* 🌟 هاد هو الـ Grid السحري لحل مشكلة توزيع الكاردات المتناسق */}
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-8'>
                    {!loading && listings.length === 0 && (
                        <div className='col-span-full py-12 text-center'>
                            <p className='text-lg text-slate-400 font-medium'>No properties found matching your criteria.</p>
                        </div>
                    )}
                    
                    {loading && (
                        <div className='col-span-full py-12 text-center'>
                            <p className='text-lg text-blue-600 font-semibold animate-pulse'>Loading premium listings...</p>
                        </div>
                    )}
                    
                    {!loading && listings && listings.map((listing) => (
                        <ListingItem key={listing._id} listing={listing} />
                    ))}
                </div>

                {showMore && (
                    <div className="flex justify-center mt-6">
                        <button 
                            onClick={onShowMoreClick}
                            className='text-sm bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-full font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95'
                        >
                            Show More Properties
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}