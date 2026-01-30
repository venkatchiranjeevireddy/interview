const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export { API_BASE_URL };

const jsonHeaders = { 'Content-Type': 'application/json' };

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const handleResponse = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.message || 'Request failed';
    throw new Error(message);
  }
  return body;
};

export const authApi = {
  signup: async ({ email, password, fullName }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email, password, fullName }),
    });
    return handleResponse(res);
  },
  verifyOtp: async ({ email, otp }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(res);
  },
  login: async ({ email, password }) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
  me: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: { ...jsonHeaders, ...authHeader(token) },
    });
    return handleResponse(res);
  },
};

export const resumeApi = {
  list: async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/resumes`, {
      method: 'GET',
      headers: authHeader(token),
    });
    return handleResponse(res);
  },
  upload: async (token, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/v1/resumes`, {
      method: 'POST',
      headers: authHeader(token),
      body: formData,
    });
    return handleResponse(res);
  },
  runAts: async (token, resumeId, jobDescription) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/resumes/${resumeId}/ats`, {
      method: 'POST',
      headers: { ...jsonHeaders, ...authHeader(token) },
      body: JSON.stringify({ jobDescription }),
    });
    return handleResponse(res);
  },
  deleteResume: async (token, resumeId) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    return handleResponse(res);
  },
  updateProfile: async (token, data) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: { ...jsonHeaders, ...authHeader(token) },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
