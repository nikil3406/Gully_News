import { request } from "./apiClient";

export const fetchPosts = async ({ cursor, limit = 5, categoryId, search } = {}) => {
  const query = new URLSearchParams();
  if (cursor) query.append("cursor", cursor);
  if (limit) query.append("limit", limit);
  if (categoryId) query.append("category_id", categoryId);
  if (search) query.append("search", search);

  const queryString = query.toString();
  const endpoint = `/api/posts${queryString ? `?${queryString}` : ""}`;
  return await request(endpoint);
};

export const fetchPostById = async (id) => {
  return await request(`/api/posts/${id}`);
};

export const fetchCategories = async () => {
  return await request("/api/posts/categories");
};

export const createPost = async (postData) => {
  return await request("/api/posts", {
    method: "POST",
    body: JSON.stringify(postData),
  });
};

export const toggleLikePost = async (id) => {
  return await request(`/api/posts/${id}/like`, {
    method: "POST",
  });
};

export const incrementPostView = async (id) => {
  return await request(`/api/posts/${id}/view`, {
    method: "POST",
  });
};

export const deletePost = async (id) => {
  return await request(`/api/posts/${id}`, {
    method: "DELETE",
  });
};

export const fetchNearbyPosts = async ({ latitude, longitude, radius = 50, cursor, limit = 5 }) => {
  const query = new URLSearchParams({
    latitude,
    longitude,
    radius,
    limit,
  });
  if (cursor) query.append("cursor", cursor);

  return await request(`/api/news/nearby?${query.toString()}`);
};
