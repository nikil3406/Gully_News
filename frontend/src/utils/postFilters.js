export const filterPostsByCategoryAndSearch = (posts = [], selectedCategory, searchTerm = '') => {
  const normalizedCategory = selectedCategory == null ? null : Number(selectedCategory);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesCategory = normalizedCategory === null || Number(post.category_id) === normalizedCategory;
    if (!matchesCategory) return false;

    if (!normalizedSearch) return true;

    const haystack = `${post.title || ''} ${post.content || ''}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });
};
