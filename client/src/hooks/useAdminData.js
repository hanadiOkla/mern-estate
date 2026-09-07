import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useAdminData(activeTab) {
  const { t } = useTranslation();

  const [pendingListings, setPendingListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [errorUsers, setErrorUsers] = useState(null);
  const [errorCategories, setErrorCategories] = useState(null);

  // 1. Fetch Pending Listings
  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        setLoadingListings(true);
        const res = await fetch("/api/listing/pending");
        const data = await res.json();
        
        if (data.success !== false) {
          const listingsArray = Array.isArray(data)
            ? data
            : data.listings || data.data || [];
          setPendingListings(listingsArray);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchPendingListings();
  }, []);

  // 2. Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setErrorUsers(null);
      const res = await fetch("/api/user/all");
      const data = await res.json();

      if (data.success === false) {
        setErrorUsers(data.message || t("admin.loading_error"));
      } else {
        const usersArray = Array.isArray(data)
          ? data
          : data.users || data.data || [];
        setUsers(usersArray);
      }
    } catch (error) {
      setErrorUsers(t("admin.network_error"));
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // 3. Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setErrorCategories(null);
      const res = await fetch("/api/categories/admin/all");
      const data = await res.json();

      if (res.ok) {
        // استخراج المصفوفة مهما كان شكل التغليف من الـ API
        const categoriesArray = Array.isArray(data)
          ? data
          : data.categories || data.data || [];
          
        setCategories(categoriesArray);
      } else {
        setErrorCategories(data.message || t("admin.loading_error"));
      }
    } catch (error) {
      setErrorCategories(t("admin.network_error"));
      console.error(error);
    } finally {
      setLoadingCategories(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    }
  }, [activeTab, fetchCategories]);

  // --- Actions ---

  // دالة الحذف النهائي من قاعدة البيانات والـ State
  const handleDeleteCategory = async (catId) => {
    try {
      const res = await fetch(`/api/categories/${catId}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId));
      } else {
        const data = await res.json();
        console.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // دالة تغيير حالة الفئة (نشط / معطل)
  const handleToggleCategoryStatus = async (catId, currentStatus) => {
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            (c._id || c.id) === catId ? { ...c, isActive: !currentStatus } : c
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    pendingListings,
    setPendingListings,
    users,
    setUsers,
    categories,
    setCategories,

    loadingListings,
    loadingUsers,
    loadingCategories,

    errorUsers,
    errorCategories,

    handleDeleteCategory,
    handleToggleCategoryStatus,
    refetchCategories: fetchCategories,
    refetchUsers: fetchUsers,
  };
}