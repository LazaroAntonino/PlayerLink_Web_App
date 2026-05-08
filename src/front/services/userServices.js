import apiFetch from "./apiFetch";

const url = import.meta.env.VITE_BACKEND_URL;
const userServices = {};

userServices.register = async (formData) => {
  try {
    const resp = await fetch(url + "/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: data?.error || "Registration failed" };
    }
    return data;
  } catch (error) {
    return { success: false, error: "Network error. Please try again." };
  }
};

userServices.login = async (formData) => {
  try {
    const resp = await fetch(url + "/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { success: false, error: data?.error || "Login failed" };
    }
    return data;
  } catch (error) {
    return { success: false, error: "Network error. Please try again." };
  }
};

userServices.getUserInfo = async () => {
  const resp = await apiFetch("/api/private");
  if (!resp.ok) throw new Error("Failed to fetch user info");
  const data = await resp.json();
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

userServices.getUserInfoById = async (user_id) => {
  const resp = await apiFetch(`/api/users/${user_id}`);
  if (!resp.ok) throw Error("Something went wrong");
  return resp.json();
};

userServices.updateProfile = async (user_id, profileData, method = "PUT") => {
  const resp = await apiFetch(`/api/profiles/${user_id}`, {
    method,
    body: JSON.stringify(profileData),
  });
  if (!resp.ok) throw new Error("Error saving profile");
  return resp.json();
};

userServices.changeUserPhoto = async (user_id, photo) => {
  const resp = await apiFetch(`/api/profiles/photo/${user_id}`, {
    method: "PUT",
    body: JSON.stringify(photo),
  });
  if (!resp.ok) throw new Error("Something went wrong changing photo");
  return resp.json();
};

userServices.changeUserEmail = async (user_id, newEmail) => {
  try {
    const resp = await apiFetch(`/api/users_email/${user_id}`, {
      method: "PUT",
      body: JSON.stringify({ email: newEmail }),
    });
    const data = await resp.json();
    return {
      ok: resp.ok,
      data,
      error: resp.ok ? null : data?.error || "Unknown error",
    };
  } catch (error) {
    return { ok: false, data: null, error: error.message || "Network error" };
  }
};

userServices.deleteAccount = async (userId) => {
  try {
    const resp = await apiFetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await resp.json();
    return {
      ok: resp.ok,
      data,
      error: resp.ok ? null : data?.error || "Unknown error",
    };
  } catch (error) {
    return { ok: false, data: null, error: error.message || "Network error" };
  }
};

userServices.changeUserPassword = async (user_id, newPassword, actualPassword) => {
  try {
    const resp = await apiFetch(`/api/users_password/${user_id}`, {
      method: "PUT",
      body: JSON.stringify({ password: newPassword, actualPassword }),
    });
    const data = await resp.json();
    return {
      ok: resp.ok,
      data,
      error: resp.ok ? null : data?.error || "Unknown error",
    };
  } catch (error) {
    return { ok: false, data: null, error: error.message || "Error de red" };
  }
};

export default userServices;
