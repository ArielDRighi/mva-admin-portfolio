// filepath: lib/actions.ts
import { cookies } from "next/headers";
import { handleApiError } from "./errors";

/**
 * Tipo para representar una acción de servidor con manejo de errores
 */
type ActionWithErrorHandling<Args extends unknown[], Result> = (
  ...args: Args
) => Promise<Result>;

/**
 * Wrapper para crear una acción de servidor con manejo de errores integrado
 * Esta función simplifica la creación de acciones del servidor con gestión de errores consistente
 *
 * @param action Función que implementa la lógica de la acción del servidor
 * @param defaultErrorMessage Mensaje de error por defecto
 * @returns Una nueva función que envuelve la acción original con manejo de errores
 */
export function createServerAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
  defaultErrorMessage: string
): ActionWithErrorHandling<Args, Result> {
  return async (...args: Args): Promise<Result> => {
    try {
      return await action(...args);
    } catch (error) {
      // Gestionar el error y obtener el mensaje
      const errorMessage = handleApiError(error, defaultErrorMessage);
      // Creamos un nuevo error con el mensaje procesado
      const enhancedError = new Error(errorMessage);
      // Adjuntamos la información original para debugging
      (enhancedError as { originalError?: unknown }).originalError = error;
      throw enhancedError; // Re-lanzar con mensaje mejorado para que el cliente lo muestre
    }
  };
}

/**
 * Función auxiliar para obtener el token de autenticación de cookies
 * Esta función es compatible tanto con el servidor como con el cliente
 * @returns El token JWT almacenado en cookies o lanza un error si no existe
 */
export async function getAuthToken(): Promise<string> {
  // En el contexto del servidor
  if (typeof window === "undefined") {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error(
        "Token no encontrado. Por favor, inicia sesión nuevamente."
      );
    }

    return token;
  }
  // En el contexto del cliente
  else {
    // Importar cookies-next dinámicamente para el cliente
    const { getCookie } = await import("cookies-next");
    const token = getCookie("token") as string | undefined;

    if (!token) {
      throw new Error(
        "Token no encontrado. Por favor, inicia sesión nuevamente."
      );
    }

    return token;
  }
}

/**
 * Función auxiliar para crear los headers de una petición con autorización
 * @param contentType Tipo de contenido de la petición (por defecto application/json)
 * @returns Un objeto con los headers necesarios para la petición
 */
export async function createAuthHeaders(
  contentType: string = "application/json"
): Promise<HeadersInit> {
  try {
    // Importar las utilidades de token solo en el cliente
    if (typeof window !== "undefined") {
      const { isTokenExpiring, refreshAuthToken } = await import(
        "./tokenUtils"
      );
      const { getCookie } = await import("cookies-next");
      const token = getCookie("token") as string | undefined;

      // Si el token existe y está por expirar, intentar refrescarlo
      if (token && isTokenExpiring(token)) {
        const refreshed = await refreshAuthToken();
        console.log("Token refreshed:", refreshed);

        // Si no se pudo refrescar, redirigir al login
        if (!refreshed) {
          window.location.href = "/login";
          throw new Error(
            "No se pudo refrescar el token. Por favor, inicia sesión nuevamente."
          );
        }

        // Obtener el nuevo token después del refresh
        const newToken = getCookie("token") as string | undefined;
        if (newToken) {
          return {
            Authorization: `Bearer ${newToken}`,
            "Content-Type": contentType,
          };
        }
      }
    }

    // Obtener el token de forma normal (para servidor o cliente)
    const token = await getAuthToken();

    // Validar si el token parece expirado o inválido (verificación básica)
    if (typeof token !== "string" || token.trim() === "") {
      console.error("Token inválido detectado en createAuthHeaders");

      // En el cliente, redirigir al login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      throw new Error("Token inválido. Por favor, inicia sesión nuevamente.");
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    };
  } catch (error) {
    console.error("Error al crear headers de autenticación:", error);

    // En el cliente, redirigir al login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw error;
  }
}

/**
 * Función para manejar respuestas de API de manera consistente
 * @param response Respuesta de fetch
 * @param errorMessage Mensaje de error por defecto
 * @returns Datos de la respuesta ya procesados
 */
export async function handleApiResponse<T>(
  response: Response,
  errorMessage: string
): Promise<T> {
  if (!response.ok) {
    // Si la respuesta no es exitosa, intentar obtener el mensaje de error del servidor
    const errorData = await response.text();
    let parsedError: unknown;

    try {
      // Intentar analizar como JSON solo si hay contenido
      if (errorData) {
        parsedError = JSON.parse(errorData);
      }
    } catch (e) {
      // Si no se puede analizar como JSON, usar el texto tal cual
      console.error("Error parsing error response:", e);
    }

    throw parsedError || errorMessage;
  }

  // Para respuestas exitosas, verificar si hay contenido
  if (response.status === 204) {
    // Para 204 No Content, retornar un objeto vacío o algún valor por defecto
    return {} as T;
  }

  // Verificar el Content-Type y Content-Length
  const contentType = response.headers.get("content-type");
  const contentLength = response.headers.get("content-length");

  // Si no hay contenido o es un JSON vacío, retornar un objeto vacío
  if (
    contentLength === "0" ||
    (contentType?.includes("application/json") && contentLength === "0")
  ) {
    return {} as T;  }
  // Para respuestas con contenido, intentar leer como texto primero
  try {
    const text = await response.text();
    
    // Si no hay contenido, retornar objeto vacío
    if (!text.trim()) {
      return {} as T;
    }
    
    // Intentar parsear como JSON solo si el content-type indica JSON
    if (contentType?.includes("application/json")) {
      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Response text:", text.substring(0, 200));
        throw new Error(`Invalid JSON response: Error parsing response`);
      }
    } else {
      // Si no es JSON, tratar como texto plano y envolver en un objeto
      return { message: text.replace(/"/g, '') } as T;
    }
  } catch (error) {
    console.error("Error reading response:", error);
    throw new Error("Failed to read response");
  }
}
