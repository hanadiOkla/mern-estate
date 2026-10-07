import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiChevronDown, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { buildCategoryTree, getCategoryLabel } from "../../utils/categoryTree";
import { CategoryIcon } from "../../utils/categoryIcons";

const categoryLink = (cat) => `/search?category=${cat._id}`;

function useCategoryTree(categories) {
  return useMemo(() => buildCategoryTree(categories), [categories]);
}

// قائمة "Mega Menu" لشاشات الحاسوب: الفئات الرئيسية في عمود جانبي، ومرور الفأرة على أي منها
// يعرض فروعها كأعمدة (كل فرع مع أبنائه تحته) للوصول لأي مستوى بنقرة واحدة
export function CategoryMegaMenu({ categories }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  const ForwardIcon = i18n.dir() === "rtl" ? HiChevronLeft : HiChevronRight;
  const location = useLocation();
  const tree = useCategoryTree(categories);

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const containerRef = useRef(null);
  const closeTimer = useRef(null);

  // إغلاق القائمة عند الانتقال لصفحة أخرى أو النقر خارجها أو الضغط على Escape
  const [lastLocation, setLastLocation] = useState(location);
  if (lastLocation !== location) {
    setLastLocation(location);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (tree.length === 0) return null;

  const active = tree.find((node) => String(node._id) === String(activeId)) || tree[0];

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // تأخير بسيط قبل الإغلاق حتى لا تنغلق القائمة أثناء تحريك الفأرة من الزر إلى اللوحة
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <li ref={containerRef} className="relative list-none" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 py-1 transition-colors cursor-pointer ${
          open ? "text-blue-600" : "hover:text-blue-600"
        }`}
      >
        {t("nav_categories")}
        <HiChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
          <div className="flex w-[640px] max-w-[90vw] min-h-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {/* عمود الفئات الرئيسية */}
            <ul className="w-56 shrink-0 bg-slate-50/80 border-e border-slate-100 py-2">
              {tree.map((node) => {
                const isActive = String(node._id) === String(active._id);
                return (
                  <li key={node._id} onMouseEnter={() => setActiveId(node._id)}>
                    <Link
                      to={categoryLink(node)}
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                        isActive ? "bg-white text-blue-700 font-bold" : "text-slate-700 font-medium hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <CategoryIcon category={node} className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                        <span className="truncate">{getCategoryLabel(node, lang)}</span>
                      </span>
                      {node.children.length > 0 && <ForwardIcon className="w-4 h-4 text-slate-300 shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* لوحة فروع الفئة النشطة */}
            <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
              <Link
                to={categoryLink(active)}
                className="text-sm font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                {t("nav_view_all_in", { name: getCategoryLabel(active, lang) })}
                <ForwardIcon className="w-4 h-4" />
              </Link>

              {active.children.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {active.children.map((child) => (
                    <div key={child._id} className="flex flex-col gap-1.5 min-w-0">
                      <Link
                        to={categoryLink(child)}
                        className="text-sm font-semibold text-slate-700 hover:text-blue-600 truncate transition-colors"
                      >
                        {getCategoryLabel(child, lang)}
                      </Link>
                      {child.children.map((grandchild) => (
                        <Link
                          key={grandchild._id}
                          to={categoryLink(grandchild)}
                          className="text-sm text-slate-500 hover:text-blue-600 truncate transition-colors"
                        >
                          {getCategoryLabel(grandchild, lang)}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("nav_no_subcategories")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function MobileCategoryNode({ node, depth, lang, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center justify-between" style={{ paddingInlineStart: depth * 16 }}>
        <Link
          to={categoryLink(node)}
          onClick={onNavigate}
          className={`flex-1 flex items-center gap-2.5 py-2 hover:text-blue-600 transition-colors ${
            depth === 0 ? "text-sm font-semibold text-slate-700" : "text-sm font-medium text-slate-500"
          }`}
        >
          {depth === 0 && <CategoryIcon category={node} className="w-4 h-4 text-slate-400" />}
          {getCategoryLabel(node, lang)}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label="toggle"
            className="p-2 text-slate-400 hover:text-slate-700"
          >
            <HiChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <MobileCategoryNode key={child._id} node={child} depth={depth + 1} lang={lang} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

// قائمة تصنيفات قابلة للطي داخل منيو الجوال: الضغط على الاسم يفتح الإعلانات،
// والسهم يعرض الفروع الفرعية بأي عمق
export function MobileCategoryMenu({ categories, onNavigate }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  const tree = useCategoryTree(categories);
  const [open, setOpen] = useState(false);

  if (tree.length === 0) return null;

  return (
    <li className="border-b border-slate-50 list-none">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2 hover:text-blue-600 transition-colors"
      >
        {t("nav_categories")}
        <HiChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="pb-2 max-h-72 overflow-y-auto">
          {tree.map((node) => (
            <MobileCategoryNode key={node._id} node={node} depth={0} lang={lang} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}
