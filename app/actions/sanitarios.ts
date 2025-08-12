"use server";

import { MantenimientoSanitario, Sanitario } from "@/types/types";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene una lista paginada de sanitarios con posibilidad de filtrado
 * @param page Número de página
 * @param limit Límite de resultados por página
 * @param search Término de búsqueda opcional
 * @returns Lista paginada de sanitarios
 */
export const getSanitarios = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();
    const searchQuery = search ? `&search=${search}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener los sanitarios");
  },
  "Error al obtener los sanitarios"
);

/**
 * Edita un sanitario existente
 */
export const editSanitario = createServerAction(
  async (id: string, data: Sanitario) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          codigo_interno: data.codigo_interno,
          modelo: data.modelo,
          fecha_adquisicion: data.fecha_adquisicion,
          estado: data.estado,
        }),
        cache: "no-store",
      }
    );

    console.log("res: ", res.ok);

    return handleApiResponse(res, "Error al editar el sanitario");
  },
  "Error al editar el sanitario"
);

/**
 * Elimina un sanitario por su ID
 */
export const deleteSanitario = createServerAction(async (id: string) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets/${id}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al eliminar el sanitario");
}, "Error al eliminar el sanitario");

/**
 * Crea un nuevo sanitario
 */
export const createSanitario = createServerAction(async (data: Sanitario) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        codigo_interno: data.codigo_interno,
        modelo: data.modelo,
        fecha_adquisicion: data.fecha_adquisicion,
        estado: data.estado,
      }),
      cache: "no-store",
    }
  );

  console.log("res: ", res.ok);

  return handleApiResponse(res, "Error al crear el sanitario");
}, "Error al crear el sanitario");

/**
 * Obtiene la lista completa de sanitarios
 */
export const getToiletsList = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets`,
    {
      headers,
      cache: "no-store",
    }
  );

  const data = await handleApiResponse<{ items: Sanitario[] }>(
    res,
    "Error al obtener la lista de sanitarios"
  );
  return data.items;
}, "Error al obtener la lista de sanitarios");

/* Mantenimiento de Sanitarios */

/**
 * Obtiene los sanitarios que están en mantenimiento
 */
export const getSanitariosEnMantenimiento = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();
    const searchQuery = search ? `&search=${search}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/toilet_maintenance?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener sanitarios en mantenimiento"
    );
  },
  "Error al obtener sanitarios en mantenimiento"
);

/**
 * Elimina un registro de mantenimiento de sanitario
 */
export const deleteSanitarioEnMantenimiento = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/toilet_maintenance/${id}`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al eliminar el sanitario en mantenimiento"
    );
  },
  "Error al eliminar el sanitario en mantenimiento"
);

/**
 * Crea un nuevo registro de mantenimiento para un sanitario
 */
export const createSanitarioEnMantenimiento = createServerAction(
  async (data: MantenimientoSanitario) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/toilet_maintenance`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          baño_id: data.baño_id,
          fecha_mantenimiento: data.fecha_mantenimiento,
          tipo_mantenimiento: data.tipo_mantenimiento,
          descripcion: data.descripcion,
          empleado_id: data.empleado_id,
          costo: data.costo,
        }),
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al crear el sanitario en mantenimiento"
    );
  },
  "Error al crear el sanitario en mantenimiento"
);

/**
 * Edita un registro de mantenimiento de sanitario existente
 */
export const editSanitarioEnMantenimiento = createServerAction(
  async (id: number, data: MantenimientoSanitario) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/toilet_maintenance/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          descripcion: data.descripcion,
          empleado_id: data.empleado_id,
          costo: data.costo,
        }),
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al editar el sanitario en mantenimiento"
    );
  },
  "Error al editar el sanitario en mantenimiento"
);

/**
 * Marca un mantenimiento de sanitario como completado
 */
export const completarMantenimientoSanitario = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/toilet_maintenance/${id}/complete`,
      {
        method: "PATCH",
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al completar el mantenimiento del sanitario"
    );
  },
  "Error al completar el mantenimiento del sanitario"
);

/**
 * Obtiene los sanitarios asignados a un cliente específico
 */
export const getSanitariosByClient = createServerAction(
  async (clientId: number): Promise<Sanitario[]> => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets/by-client/${clientId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      `Error al obtener sanitarios del cliente ${clientId}`
    );
  },
  "Error al obtener sanitarios del cliente"
);

/**
 * Obtiene el total de sanitarios en el sistema
 */
export const getTotalSanitarios = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets/total_chemical_toilets`,
    {
      headers,
      cache: "no-store",
    }
  );
  return handleApiResponse(res, "Error al obtener el total de sanitarios");
}, "Error al obtener el total de sanitarios");

/**
 * Obtiene los servicios asignados a un baño químico específico
 * @param toiletId ID del baño químico
 * @returns Lista de servicios asignados con datos del cliente
 */
export const getToiletServices = createServerAction(
  async (toiletId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets/${toiletId}/services`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener los servicios del baño");
  },
  "Error al obtener los servicios del baño"
);
