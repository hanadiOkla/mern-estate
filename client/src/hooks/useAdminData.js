import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../api/apiClient";

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
        const { data } = await apiClient.get("/api/listing/pending");

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
      const { data } = await apiClient.get("/api/user/all");

      if (data.success === false) {
        setErrorUsers(data.message || t("admin.loading_error"));
      } else {
        const usersArray = Array.isArray(data)
          ? data
          : data.users || data.data || [];
        setUsers(usersArray);
      }
    } catch (error) {
      setErrorUsers(error.response?.data?.message || t("admin.network_error"));
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
      const { data } = await apiClient.get("/api/categories/admin/all");

      // استخراج المصفوفة مهما كان شكل التغليف من الـ API
      const categoriesArray = Array.isArray(data)
        ? data
        : data.categories || data.data || [];

      setCategories(categoriesArray);
    } catch (error) {
      setErrorCategories(error.response?.data?.message || t("admin.network_error"));
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
      await apiClient.delete(`/api/categories/${catId}`);
      setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId));
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
    }
  };

  // دالة تغيير حالة الفئة (نشط / معطل)
  const handleToggleCategoryStatus = async (catId, currentStatus) => {
    try {
      await apiClient.put(`/api/categories/${catId}`, {
        isActive: !currentStatus,
      });
      setCategories((prev) =>
        prev.map((c) =>
          (c._id || c.id) === catId ? { ...c, isActive: !currentStatus } : c
        )
      );
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
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