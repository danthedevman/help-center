const API_BASE = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || data?.message || "Request failed";
    throw new Error(message);
  }
  return data;
}

export const authApi = {
  check: () => request("/auth/check", { method: "GET" }),
  login: (email, password) =>
    request("/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email, password) =>
    request("/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/logout", { method: "POST" }),

  forgotPassword: (email) =>
    request("/password/forgot", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (token, password) =>
    request("/password/reset", { method: "POST", body: JSON.stringify({ token, password }) }),
};