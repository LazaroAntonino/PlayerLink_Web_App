const url = import.meta.env.VITE_BACKEND_URL;

export const emailServices = {};

emailServices.updatePassword = async (password, token) => {
  //recibimos password nuevo  y el token (lo necesitamos ya que es una ruta protegida la que vamos a consumir y porque del token sacaremos la identidad del usuario)
  try {
    const resp = await fetch(url + "/api/password_update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
    if (resp.status != 200) return false;
    const data = await resp.json();
    return data;
  } catch (error) {
  }
};

emailServices.sendResetEmail = async (email) => {
  //recibimos el correo al que le vamos a enviar el reset del password
  try {
    const resp = await fetch(url + "/api/check_mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    if (resp.status != 200) return false;
    const data = await resp.json();
    return data;
  } catch (error) {
  }
};

emailServices.checkAuth = async (token) => {
  try {
    // fetching data from the backend
    const resp = await fetch(url + "/api/token", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      method: "GET",
    });
    if (resp.status != 200) return false;
    const data = await resp.json();
    return data;
  } catch (error) {
  }
};
