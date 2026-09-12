import { useState } from "react";
import { useTranslation } from "react-i18next";
import { buildCategoryTree, getCategoryLabel } from "../../utils/categoryTree";

function ChevronIcon({ expanded }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CategoryNode({ node, depth, lang, isRtl, onAddChild, onToggleStatus, onDelete }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children?.length > 0;
  const isActive = node.isActive ?? true;

  return (
    <div>
      <div
        className={`flex items-center justify-between gap-2 py-2.5 group ${depth > 0 ? (isRtl ? "pr-6 border-r-2 border-slate-100" : "pl-6 border-l-2 border-slate-100") : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label="toggle"
            className={`w-5 h-5 flex items-center justify-center shrink-0 rounded text-slate-400 hover:bg-slate-100 ${
              hasChildren ? "cursor-pointer" : "invisible"
            }`}
          >
            <ChevronIcon expanded={expanded} />
          </button>

          <span
            className={`text-sm font-bold truncate ${isActive ? "text-slate-800" : "text-slate-400 line-through"}`}
          >
            {getCategoryLabel(node, lang)}
          </span>
          <span className="text-[11px] text-slate-400 font-mono truncate hidden sm:inline">
            {node.slug}
          </span>
          {hasChildren && (
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold shrink-0">
              {node.children.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAddChild(node)}
            title={t("admin.add_subcategory")}
            className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onToggleStatus(node)}
            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {isActive ? t("admin.disable", "تعطيل") : t("admin.enable", "تفعيل")}
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {t("admin.delete", "حذف")}
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoryNode
              key={child._id}
              node={child}
              depth={depth + 1}
              lang={lang}
              isRtl={isRtl}
              onAddChild={onAddChild}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// عرض شجري قابل للطي (collapsible) لتصنيفات متداخلة بلا حد أقصى للعمق،
// مع أزرار إجراءات (إضافة فرع / تفعيل-تعطيل / حذف) عند مرور الفأرة على كل فئة
export default function CategoryTreeView({ categories, onAddChild, onToggleStatus, onDelete }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  const isRtl = i18n.dir() === "rtl" || i18n.language?.startsWith("ar");

  const tree = buildCategoryTree(categories);

  if (tree.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 m-4">
        <p className="text-slate-500 font-medium">{t("admin.no_categories")}</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-2 divide-y divide-slate-50">
      {tree.map((node) => (
        <CategoryNode
          key={node._id}
          node={node}
          depth={0}
          lang={lang}
          isRtl={isRtl}
          onAddChild={onAddChild}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
