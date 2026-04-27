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
      // Return a structured error so the caller can display the backend message
      return { success: false, error: data?.error || "Login failed" };
    }
    return data;
  } catch (error) {
    return { success: false, error: "Network error. Please try again." };
  }
};

userServices.getUserInfo = async () => {
  try {
    const resp = await fetch(url + "/api/private", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw new Error("Failed to fetch user info");
    const data = await resp.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error("getUserInfo error:", error);
    throw error;
  }
};

userServices.getUserInfoById = async (user_id) => {
  try {
    const resp = await fetch(url + `/api/users/${user_id}`);
    if (!resp.ok) throw Error("Something went wrong");
    const data = await resp.json();
    return data;
  } catch (error) {
    return error;
  }
};

userServices.changeUserPhoto = async (user_id, photo) => {
  try {
    const token = localStorage.getItem("token");
    const resp = await fetch(url + `/api/profiles/photo/${user_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(photo),
    });
    if (!resp.ok) throw Error("Something went wrong");
    const data = await resp.json();
    return data;
  } catch (error) {
    return error;
  }
};

userServices.changeUserEmail = async (user_id, newEmail) => {
  try {
    const resp = await fetch(url + `/api/users_email/${user_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: newEmail }),
    });

    const data = await resp.json();

    return {
      ok: resp.ok,
      data,
      error: resp.ok ? null : data?.error || "Unknown error",
    };
  } catch (error) {
    console.error("Error en changeUserEmail:", error);
    return {
      ok: false,
      data: null,
      error: error.message || "Network error",
    };
  }
};

userServices.deleteAccount = async (userId) => {
  try {
    const resp = await fetch(url + `/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json();

    return {
      ok: resp.ok,
      data,
      error: resp.ok ? null : data?.error || "Unknown error",
    };
  } catch (error) {
    console.error("Error en deleteAccount:", error);
    return {
      ok: false,
      data: null,
      error: error.message || "Network error",
    };
  }
};

userServices.changeUserPassword = async (
  user_id,
  newPassword,
  actualPassword
) => {
  try {
    const resp = await fetch(url + `/api/users_password/${user_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword, actualPassword }),
    });

    const data = await resp.json();

    // Devuelve estructura controlada: { ok: boolean, data, error }
    return {
      ok: resp.ok,
      data,
      error: resp.ok ? null : data?.error || "Unknown error",
    };
  } catch (error) {
    console.error("Error en changeUserPassword:", error);
    return {
      ok: false,
      data: null,
      error: error.message || "Error de red",
    };
  }
};

export default userServices;
