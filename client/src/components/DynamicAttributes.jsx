import React from "react";
import { useTranslation } from "react-i18next";

export default function DynamicAttributes({
  // الخصائص العامة
  attributes = [], // القائمة القادمة من الفئة Category.attributes
  mode = "form", // إما "form" للإدخال أو "view" للعرض

  // الخصائص المخصصة لـ Mode: Form
  formData = {},
  setFormData,

  // الخصائص المخصصة لـ Mode: View
  attributesMap = {},
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language?.startsWith("ar") ? "ar" : "en";

  // ----------------------------------------------------
  // 1. دالة معالجة الترجمة الشاملة (Labels & Values)
  // ----------------------------------------------------
  const getTranslatedValue = (rawInput) => {
    if (rawInput === null || rawInput === undefined || rawInput === "")
      return "";

    // أ) إذا كان الكائن يحتوي على ترجمات جاهزة { ar: '...', en: '...' } أو يحتوي label
    if (typeof rawInput === "object") {
      const targetObj = rawInput.label ? rawInput.label : rawInput;
      if (typeof targetObj === "object") {
        return (
          targetObj[currentLang] ||
          targetObj.ar ||
          targetObj.en ||
          targetObj.value ||
          ""
        );
      }
      return String(targetObj);
    }

    const strInput = String(rawInput);

    // ب) البحث في i18n المباشر أو المحسب ببادئة listing.
    const keyWithPrefix = `listing.${strInput}`;
    if (t(keyWithPrefix) !== keyWithPrefix) return t(keyWithPrefix);
    if (t(strInput) !== strInput) return t(strInput);

    // ج) Fallback: تنظيف المفاتيح النصية (مثال: property_type -> Property Type)
    if (strInput.includes("_")) {
      return strInput
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return strInput;
  };

  // ----------------------------------------------------
  // 2. تحديث قيم المدخلات (Mode: Form)
  // ----------------------------------------------------
  const handleAttributeChange = (key, value) => {
    if (!setFormData) return;
    setFormData((prev) => ({
      ...prev,
      attributesMap: {
        ...(prev.attributesMap || {}),
        [key]: value,
      },
    }));
  };

  // ----------------------------------------------------
  // 3. وضع العرض فقط (Mode: View) - لصفحة تفاصيل الإعلان
  // ----------------------------------------------------
  if (mode === "view") {
    const targetMap = attributesMap || formData?.attributesMap || {};
    if (!targetMap || Object.keys(targetMap).length === 0) return null;

    return (
      <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 my-4 flex flex-col gap-3">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
          {t("listing.specifications_title", "المواصفات والخصائص")}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(targetMap).map(([key, val], idx) => {
            if (val === undefined || val === null || val === "") return null;

            const matchedSchema = attributes.find(
              (attr) => (attr.key || attr._id || attr.name) === key
            );

            const label = matchedSchema
              ? getTranslatedValue(
                  matchedSchema.label || matchedSchema.name || key
                )
              : getTranslatedValue(key);

            let displayValue = val;

            if (typeof val === "boolean") {
              displayValue = val ? t("yes", "نعم") : t("no", "لا");
            } else if (matchedSchema?.options) {
              const selectedOption = matchedSchema.options.find(
                (opt) => (typeof opt === "object" ? opt.value : opt) === val
              );
              displayValue = selectedOption
                ? getTranslatedValue(selectedOption)
                : getTranslatedValue(val);
            } else {
              displayValue = getTranslatedValue(val);
            }

            return (
              <div
                key={`${key}_${idx}`}
                className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm"
              >
                <span className="text-[11px] font-medium text-slate-400">
                  {label}
                </span>
                <span className="text-sm font-bold text-slate-700 truncate">
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 4. وضع الإدخال والتعديل (Mode: Form)
  // ----------------------------------------------------
  if (!attributes || attributes.length === 0) return null;

  return (
    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 my-2 flex flex-col gap-4">
      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
        {t("listing.specifications_title", "المواصفات والخصائص")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {attributes.map((attr, index) => {
          const attrKey =
            attr.key || attr._id || attr.id || attr.name || `attr_${index}`;
          const label = getTranslatedValue(attr.label || attr.name || attrKey);
          const currentValue = formData?.attributesMap?.[attrKey] ?? "";

          // أ) القائمة المنسدلة (Select)
          if (attr.type === "select" && attr.options) {
            return (
              <div key={attrKey} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {label}{" "}
                  {attr.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={currentValue}
                  onChange={(e) =>
                    handleAttributeChange(attrKey, e.target.value)
                  }
                  required={attr.required}
                  className="border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-700"
                >
                  {/* ✅ تم ضبط الخيار الافتراضي بالترجمة المباشرة لضمان عدم مرورها عبر getTranslatedValue */}
                  <option value="">
                    {currentLang === "ar" ? "-- اختر --" : "-- Select --"}
                  </option>
                  {attr.options.map((opt, optIdx) => {
                    const optLabel = getTranslatedValue(opt);
                    const optVal =
                      typeof opt === "object" ? opt.value || optLabel : opt;

                    return (
                      <option key={`${optVal}_${optIdx}`} value={optVal}>
                        {optLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          }

          // ب) خيار الاختيار (Checkbox / Boolean)
          if (attr.type === "boolean" || attr.type === "checkbox") {
            return (
              <div key={attrKey} className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2.5 bg-white px-4 py-3 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors shadow-sm select-none w-full">
                  <input
                    type="checkbox"
                    checked={Boolean(currentValue)}
                    onChange={(e) =>
                      handleAttributeChange(attrKey, e.target.checked)
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                  </span>
                </label>
              </div>
            );
          }

          // ج) الحقول النصية والرقمية (Text / Number)
          return (
            <div key={attrKey} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                {label}{" "}
                {attr.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={attr.type === "number" ? "number" : "text"}
                value={currentValue}
                placeholder={label}
                min={attr.min}
                max={attr.max}
                required={attr.required}
                onChange={(e) =>
                  handleAttributeChange(
                    attrKey,
                    attr.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : +e.target.value
                      : e.target.value
                  )
                }
                className="border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:border-blue-500 transition-all text-slate-700 font-medium"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}