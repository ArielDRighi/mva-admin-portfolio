import { createAuthHeaders } from "./actions";
import { isTokenExpiring, refreshAuthToken } from "./tokenUtils";
import { getCookie, deleteCookie } from "cookies-next";

/**
 * Función para hacer peticiones HTTP con manejo automático del token de autenticación
 *
 * @param url URL de la petición
 * @param options Opciones de la petición
 * @returns Promise con la respuesta
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Si no estamos en el cliente, usar fetch normal con los headers de autenticación
  if (typeof window === "undefined") {
    const headers = await createAuthHeaders();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });
  }

  try {
    // En el cliente, verificar primero si existe un token
    const token = getCookie("token") as string | undefined;

    if (!token) {
      console.error("No hay token, redirigiendo a login");
      // Limpiar cookies de sesión
      deleteCookie("token");
      deleteCookie("user");

      // Redirigir al login con parámetro de sesión expirada
      window.location.href = "/login?expired=true";
      throw new Error("Token no encontrado");
    }

    // Verificar si el token está por expirar
    if (isTokenExpiring(token)) {
      console.log("Token por expirar, intentando refrescar...");
      const refreshed = await refreshAuthToken();

      if (!refreshed) {
        // Si no se pudo refrescar el token, redirigir al login
        console.error("No se pudo refrescar el token");
        // Limpiar cookies de sesión
        deleteCookie("token");
        deleteCookie("user");

        // Redirigir al login con parámetro de sesión expirada
        window.location.href = "/login?expired=true";
        throw new Error("Token expirado");
      }
    }

    // Crear headers con el token actualizado
    const headers = await createAuthHeaders();

    // Hacer la petición con los headers actualizados
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });

    // Si la respuesta es 401, redirigir directamente a login sin intentar refrescar
    if (response.status === 401) {
      console.error("Error 401: Token no válido, redirigiendo a login");
      // Limpiar cookies de sesión
      deleteCookie("token");
      deleteCookie("user");

      // Redirigir al login con parámetro de sesión expirada
      window.location.href = "/login?expired=true";
      throw new Error("Error de autenticación: Sesión expirada");
    }

    return response;
  } catch (error) {
    console.error("Error en fetchWithAuth:", error);

    // Si hay un error, intentar determinar si es por autenticación
    if (
      error instanceof Error &&
      (error.message.includes("token") ||
        error.message.includes("autenticación") ||
        error.message.includes("unauthorized") ||
        error.message.includes("401"))
    ) {
      // Limpiar cookies de sesión
      deleteCookie("token");
      deleteCookie("user");

      // Redirigir al login con parámetro de sesión expirada
      window.location.href = "/login?expired=true";
    }

    throw error;
  }
}
