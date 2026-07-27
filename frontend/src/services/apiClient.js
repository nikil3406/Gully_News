const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Include credentials for HTTP-only refreshToken cookies if needed
  if (options.credentials === undefined) {
    config.credentials = "include";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP error! status: ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const uploadImageFile = async (file, folder = "gully_news") => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("image", file);

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/api/upload/image?folder=${folder}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include"
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Failed to upload image (${response.status})`);
  }

  return data;
};

