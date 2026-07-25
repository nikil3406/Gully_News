import { request } from "./apiClient";

export const fetchComments = async (postId) => {
  return await request(`/api/posts/${postId}/comments`);
};

export const addComment = async (postId, content) => {
  return await request(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
};

export const deleteComment = async (postId, commentId) => {
  return await request(`/api/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
};
