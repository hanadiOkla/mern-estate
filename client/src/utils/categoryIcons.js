import { createElement } from "react";
import {
  FaBuilding,
  FaCar,
  FaHome,
  FaLaptop,
  FaMobileAlt,
  FaCouch,
  FaTshirt,
  FaBriefcase,
  FaTools,
  FaPaw,
  FaFutbol,
  FaTag,
} from "react-icons/fa";

// أيقونات التصنيفات: تُختار من حقل icon إن وُجد، وإلا يُستدل عليها من الـ slug،
// وأخيراً أيقونة عامة. أضف مفاتيح جديدة هنا عند إضافة تصنيفات رئيسية جديدة.
const ICONS = [
  ["apartment", FaBuilding],
  ["real-estate", FaHome],
  ["estate", FaHome],
  ["home", FaHome],
  ["car", FaCar],
  ["vehicle", FaCar],
  ["mobile", FaMobileAlt],
  ["phone", FaMobileAlt],
  ["electronic", FaLaptop],
  ["furniture", FaCouch],
  ["fashion", FaTshirt],
  ["job", FaBriefcase],
  ["service", FaTools],
  ["pet", FaPaw],
  ["sport", FaFutbol],
];

export function getCategoryIcon(category) {
  const keys = [category?.icon, category?.slug].filter(Boolean).map((k) => k.toLowerCase());
  for (const key of keys) {
    const match = ICONS.find(([needle]) => key.includes(needle));
    if (match) return match[1];
  }
  return FaTag;
}

// مكوّن جاهز لعرض أيقونة الفئة مباشرة: <CategoryIcon category={cat} className="w-4 h-4" />
export function CategoryIcon({ category, ...props }) {
  return createElement(getCategoryIcon(category), props);
}
