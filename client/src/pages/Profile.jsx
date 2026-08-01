import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getStorage,
  uploadBytesResumable,
  ref,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserFailure,
  signOutUserStart,
  signOutUserSuccess,
} from "../redux/user/userSlice";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";
import { useToast } from "../context/ToastContext"; // 👈 استخدام الـ Global Toast Hook
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaCamera,
  FaUser,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaPlus,
  FaEye,
} from "react-icons/fa";

function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [formData, setFormData] = useState({});
  const [userListings, setUserListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { showToast } = useToast(); // 👈 استدعاء التوست العالمي

  useEffect(() => {
    if (file) {
      handleFileUpdate(file);
    }
  }, [file]);

  useEffect(() => {
    if (currentUser?._id) {
      handleShowListings();
    }
  }, [currentUser?._id]);

  const handleFileUpdate = (fileToUpload) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + fileToUpload.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      () => {
        showToast(
          t("profile.upload_error", "خطأ في التحميل (الحد الأقصى 2 ميجابايت)"),
          "error"
        );
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData((prev) => ({ ...prev, avatar: downloadURL }));
          showToast(
            t("profile.upload_success", "تم تحميل الصورة بنجاح!"),
            "success"
          );
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());

      const cleanFormData = { ...formData };
      if (!cleanFormData.password) delete cleanFormData.password;

      const res = await fetch(
        `${API_BASE_URL}/api/user/update/${currentUser._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(cleanFormData),
        }
      );
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        showToast(data.message, "error");
        return;
      }
      dispatch(updateUserSuccess(data));
      showToast(
        t("profile.update_success_msg", "تم تحديث الملف الشخصي بنجاح!"),
        "success"
      );
    } catch (error) {
      dispatch(updateUserFailure(error.message));
      showToast(error.message, "error");
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(
        `${API_BASE_URL}/api/user/delete/${currentUser._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        showToast(data.message, "error");
        return;
      }
      dispatch(deleteUserSuccess(data));
      showToast(
        t("profile.account_deleted", "تم حذف الحساب بنجاح"),
        "success"
      );
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
      showToast(error.message, "error");
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch(`${API_BASE_URL}/api/auth/signout`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        showToast(data.message, "error");
        return;
      }
      dispatch(signOutUserSuccess(data));
      showToast(
        t("profile.sign_out_success", "تم تسجيل الخروج بنجاح"),
        "success"
      );
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
      showToast(error.message, "error");
    }
  };

  const handleShowListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/user/listings/${currentUser._id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success === false) {
        showToast(
          t("profile.listings_error", "حدث خطأ أثناء تحميل العقارات"),
          "error"
        );
        setLoadingListings(false);
        return;
      }
      setUserListings(data);
      setLoadingListings(false);
    } catch (error) {
      showToast(
        t("profile.listings_error", "حدث خطأ أثناء تحميل العقارات"),
        "error"
      );
      setLoadingListings(false);
    }
  };

  const handleListingDelete = async () => {
    if (!listingToDelete) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/listing/delete/${listingToDelete}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success === false) {
        showToast(data.message, "error");
        setShowDeleteModal(false);
        return;
      }
      setUserListings((prev) =>
        prev.filter((listing) => listing._id !== listingToDelete)
      );
      setShowDeleteModal(false);
      showToast(
        t("profile.delete_listing_success", "تم حذف العقار بنجاح!"),
        "success"
      );
      setListingToDelete(null);
    } catch (error) {
      setShowDeleteModal(false);
      showToast(error.message, "error");
    }
  };

  const filteredListings = userListings.filter((listing) => {
    if (activeTab === "active")
      return listing.status === "active" || listing.isApproved === true;
    if (activeTab === "pending")
      return (
        listing.status === "pending_approval" ||
        (!listing.status && listing.isApproved === false)
      );
    if (activeTab === "rejected") return listing.status === "rejected";
    return true;
  });

  const renderBadge = (listing) => {
    if (listing.status === "active" || listing.isApproved === true) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
          <FaCheckCircle className="text-[11px]" />
          {t("profile.status_active", "مقبول")}
        </span>
      );
    }
    if (listing.status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
          <FaTimesCircle className="text-[11px]" />
          {t("profile.status_rejected", "مرفوض")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
        <FaClock className="text-[11px]" />
        {t("profile.status_pending", "قيد المراجعة")}
      </span>
    );
  };

  const stats = {
    all: userListings.length,
    active: userListings.filter(
      (i) => i.status === "active" || i.isApproved === true
    ).length,
    pending: userListings.filter(
      (i) =>
        i.status === "pending_approval" ||
        (!i.status && i.isApproved === false)
    ).length,
    rejected: userListings.filter((i) => i.status === "rejected").length,
  };

  return (
    <div
      className="bg-slate-50/60 min-h-screen py-10 px-4 md:px-8 font-sans antialiased"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header & Stats Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-slate-900/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div
            className={`absolute ${
              isRtl ? "-left-10" : "-right-10"
            } -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none`}
          />

          <div className="z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t("profile.title", "إعدادات الملف الشخصي")}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {t(
                "profile.subtitle",
                "إدارة تفاصيل حسابك وقائمة العقارات الخاصة بك."
              )}
            </p>
          </div>

          <div className="z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 w-full md:w-auto justify-around">
            <div className="px-4 text-center">
              <span className="block text-2xl font-extrabold text-indigo-400">
                {stats.all}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                {t("profile.tab_all", "الكل")}
              </span>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div className="px-4 text-center">
              <span className="block text-2xl font-extrabold text-emerald-400">
                {stats.active}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                {t("profile.tab_active", "المقبولة")}
              </span>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div className="px-4 text-center">
              <span className="block text-2xl font-extrabold text-amber-400">
                {stats.pending}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                {t("profile.tab_pending", "قيد الانتظار")}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Edit Profile */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6 relative">
            <div className="flex flex-col items-center gap-3 relative">
              <input
                onChange={(e) => setFile(e.target.files[0])}
                type="file"
                ref={fileRef}
                hidden
                accept="image/*"
              />

              <div
                className="relative group cursor-pointer"
                onClick={() => fileRef.current.click()}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl border-4 border-white ring-4 ring-indigo-50/80 transition-all duration-300 group-hover:ring-indigo-200">
                  <img
                    src={formData.avatar || currentUser?.avatar}
                    alt="profile"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div
                  className={`absolute bottom-1 ${
                    isRtl ? "left-1" : "right-1"
                  } bg-indigo-600 text-white p-2 rounded-full shadow-lg group-hover:bg-indigo-700 transition-colors`}
                >
                  <FaCamera className="text-xs" />
                </div>
              </div>

              <div className="text-xs font-semibold text-center">
                {filePerc > 0 && filePerc < 100 ? (
                  <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{`${t(
                    "profile.uploading",
                    "جاري التحميل"
                  )} ${filePerc}%`}</span>
                ) : (
                  <span className="text-slate-400 font-medium text-[11px]">
                    {t(
                      "profile.upload_hint",
                      "اضغط على الصورة لتغيير الصورة الشخصية"
                    )}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                  <FaUser className="text-slate-400 text-[11px]" />
                  <span>{t("profile.username", "اسم المستخدم")}</span>
                </label>
                <input
                  type="text"
                  placeholder={t(
                    "profile.username_placeholder",
                    "اسم المستخدم"
                  )}
                  defaultValue={currentUser?.username}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50/30"
                  onChange={handleChange}
                  id="username"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                  <FaEnvelope className="text-slate-400 text-[11px]" />
                  <span>{t("profile.email", "البريد الإلكتروني")}</span>
                </label>
                <input
                  type="email"
                  placeholder={t(
                    "profile.email_placeholder",
                    "البريد الإلكتروني"
                  )}
                  defaultValue={currentUser?.email}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50/30"
                  onChange={handleChange}
                  id="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                  <FaLock className="text-slate-400 text-[11px]" />
                  <span>{t("profile.password", "كلمة المرور")}</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50/30"
                  onChange={handleChange}
                  id="password"
                />
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  disabled={loading}
                  className="bg-indigo-600 text-white rounded-xl py-3.5 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.99] text-sm disabled:opacity-70 cursor-pointer"
                >
                  {loading
                    ? t("profile.saving", "جاري الحفظ...")
                    : t("profile.update_btn", "تحديث البيانات")}
                </button>

                <Link
                  className="bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99] text-sm flex items-center justify-center gap-2"
                  to={"/create-listing"}
                >
                  <FaPlus className="text-xs" />
                  <span>{t("profile.create_btn", "إضافة عقار جديد")}</span>
                </Link>
              </div>
            </form>

            <div className="flex justify-between items-center border-t border-slate-100 pt-5 text-xs font-bold">
              <button
                onClick={() => {
                  setListingToDelete(null);
                  setShowDeleteModal(true);
                }}
                className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                {t("profile.delete_account", "حذف الحساب")}
              </button>
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {t("profile.sign_out", "تسجيل الخروج")}
              </button>
            </div>
          </div>

          {/* Right Panel: Listings */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6 min-h-[450px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FaBuilding className="text-indigo-600" />
                  <span>{t("profile.listings_title", "عقاراتي")}</span>
                </h2>

                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                  {[
                    {
                      key: "all",
                      label: t("profile.tab_all", "الكل"),
                      count: stats.all,
                    },
                    {
                      key: "active",
                      label: t("profile.tab_active", "المقبولة"),
                      count: stats.active,
                    },
                    {
                      key: "pending",
                      label: t("profile.tab_pending", "قيد الانتظار"),
                      count: stats.pending,
                    },
                    {
                      key: "rejected",
                      label: t("profile.tab_rejected", "المرفوضة"),
                      count: stats.rejected,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === tab.key
                          ? "bg-white text-slate-900 shadow-md shadow-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Skeleton Loader State */}
              {loadingListings ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white"
                    >
                      <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto flex-1">
                        <div className="h-20 w-24 bg-slate-200 rounded-xl shrink-0" />
                        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                          <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                          <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                          <div className="flex items-center gap-3 mt-1">
                            <div className="h-5 bg-slate-200 rounded-full w-16" />
                            <div className="h-3 bg-slate-200 rounded-md w-10" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                        <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                        <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <FaBuilding className="text-4xl text-slate-300" />
                  <p className="text-slate-400 font-semibold text-sm">
                    {t(
                      "profile.no_listings",
                      "لا توجد عقارات في هذه الفئة."
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing._id}
                      className="group border border-slate-100 hover:border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 bg-white hover:shadow-lg hover:shadow-indigo-500/5"
                    >
                      <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                        <Link
                          to={`/listing/${listing._id}`}
                          className="shrink-0 overflow-hidden rounded-xl relative"
                        >
                          <img
                            src={
                              listing.imageUrls?.[0] ||
                              "https://via.placeholder.com/150"
                            }
                            alt="cover"
                            className="h-20 w-24 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                          <Link
                            to={`/listing/${listing._id}`}
                            className="text-base font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate"
                          >
                            {listing.name}
                          </Link>
                          {listing.address && (
                            <p className="text-xs text-slate-400 truncate">
                              {listing.address}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {renderBadge(listing)}
                            {listing.views !== undefined && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                <FaEye className="text-slate-300" />{" "}
                                {listing.views}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                        <Link to={`/update-listing/${listing._id}`}>
                          <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer">
                            <FaEdit className="text-slate-500" />
                            <span>{t("profile.edit", "تعديل")}</span>
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            setListingToDelete(listing._id);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <FaTrash className="text-rose-500" />
                          <span>{t("profile.delete", "حذف")}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-xl text-slate-900">
              {t("profile.modal_title", "تأكيد الحذف")}
            </h3>
            <p className="text-sm text-slate-500 my-4 leading-relaxed">
              {listingToDelete
                ? t(
                    "profile.modal_desc_listing",
                    "هل أنت تأكد من أنك تريد حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء."
                  )
                : t(
                    "profile.modal_desc_account",
                    "هل أنت تأكد من أنك تريد حذف حسابك؟ سيتم إزالة جميع بياناتك نهائياً."
                  )}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                {t("profile.modal_cancel", "إلغاء")}
              </button>
              <button
                onClick={
                  listingToDelete ? handleListingDelete : handleDeleteUser
                }
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                {t("profile.modal_confirm", "نعم، احذف")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;