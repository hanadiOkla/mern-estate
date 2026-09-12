import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  flattenWithDepth,
  getDescendantIds,
  getCategoryLabel,
} from "../../utils/categoryTree";

const DEFAULT_CLASS =
  "border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-500 transition-all bg-slate-50/20 text-slate-700 font-medium";

// قائمة منسدلة تعرض التصنيفات بترتيب هرمي مع إزاحة (indentation) تعكس المستوى،
// مثال: "سيارات" ثم تحتها "— سيارات فاخرة" ثم "—— مرسيدس"
export default function CategorySelect({
  categories = [],
  value,
  onChange,
  excludeId, // استبعاد فئة معينة وكل فروعها (يُستخدم عند اختيار الأب لمنع المرجعية الدائرية)
  placeholder,
  id,
  required = false,
  disabled = false,
  className,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const options = useMemo(() => {
    const excluded = excludeId
      ? new Set([String(excludeId), ...getDescendantIds(categories, excludeId)])
      : null;

    const ordered = flattenWithDepth(categories);
    return excluded ? ordered.filter((cat) => !excluded.has(String(cat._id))) : ordered;
  }, [categories, excludeId]);

  return (
    <select
      id={id}
      value={value || ""}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={className || DEFAULT_CLASS}
    >
      <option value="">
        {placeholder ?? t("category_select.placeholder", "-- اختر التصنيف --")}
      </option>
      {options.map((cat) => (
        <option key={cat._id} value={cat._id}>
          {"— ".repeat(cat.depth)}
          {getCategoryLabel(cat, lang)}
        </option>
      ))}
    </select>
  );
}
