// أدوات مساعدة للتعامل مع قوائم التصنيفات المتداخلة (parentId hierarchy) في الواجهة

const parentKey = (id) => (id ? String(id) : "root");

// يحول قائمة تصنيفات مسطّحة إلى شجرة متداخلة (children[])
export function buildCategoryTree(categories, rootParentId = null) {
  const childrenByParent = new Map();
  for (const cat of categories) {
    const key = parentKey(cat.parentId);
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(cat);
  }

  const attach = (parentId) =>
    (childrenByParent.get(parentKey(parentId)) || []).map((cat) => ({
      ...cat,
      children: attach(cat._id),
    }));

  return attach(rootParentId);
}

// يحول القائمة المسطّحة إلى قائمة مرتّبة هرمياً (أب ثم أبناؤه) مع عمق كل عنصر،
// لاستخدامها في بناء <select> بخيارات متزحزحة (indented) تُظهر مستوى كل فئة
export function flattenWithDepth(categories, rootParentId = null, depth = 0) {
  return categories
    .filter((cat) => parentKey(cat.parentId) === parentKey(rootParentId))
    .flatMap((cat) => [
      { ...cat, depth },
      ...flattenWithDepth(categories, cat._id, depth + 1),
    ]);
}

// يجمع كل معرّفات الفروع الفرعية (على أي عمق) لفئة معيّنة، مفيد لمنع اختيار
// فئة كأب لنفسها أو لأحد أجدادها عند تعديلها
export function getDescendantIds(categories, rootId) {
  const descendants = new Set();
  const stack = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    for (const cat of categories) {
      if (parentKey(cat.parentId) === String(currentId)) {
        descendants.add(String(cat._id));
        stack.push(cat._id);
      }
    }
  }

  return descendants;
}

export function getCategoryLabel(category, lang) {
  if (!category?.name) return "";
  return typeof category.name === "object"
    ? category.name[lang] || category.name.ar || category.name.en || ""
    : category.name;
}
