// يحول قائمة تصنيفات مسطّحة (flat) إلى شجرة متداخلة (nested tree) بكفاءة O(n)
// عبر تجميع الأبناء حسب الأب في Map مرة واحدة بدل البحث المتكرر في المصفوفة.
export function buildCategoryTree(categories, rootParentId = null) {
  const childrenByParent = new Map();

  for (const category of categories) {
    const doc = typeof category.toObject === 'function' ? category.toObject() : category;
    const key = doc.parentId ? String(doc.parentId) : 'root';
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(doc);
  }

  const attachChildren = (parentId) => {
    const key = parentId ? String(parentId) : 'root';
    const nodes = childrenByParent.get(key) || [];
    return nodes.map((node) => ({
      ...node,
      children: attachChildren(node._id)
    }));
  };

  return attachChildren(rootParentId);
}
