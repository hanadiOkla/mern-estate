import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AdminSidebar from "../components/AdminSidebar";
import ConfirmModal from "../components/ConfirmModal";
import Modal from "../components/Modal";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();

  // 1. إدارة التبويب عبر URL Search Params
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "listings";

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // State
  const [pendingListings, setPendingListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);
  const [errorCategories, setErrorCategories] = useState(null);

  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    nameAr: "",
    nameEn: "",
    slug: "",
  });
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    user: null,
    isDanger: false,
    message: "",
  });

  const isRtl = i18n.dir() === "rtl" || i18n.language?.startsWith("ar");

  // Fetch Pending Listings
  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        setLoadingListings(true);
        const res = await fetch("/api/listing/pending");
        const data = await res.json();
        if (data.success !== false) {
          setPendingListings(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchPendingListings();
  }, []);

  // Fetch Users عند تحويل التبويب
  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  // Fetch Categories عند تحويل التبويب
  useEffect(() => {
    if (activeTab === "categories" && categories.length === 0) {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setErrorCategories(null);
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
      } else {
        setErrorCategories(data.message || t("admin.loading_error"));
      }
    } catch (error) {
      setErrorCategories(t("admin.network_error"));
      console.log(error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrorUsers(null);
      const res = await fetch("/api/user/all");
      const data = await res.json();

      if (data.success === false) {
        setErrorUsers(data.message || t("admin.loading_error"));
      } else {
        setUsers(data);
      }
    } catch (error) {
      setErrorUsers(t("admin.network_error"));
      console.log(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // موافقة أو رفض الإعلان
  const handleAction = async (listingId, actionType) => {
    try {
      const res = await fetch(`/api/listing/approve/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });

      const data = await res.json();

      if (data.success !== false) {
        setPendingListings((prev) =>
          prev.filter((item) => item._id !== listingId),
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // تبديل حالة الفئة (Active / Inactive)
  const handleToggleCategoryStatus = async (categoryId) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}/toggle`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === categoryId ? { ...cat, isActive: !cat.isActive } : cat,
          ),
        );
      } else {
        alert(data.message || "فشل تغيير حالة الفئة");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // حذف الفئة
  const handleDeleteCategory = async (categoryId) => {
    if (
      !window.confirm(
        t(
          "admin.confirm_delete_category",
          "هل أنت تأكد من رغبتك في حذف هذه الفئة؟",
        ),
      )
    )
      return;
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      } else {
        alert(data.message || "تعذر حذف الفئة");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryModalError("");
    setNewCategoryData({ nameAr: "", nameEn: "", slug: "" });
  };

  // إضافة فئة جديدة
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryModalError("");

    if (!newCategoryData.nameAr && !newCategoryData.nameEn) {
      setCategoryModalError("يرجى أدخال اسم الفئة بلغة واحدة على الأقل");
      return;
    }

    try {
      setCategorySubmitting(true);
      const res = await fetch("/api/categories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: {
            ar: newCategoryData.nameAr,
            en: newCategoryData.nameEn || newCategoryData.nameAr,
          },
          slug: newCategoryData.slug || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setCategories((prev) => [data.category || data, ...prev]);
        handleCloseCategoryModal();
      } else {
        setCategoryModalError(data.message || "فشل إضافة الفئة الجديدة");
      }
    } catch (error) {
      console.log(error);
      setCategoryModalError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setCategorySubmitting(false);
    }
  };

  // فتح المودال مع نص الترجمة المناسب
  const openConfirmModal = (user) => {
    const isUserAdmin = user.isAdmin || user.role === "admin";
    setModalConfig({
      isOpen: true,
      user,
      isDanger: isUserAdmin,
      message: isUserAdmin
        ? t("admin.confirm_demote_msg", { username: user.username })
        : t("admin.confirm_promote_msg", { username: user.username }),
    });
  };

  // تنفيذ ترقية/إلغاء صلاحية المستخدم
  const handleConfirmToggleAdmin = async () => {
    const { user } = modalConfig;
    if (!user) return;

    try {
      setUpdatingUserId(user._id);

      const res = await fetch(`/api/user/toggle-admin/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success !== false) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id
              ? { ...u, isAdmin: data.isAdmin, role: data.role }
              : u,
          ),
        );
      } else {
        alert(data.message || t("admin.error_updating"));
      }
    } catch (error) {
      console.log(error);
      alert(t("admin.network_error"));
    } finally {
      setUpdatingUserId(null);
      setModalConfig({
        isOpen: false,
        user: null,
        isDanger: false,
        message: "",
      });
    }
  };

  // Pagination Logic
  const currentData =
    activeTab === "listings"
      ? pendingListings
      : activeTab === "users"
        ? users
        : categories;

  const totalPages = Math.ceil(currentData.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentData.length, totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = currentData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div
      className="min-h-[calc(100vh-160px)] bg-slate-50/50"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          pendingCount={pendingListings.length}
        />

        <main className="flex-1 min-w-0">
          {/* 1. قائمة الإعلانات المعلقة */}
          {activeTab === "listings" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>{t("admin.pending_listings_tab")}</span>
                <span className="text-xs font-normal text-slate-400">
                  Total: {pendingListings.length}
                </span>
              </h3>

              {loadingListings ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : pendingListings.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">
                    {t("admin.no_pending")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {paginatedData.map((listing) => (
                    <div
                      key={listing._id}
                      className="border border-slate-200/70 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            listing.imageUrls?.[0] ||
                            "https://via.placeholder.com/150"
                          }
                          alt={listing.name}
                          className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                            {listing.name}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-1 my-0.5">
                            {listing.address}
                          </p>
                          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                            $
                            {listing.regularPrice
                              ? listing.regularPrice.toLocaleString()
                              : 0}
                            {listing.type === "rent" &&
                              ` ${t("admin.per_month")}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                        <Link
                          to={`/listing/${listing._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          {t("admin.preview")}
                        </Link>
                        <button
                          onClick={() => handleAction(listing._id, "approve")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          {t("admin.approve")}
                        </button>
                        <button
                          onClick={() => handleAction(listing._id, "reject")}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          {t("admin.reject")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. جدول إدارة المستخدمين */}
          {activeTab === "users" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base">
                  {t("admin.users_tab")}
                </h3>
                <span className="text-xs font-normal text-slate-400">
                  Total: {users.length}
                </span>
              </div>

              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : errorUsers ? (
                <div className="text-center py-8 text-rose-600 m-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="font-semibold text-sm">{errorUsers}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200/80">
                      <tr>
                        <th
                          className={`py-3.5 px-5 ${isRtl ? "text-right" : "text-left"}`}
                        >
                          {t("admin.user")}
                        </th>
                        <th
                          className={`py-3.5 px-5 ${isRtl ? "text-right" : "text-left"}`}
                        >
                          {t("admin.email")}
                        </th>
                        <th className="py-3.5 px-5 text-center">
                          {t("admin.role")}
                        </th>
                        <th className="py-3.5 px-5 text-center">
                          {t("admin.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedData.map((user) => {
                        const isUserAdmin =
                          user.isAdmin || user.role === "admin";
                        const isUpdating = updatingUserId === user._id;

                        return (
                          <tr
                            key={user._id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3 px-5 font-bold text-slate-800 flex items-center gap-3">
                              <img
                                src={
                                  user.avatar ||
                                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                }
                                alt={user.username}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <span className="truncate max-w-[140px]">
                                {user.username}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-slate-500 font-mono text-xs">
                              {user.email}
                            </td>
                            <td className="py-3 px-5 text-center">
                              {isUserAdmin ? (
                                <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200/60">
                                  {t("admin.role_admin")}
                                </span>
                              ) : (
                                <span className="inline-block bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                                  {t("admin.role_user")}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <button
                                onClick={() => openConfirmModal(user)}
                                disabled={isUpdating}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                  isUpdating ? "opacity-50 cursor-wait" : ""
                                } ${
                                  isUserAdmin
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                                    : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                                }`}
                              >
                                {isUpdating ? (
                                  <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                                ) : isUserAdmin ? (
                                  t("admin.demote_admin")
                                ) : (
                                  t("admin.promote_admin")
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. جدول إدارة الفئات */}
          {activeTab === "categories" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    إدارة الفئات (Categories)
                  </h3>
                  <span className="text-xs font-normal text-slate-400">
                    العدد الإجمالي: {categories.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  + إضافة فئة جديدة
                </button>
              </div>

              {loadingCategories ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : errorCategories ? (
                <div className="text-center py-8 text-rose-600 m-4 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="font-semibold text-sm">{errorCategories}</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 m-4">
                  <p className="text-slate-500 font-medium">
                    {t("admin.no_categories", "No categories found")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200/80">
                      <tr>
                        <th
                          className={`py-3.5 px-5 ${isRtl ? "text-right" : "text-left"}`}
                        >
                          NAME
                        </th>
                        <th
                          className={`py-3.5 px-5 ${isRtl ? "text-right" : "text-left"}`}
                        >
                          SLUG
                        </th>
                        <th className="py-3.5 px-5 text-center">STATUS</th>
                        <th className="py-3.5 px-5 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedData.map((category) => {
                        const categoryName =
                          typeof category.name === "object"
                            ? category.name[i18n.language] ||
                              category.name.ar ||
                              category.name.en ||
                              ""
                            : category.name || "";

                        const categorySlug =
                          category.slug ||
                          categoryName.toLowerCase().replace(/\s+/g, "-");
                        const isActive = category.isActive ?? true;

                        return (
                          <tr
                            key={category._id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3 px-5 font-bold text-slate-800">
                              {categoryName}
                            </td>
                            <td className="py-3 px-5 text-slate-500 font-mono text-xs">
                              {categorySlug}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <span
                                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {isActive ? "نشط" : "معطل"}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleCategoryStatus(category._id)
                                  }
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  {isActive ? "تعطيل" : "تفعيل"}
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCategory(category._id)
                                  }
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Controls الـ Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 mt-4 shadow-sm">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isRtl ? "← السابق" : "← Previous"}
              </button>

              <span className="text-xs font-bold text-slate-600">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isRtl ? "التالي →" : "Next →"}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* مودال إضافة فئة جديدة */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={handleCloseCategoryModal}
          title="إضافة فئة جديدة"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            {categoryModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium">
                {categoryModalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الفئة (بالعربية) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: شقق سكنيّ"
                value={newCategoryData.nameAr}
                onChange={(e) =>
                  setNewCategoryData({
                    ...newCategoryData,
                    nameAr: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الفئة (بالإنكليزية)
              </label>
              <input
                type="text"
                placeholder="e.g., Apartments"
                value={newCategoryData.nameEn}
                onChange={(e) =>
                  setNewCategoryData({
                    ...newCategoryData,
                    nameEn: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseCategoryModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={categorySubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                {categorySubmitting ? "جاري الإضافة..." : "حفظ الفئة"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmToggleAdmin}
        title={t("admin.confirm_role_change")}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
        isLoading={Boolean(updatingUserId)}
      />
    </div>
  );
}