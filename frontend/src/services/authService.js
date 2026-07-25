import { request, setAuthToken } from "./apiClient";

export const login = async (email, password) => {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

export const register = async (username, email, password) => {
  return await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
};

export const getProfile = async () => {
  return await request("/api/auth/profile");
};

export const updateProfile = async (profileData) => {
  return await request("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
};

export const getUserProfileById = async (userId) => {
  return await request(`/api/auth/profile/${userId}`);
};

export const toggleFollowUser = async (userId) => {
  return await request(`/api/auth/${userId}/follow`, {
    method: "POST",
  });
};

export const searchUsers = async (query) => {
  return await request(`/api/auth/users/search?q=${encodeURIComponent(query)}`);
};

export const logout = async () => {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Logout request error:", err);
  } finally {
    setAuthToken(null);
  }
};
