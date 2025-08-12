import { getCookie, setCookie, deleteCookie } from "cookies-next";

/**
 * Verifica si un token JWT está a punto de expirar (menos de 5 minutos)
 * @param token - El token JWT a verificar
 * @returns boolean - true si el token está expirado o a punto de expirar
 */
export const isTokenExpiring = (token: string): boolean => {
  try {
    // En el servidor, evitar procesar el token
    if (typeof window === "undefined") {
      console.warn("No se puede verificar el token en el servidor");
      return false;
    }

    // Si el token no existe o no es una cadena válida
    if (!token || typeof token !== "string" || token.trim() === "") {
      return true;
    }

    // Verificar el formato del token (debe tener 3 partes separadas por puntos)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Formato de token inválido");
      return true;
    }

    // Decodifica el payload del token (la parte del medio)
    const payload = parts[1];
    if (!payload) return true;

    // Intentar decodificar el payload
    let decodedPayload;
    try {
      decodedPayload = JSON.parse(atob(payload));
    } catch (e) {
      console.error("No se pudo decodificar el payload del token:", e);
      return true;
    }

    // Obtiene tiempo de expiración del token y tiempo actual
    const exp = decodedPayload.exp;
    if (!exp || isNaN(exp)) {
      console.error("Token sin fecha de expiración");
      return true;
    }

    const now = Math.floor(Date.now() / 1000);

    // El token ya expiró
    if (exp <= now) {
      console.error("Token ya expirado");
      return true;
    }

    // Considera el token como "expirando" si le quedan menos de 5 minutos
    const isExpiring = exp - now < 300;
    if (isExpiring) {
      console.log(`Token a punto de expirar en ${exp - now} segundos`);
    }

    return isExpiring;
  } catch (error) {
    console.error("Error al verificar expiración del token:", error);
    // Si hay un error al verificar, asumimos que necesita actualizarse
    return true;
  }
};

/**
 * Intenta refrescar el token de autenticación
 * @returns Promise<boolean> - true si el token fue refrescado correctamente
 */
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // En el servidor no podemos refrescar el token
    if (typeof window === "undefined") {
      console.error("No se puede refrescar el token en el servidor");
      return false;
    }

    const currentToken = getCookie("token") as string | undefined;

    if (!currentToken) {
      console.error("No hay token para refrescar");
      return false;
    }

    console.log("Intentando refrescar token...");

    // Intentar refrescar el token con el endpoint de refresh
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        // No cachear esta petición
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `Error al refrescar token: ${response.status} ${response.statusText}`
      );

      // Si el error es 401 o 403, limpiar la sesión
      if (response.status === 401 || response.status === 403) {
        console.error("Error de autenticación al refrescar token");
        deleteCookie("token");
        deleteCookie("user");

        // Redirigir al login
        window.location.href = "/login?expired=true";
      }

      return false;
    }

    const data = await response.json();

    // Actualizar el token en las cookies
    if (data.access_token) {
      console.log("Token refrescado exitosamente");
      setCookie("token", data.access_token);

      // Establecer un flag para notificar que el token fue refrescado
      localStorage.setItem("token_refreshed", "true");

      return true;
    }

    console.error("El endpoint de refresh no devolvió un token");
    return false;
  } catch (error) {
    console.error("Error al refrescar token:", error);

    // En caso de error, limpiar cookies y redirigir
    if (typeof window !== "undefined") {
      deleteCookie("token");
      deleteCookie("user");
      window.location.href = "/login?expired=true&error=refresh";
    }

    return false;
  }
};

/**
 * Función simple para verificar la autenticación y redirigir si es necesario
 * Esta función es útil para componentes que necesitan verificar la autenticación
 */
export const checkAuth = () => {
  if (typeof window !== "undefined") {
    const token = getCookie("token");
    if (!token) {
      window.location.href = "/login";
      return false;
    }
    return true;
  }
  return false;
};
