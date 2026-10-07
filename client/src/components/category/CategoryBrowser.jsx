import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { getCategoryLabel } from "../../utils/categoryTree";
import { CategoryIcon } from "../../utils/categoryIcons";

function CountBadge({ count }) {
  if (count === undefined) return null;
  return <span className="text-xs text-slate-400 font-medium tabular-nums shrink-0">{count}</span>;
}

// متصفح تصنيفات بنمط "التنقّل التدريجي" (drill-down) المعتمد في المتاجر الكبرى:
// يعرض مسار الأجداد للرجوع، ثم الفئة الحالية، ثم فروعها المباشرة فقط بدل شجرة كاملة متداخلة.
// اختيار أي فئة يعرض إعلاناتها وإعلانات كل فروعها (onSelect)
export default function CategoryBrowser({ categories = [], selectedId, onSelect }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  const isRtl = i18n.dir() === "rtl";
  const BackIcon = isRtl ? HiChevronRight : HiChevronLeft;
  const ForwardIcon = isRtl ? HiChevronLeft : HiChevronRight;

  const { path, selected, items } = useMemo(() => {
    const byId = new Map(categories.map((cat) => [String(cat._id), cat]));
    const childrenOf = (id) =>
      categories.filter((cat) => (cat.parentId ? String(cat.parentId) : null) === (id ? String(id) : null));

    const current = selectedId ? byId.get(String(selectedId)) : null;
    if (!current) return { path: [], selected: null, items: childrenOf(null) };

    const ancestors = (current.ancestors || []).map((id) => byId.get(String(id))).filter(Boolean);
    const children = childrenOf(current._id);
    // فئة بلا فروع: نعرض أشقاءها تحت الأب مع تمييز المختارة، حتى يبقى التنقل الجانبي ممكناً
    if (children.length === 0 && ancestors.length > 0) {
      return { path: ancestors, selected: current, items: childrenOf(current.parentId) };
    }
    return { path: [...ancestors, current], selected: current, items: children };
  }, [categories, selectedId]);

  if (categories.length === 0) return null;

  return (
    <nav className="flex flex-col text-sm">
      {selected && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex items-center gap-1 py-1.5 text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
        >
          <BackIcon className="w-4 h-4 shrink-0" />
          {t("search.all_categories")}
        </button>
      )}

      {path.map((cat, index) => {
        const isCurrent = String(cat._id) === String(selected?._id);
        return (
          <button
            key={cat._id}
            type="button"
            onClick={() => onSelect(cat)}
            style={{ [isRtl ? "paddingRight" : "paddingLeft"]: index * 12 }}
            className={`flex items-center justify-between gap-2 py-1.5 text-start cursor-pointer ${
              isCurrent ? "font-bold text-slate-900" : "font-medium text-slate-500 hover:text-blue-600"
            }`}
          >
            <span className="flex items-center gap-1 min-w-0">
              {!isCurrent && <BackIcon className="w-4 h-4 shrink-0" />}
              <span className="truncate">{getCategoryLabel(cat, lang)}</span>
            </span>
            {isCurrent && <CountBadge count={cat.listingCount} />}
          </button>
        );
      })}

      <ul
        className={`flex flex-col gap-0.5 ${selected ? "mt-1" : ""}`}
        style={{ [isRtl ? "paddingRight" : "paddingLeft"]: path.length * 12 }}
      >
        {items.map((cat) => {
          const isActive = String(cat._id) === String(selected?._id);
          const hasChildren = categories.some((c) => String(c.parentId) === String(cat._id));
          return (
            <li key={cat._id}>
              <button
                type="button"
                onClick={() => onSelect(cat)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-start cursor-pointer transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {!selected && <CategoryIcon category={cat} className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className="truncate">{getCategoryLabel(cat, lang)}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <CountBadge count={cat.listingCount} />
                  {hasChildren && <ForwardIcon className="w-4 h-4 text-slate-300" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
