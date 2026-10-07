import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ListingItem from "../components/listing/ListingItem";
import { useTranslation } from "react-i18next";
import apiClient from "../api/apiClient";
import CategoryBrowser from "../components/category/CategoryBrowser";
import { getCategoryLabel } from "../utils/categoryTree";
import { CategoryIcon } from "../utils/categoryIcons";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const [sidebardata, setSidebardata] = useState({
    searchTerm: "",
    type: "all",
    parking: false,
    furnished: false,
    offer: false,
    category: "",
    sort: "createdAt",
    order: "desc",
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get("/api/categories?withCounts=true");
        if (Array.isArray(data)) setCategories(data);
      } catch (error) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFormUrl = urlParams.get("searchTerm");
    const typeFormUrl = urlParams.get("type");
    const parkingFormUrl = urlParams.get("parking");
    const furnishedFormUrl = urlParams.get("furnished");
    const offerFormUrl = urlParams.get("offer");
    const sortFormUrl = urlParams.get("sort");
    const orderFormUrl = urlParams.get("order");
    const categoryFormUrl = urlParams.get("category");

    if (
      searchTermFormUrl !== null ||
      typeFormUrl !== null ||
      parkingFormUrl !== null ||
      furnishedFormUrl !== null ||
      offerFormUrl !== null ||
      sortFormUrl !== null ||
      categoryFormUrl !== null
    ) {
      setSidebardata({
        searchTerm: searchTermFormUrl || "",
        type: typeFormUrl || "all",
        parking: parkingFormUrl === "true",
        furnished: furnishedFormUrl === "true",
        offer: offerFormUrl === "true",
        category: categoryFormUrl || "",
        sort: sortFormUrl || "createdAt",
        order: orderFormUrl || "desc",
      });
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        setShowMore(false);
        const searchQuery = urlParams.toString();
        const { data } = await apiClient.get(`/api/listing/get?${searchQuery}`);

        if (!Array.isArray(data)) {
          setListings([]);
          setLoading(false);
          return;
        }

        if (data.length > 8) {
          setShowMore(true);
        } else {
          setShowMore(false);
        }
        setListings(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setListings([]);
      }
    };
    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    if (
      e.target.id === "all" ||
      e.target.id === "rent" ||
      e.target.id === "sale"
    ) {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    if (e.target.id === "searchTerm") {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setSidebardata({ ...sidebardata, [e.target.id]: e.target.checked });
    }

    if (e.target.id === "sort_order") {
      const value = e.target.value;
      const lastUnderscoreIndex = value.lastIndexOf("_");
      const sort = value.substring(0, lastUnderscoreIndex) || "createdAt";
      const order = value.substring(lastUnderscoreIndex + 1) || "desc";
      setSidebardata({ ...sidebardata, sort, order });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set("searchTerm", sidebardata.searchTerm);
    urlParams.set("type", sidebardata.type);
    urlParams.set("parking", sidebardata.parking);
    urlParams.set("furnished", sidebardata.furnished);
    urlParams.set("offer", sidebardata.offer);
    if (sidebardata.category) urlParams.set("category", sidebardata.category);
    urlParams.set("sort", sidebardata.sort);
    urlParams.set("order", sidebardata.order);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  // اختيار فئة من الشجرة يطبَّق فوراً مع الإبقاء على بقية الفلاتر الحالية في الرابط
  const handleCategorySelect = (category) => {
    const urlParams = new URLSearchParams(location.search);
    urlParams.delete("startIndex");
    if (category) urlParams.set("category", category._id);
    else urlParams.delete("category");
    setSidebardata((prev) => ({ ...prev, category: category ? category._id : "" }));
    navigate(`/search?${urlParams.toString()}`);
  };

  // مسار الفئة المختارة (من الجذر إليها) وأبناؤها المباشرون، لعرضهما فوق النتائج
  const selectedCategory = useMemo(
    () => categories.find((cat) => String(cat._id) === String(sidebardata.category)),
    [categories, sidebardata.category]
  );
  const categoryPath = useMemo(() => {
    if (!selectedCategory) return [];
    const byId = new Map(categories.map((cat) => [String(cat._id), cat]));
    const ancestors = (selectedCategory.ancestors || [])
      .map((id) => byId.get(String(id)))
      .filter(Boolean);
    return [...ancestors, selectedCategory];
  }, [categories, selectedCategory]);
  const subCategories = useMemo(
    () =>
      selectedCategory
        ? categories.filter((cat) => String(cat.parentId) === String(selectedCategory._id))
        : categories.filter((cat) => !cat.parentId),
    [categories, selectedCategory]
  );

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("startIndex", startIndex);
    const searchQuery = urlParams.toString();

    try {
      const { data } = await apiClient.get(`/api/listing/get?${searchQuery}`);

      if (!Array.isArray(data) || data.length < 9) {
        setShowMore(false);
      }
      if (Array.isArray(data)) {
        setListings([...listings, ...data]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen bg-slate-50/50"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* القائمة الجانبية (Sidebar) */}
      <div
        className={`p-8 bg-white border-b md:border-b-0 w-full md:w-80 lg:w-96 shrink-0 shadow-sm 
                ${isRtl ? "md:border-l border-slate-200/80" : "md:border-r border-slate-200/80"}`}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-7 sticky top-6"
        >
          {/* حقل البحث الرئيسي */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 tracking-wide">
              {t("search.search_term")}
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder={t("search.placeholder")}
              className="border border-slate-200 rounded-xl p-3 w-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 bg-slate-50/40"
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          {/* شجرة التصنيفات: من الفئة الأب إلى فروعها */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide">
                {t("search.categories")}
              </label>
              <div className="border border-slate-200 rounded-xl p-2 bg-white">
                <CategoryBrowser
                  categories={categories}
                  selectedId={sidebardata.category}
                  onSelect={handleCategorySelect}
                />
              </div>
            </div>
          )}

          {/* فلاتر النوع: أزرار الـ Chips */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-slate-700 tracking-wide">
              {t("search.property_type")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: t("search.type_all") },
                { id: "rent", label: t("search.type_rent") },
                { id: "sale", label: t("search.type_sale") },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`text-xs font-semibold px-4 py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200
                                        ${
                                          sidebardata.type === item.id
                                            ? "bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-900/10"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                >
                  <input
                    type="checkbox"
                    id={item.id}
                    checked={sidebardata.type === item.id}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {item.label}
                </label>
              ))}

              {/* زر العروض المنفصل */}
              <label
                className={`text-xs font-semibold px-4 py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200
                                    ${
                                      sidebardata.offer
                                        ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
              >
                <input
                  type="checkbox"
                  id="offer"
                  checked={sidebardata.offer}
                  onChange={handleChange}
                  className="hidden"
                />
                {t("search.offer")}
              </label>
            </div>
          </div>

          {/* فلاتر المميزات الإضافية */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-slate-700 tracking-wide">
              {t("search.amenities")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "parking", label: t("search.parking") },
                { id: "furnished", label: t("search.furnished") },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`text-xs font-semibold px-4 py-2.5 rounded-full border cursor-pointer select-none transition-all duration-200
                                        ${
                                          sidebardata[item.id]
                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                >
                  <input
                    type="checkbox"
                    id={item.id}
                    checked={sidebardata[item.id]}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* خيارات الترتيب والفرز */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 tracking-wide">
              {t("search.sort_by")}
            </label>
            <select
              onChange={handleChange}
              value={`${sidebardata.sort}_${sidebardata.order}`}
              id="sort_order"
              className="border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 bg-slate-50/40 font-medium text-slate-700 cursor-pointer"
            >
              <option value="regularPrice_desc">
                {t("search.sort_price_desc")}
              </option>
              <option value="regularPrice_asc">
                {t("search.sort_price_asc")}
              </option>
              <option value="createdAt_desc">{t("search.sort_latest")}</option>
              <option value="createdAt_asc">{t("search.sort_oldest")}</option>
            </select>
          </div>

          {/* زر تطبيق الفلاتر */}
          <button className="bg-blue-600 text-white p-3.5 rounded-xl font-semibold uppercase hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/10 text-sm mt-2">
            {t("search.apply_btn")}
          </button>
        </form>
      </div>

      {/* قسم نتائج البحث */}
      <div className="flex-1 p-8 md:p-10">
        {/* مسار التصنيف (Breadcrumb) */}
        {categoryPath.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1.5 text-xs mb-2">
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className="text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
            >
              {t("search.all_categories")}
            </button>
            {categoryPath.map((cat, index) => (
              <span key={cat._id} className="flex items-center gap-1.5">
                <span className="text-slate-300">{isRtl ? "‹" : "›"}</span>
                {index === categoryPath.length - 1 ? (
                  <span className="font-semibold text-slate-700">{getCategoryLabel(cat, lang)}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className="text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
                  >
                    {getCategoryLabel(cat, lang)}
                  </button>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {selectedCategory ? getCategoryLabel(selectedCategory, lang) : t("search.results_title")}
          </h1>
          {selectedCategory?.listingCount !== undefined && (
            <span className="text-sm text-slate-400 font-medium shrink-0">
              {t("search.listings_count", { count: selectedCategory.listingCount })}
            </span>
          )}
        </div>

        {/* الفئات الفرعية كبطاقات أفقية قابلة للتمرير (للجوال، حيث القائمة الجانبية بعيدة) */}
        {subCategories.length > 0 && (
          <div className="md:hidden flex gap-3 overflow-x-auto pt-4 pb-1 -mx-1 px-1">
            {subCategories.map((cat) => {
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className="flex flex-col items-center gap-2 min-w-24 px-3 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CategoryIcon category={cat} className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700 text-center leading-tight">
                    {getCategoryLabel(cat, lang)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-8">
          {!loading && listings.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-lg text-slate-400 font-medium">
                {t("search.no_results")}
              </p>
            </div>
          )}

          {loading && (
            <div className="col-span-full py-12 text-center">
              <p className="text-lg text-blue-600 font-semibold animate-pulse">
                {t("search.loading")}
              </p>
            </div>
          )}

          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}
        </div>

        {showMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onShowMoreClick}
              className="text-sm bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-full font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              {t("search.show_more")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
