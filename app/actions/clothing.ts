"use server";

import { RopaTalles } from "@/types/types";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

export interface CreateTallesDto {
  calzado_talle: string;
  pantalon_talle: string;
  camisa_talle: string;
  campera_bigNort_talle: string;
  pielBigNort_talle: string;
  medias_talle: string;
  pantalon_termico_bigNort_talle: string;
  campera_polar_bigNort_talle: string;
  mameluco_talle: string;
}

export interface UpdateTallesDto {
  calzado_talle?: string;
  pantalon_talle?: string;
  camisa_talle?: string;
  campera_bigNort_talle?: string;
  pielBigNort_talle?: string;
  medias_talle?: string;
  pantalon_termico_bigNort_talle?: string;
  campera_polar_bigNort_talle?: string;
  mameluco_talle?: string;
}

/**
 * Crea la información de tallas para mi usuario
 */
export const createMyClothing = createServerAction(
  async (employeeId: number, talles: CreateTallesDto) => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/create/${employeeId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(talles),
      }
    );

    return handleApiResponse(response, "Error al crear la vestimenta");
  },
  "Error al crear la vestimenta"
);

/**
 * Obtiene la información de tallas para mi usuario
 */
export const getMyClothing = createServerAction(async (employeeId: number) => {
  const headers = await createAuthHeaders();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/${employeeId}`,
    {
      method: "GET",
      headers,
    }
  );

  return handleApiResponse(
    response,
    "Error al obtener la información de vestimenta"
  );
}, "Error al obtener la información de vestimenta");

/**
 * Actualiza la información de tallas para mi usuario
 */
export const updateMyClothing = createServerAction(
  async (employeeId: number, talles: UpdateTallesDto) => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/modify/${employeeId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(talles),
      }
    );

    return handleApiResponse(response, "Error al actualizar la vestimenta");
  },
  "Error al actualizar la vestimenta"
);

/**
 * Obtiene los talles de todos los empleados (con paginación)
 */

// Interfaces para los formatos de respuesta posibles
// interface DataPaginationResponse {
//   data: RopaTalles[];
//   totalItems?: number;
//   currentPage?: number;
//   itemsPerPage?: number;
// }

// interface ItemsPaginationResponse {
//   items: RopaTalles[];
//   total?: number;
//   page?: number;
//   limit?: number;
// }

// Type guards para verificar estructura
/* Eliminados por no ser usados actualmente
function isDataPaginationResponse(obj: unknown): obj is DataPaginationResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj &&
    Array.isArray((obj as { data: unknown }).data)
  );
}

function isItemsPaginationResponse(
  obj: unknown
): obj is ItemsPaginationResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "items" in obj &&
    Array.isArray((obj as { items: unknown }).items)
  );
}
*/

interface RevalidationOptions {
  revalidate?: boolean;
  cache?: RequestCache;
}

export const getTallesEmpleados = createServerAction(
  async (
    page: number = 1,
    itemsPerPage: number = 10,
    search: string | null = "",
    options: RevalidationOptions = {}
  ) => {
    const headers = await createAuthHeaders();
    const searchParams = new URLSearchParams();
    searchParams.append("page", page.toString());
    searchParams.append("limit", itemsPerPage.toString());

    // Add search parameter if provided, ensuring it's a string
    const searchTerm = search ? String(search).trim() : "";
    if (searchTerm) {
      // Use encodeURIComponent to properly handle special characters in the search term
      searchParams.append("search", encodeURIComponent(searchTerm));
    }

    // Añadimos un valor aleatorio al querystring para forzar la revalidación si es necesario
    if (options.revalidate) {
      searchParams.append("_t", Date.now().toString());
    }

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/clothing?${searchParams.toString()}`,
        {
          headers,
          cache: options.cache || "no-store",
          next: options.revalidate ? { revalidate: 0 } : undefined,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error fetching talles: ${response.status} - ${errorText}`
        );

        // If it's the unaccent function error, we can provide a more helpful message
        if (errorText.includes("unaccent")) {
          throw new Error(
            "Error: La función de búsqueda avanzada no está disponible en el servidor. Por favor, contacte al administrador."
          );
        }
        throw new Error(`Error al obtener talles: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in getTallesEmpleados:", error);
      throw error instanceof Error
        ? error
        : new Error("Error desconocido al obtener los talles de empleados");
    }
  },
  "Error al obtener los talles de empleados"
);
/**
 * Obtiene los talles de un empleado específico
 */
export const getTallesEmpleadoById = createServerAction(
  async (empleadoId: number): Promise<RopaTalles | null> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/${empleadoId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      response,
      `Error al obtener los talles del empleado ${empleadoId}`
    );
  },
  "Error al obtener los talles del empleado"
);

/**
 * Crea los talles para un empleado específico (ADMIN)
 */
export const createTallesEmpleado = createServerAction(
  async (empleadoId: number, talles: CreateTallesDto): Promise<RopaTalles> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/create/${empleadoId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(talles),
      }
    );

    return handleApiResponse(
      response,
      `Error al crear los talles del empleado ${empleadoId}`
    );
  },
  "Error al crear los talles del empleado"
);

/**
 * Actualiza los talles para un empleado específico (ADMIN)
 */
export const updateTallesEmpleado = createServerAction(
  async (empleadoId: number, talles: UpdateTallesDto): Promise<RopaTalles> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/modify/${empleadoId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(talles),
      }
    );

    return handleApiResponse(
      response,
      `Error al actualizar los talles del empleado ${empleadoId}`
    );
  },
  "Error al actualizar los talles del empleado"
);

/**
 * Elimina los talles de un empleado específico (ADMIN)
 */
export const deleteTallesEmpleado = createServerAction(
  async (empleadoId: number): Promise<{ message: string }> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/delete/${empleadoId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return handleApiResponse(
      response,
      `Error al eliminar los talles del empleado ${empleadoId}`
    );
  },
  "Error al eliminar los talles del empleado"
);

/**
 * Exporta los datos de talles a un archivo Excel (ADMIN)
 */
export const exportTallesToExcel = createServerAction(
  async (): Promise<Blob> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clothing/export`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Error al exportar los talles a Excel");
    }

    return await response.blob();
  },
  "Error al exportar los talles a Excel"
);
