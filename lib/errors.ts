/**
 * Tipo para los mensajes de error personalizados en las respuestas de la API
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Función para extraer el mensaje de error de una respuesta de API
 * @param error Error capturado (puede ser cualquier tipo)
 * @returns Un string con el mensaje de error más descriptivo disponible
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    // Intentar extraer mensajes de error de respuestas de API
    const errorResponse = error as ApiErrorResponse;

    // Verifica si hay propiedad message directamente
    if (errorResponse.message) {
      return String(errorResponse.message);
    }

    // Verifica si hay propiedad error directamente
    if (errorResponse.error) {
      return String(errorResponse.error);
    }

    // Si hay errores de validación, formatearlos
    if (errorResponse.errors) {
      const errorMessages = Object.values(errorResponse.errors).flat();
      if (errorMessages.length > 0) {
        return errorMessages.join(", ");
      }
    }

    // Si error es un objeto pero no tiene propiedades reconocibles, intenta convertirlo a string
    try {
      return JSON.stringify(error);
    } catch {
      // Si no se puede convertir a JSON
    }
  }

  if (typeof error === "string") {
    return error;
  }

  // Si no se puede determinar, enviar un mensaje genérico
  return "Ha ocurrido un error inesperado";
}

/**
 * Procesa errores HTTP y extrae el mensaje adecuado para presentar al usuario
 * @param error El error capturado
 * @param defaultMessage Mensaje predeterminado si no se puede extraer uno del error
 * @returns El mensaje de error procesado para mostrar al usuario
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "Ha ocurrido un error en la operación"
): string {
  const message = getErrorMessage(error) || defaultMessage;
  console.log("Mensaje de error procesado:", message);

  // Siempre registramos el error en la consola para depuración
  console.error("API Error:", error);

  return message;
}

/**
 * Función específica para manejar errores de acciones del servidor
 * @param action Función asíncrona que ejecuta una acción del servidor
 * @param onSuccess Función opcional a ejecutar si la acción es exitosa
 * @param errorMessage Mensaje de error personalizado
 * @returns Una función que ejecuta la acción y maneja los errores
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  onSuccess?: (result: T) => void,
  errorMessage?: string
): Promise<T | undefined> {
  try {
    const result = await action();

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    handleApiError(error, errorMessage);
    return undefined;
  }
}
