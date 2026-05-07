import apiFetch from "./apiFetch";

const url = import.meta.env.VITE_BACKEND_URL;

export const emailServices = {};

emailServices.updatePassword = async (password, token) => {
  // After commit 4 this will call /api/password_update_with_token with { token, password }
  try {
    const resp = await fetch(url + "/api/password_update_with_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, token }),
    });
    if (resp.status !== 200) return false;
    return resp.json();
  } catch (error) {
    return false;
  }
};

emailServices.sendResetEmail = async (email) => {
  try {
    const resp = await fetch(url + "/api/check_mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (resp.status !== 200) return false;
    return resp.json();
  } catch (error) {
    return false;
  }
};

emailServices.checkAuth = async (token) => {
  try {
    const resp = await apiFetch("/api/token");
    if (!resp.ok) return false;
    return resp.json();
  } catch (error) {
    return false;
  }
};
