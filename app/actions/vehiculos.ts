"use server";

import { CreateVehiculo, UpdateVehiculo, VehiculoStatus } from "@/types/types";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene la lista de vehículos con paginación y búsqueda opcional
 * @param page Número de página
 * @param limit Límite de resultados por página
 * @param search Término de búsqueda opcional
 * @returns Lista paginada de vehículos
 */
export const getVehicles = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();

    // Properly encode the search term to handle special characters
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener los vehículos");
  },
  "Error al obtener los vehículos"
);

/**
 * Obtiene un vehículo específico por su ID
 * @param id ID del vehículo
 * @returns Datos del vehículo
 */
export const getVehicleById = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener el vehículo");
}, "Error al obtener el vehículo");

/**
 * Obtiene un vehículo por su número de placa
 * @param placa Número de placa del vehículo
 * @returns Datos del vehículo
 */
export const getVehicleByPlaca = createServerAction(async (placa: string) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/placa/${placa}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener el vehículo por placa");
}, "Error al obtener el vehículo por placa");

/**
 * Edita la información de un vehículo existente
 * @param id ID del vehículo
 * @param data Datos de vehículo actualizados
 * @returns Estado de la respuesta
 */
export const editVehicle = createServerAction(
  async (id: string, data: UpdateVehiculo) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    await handleApiResponse(res, "Error al editar el vehículo");
    return res.status;
  },
  "Error al editar el vehículo"
);

/**
 * Elimina un vehículo del sistema
 * @param id ID del vehículo a eliminar
 * @returns Estado de la respuesta
 */
export const deleteVehicle = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    }
  );

  await handleApiResponse(res, "Error al eliminar el vehículo");
  return res.status;
}, "Error al eliminar el vehículo");

/**
 * Crea un nuevo vehículo en el sistema
 * @param data Datos del nuevo vehículo
 * @returns Datos del vehículo creado
 */
export const createVehicle = createServerAction(
  async (data: CreateVehiculo) => {
    const headers = await createAuthHeaders();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicles`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      cache: "no-store",
    });

    return handleApiResponse(res, "Error al crear el vehículo");
  },
  "Error al crear el vehículo"
);

/**
 * Cambia el estado de un vehículo (ACTIVO, INACTIVO, MANTENIMIENTO, etc.)
 * @param id ID del vehículo
 * @param estado Nuevo estado del vehículo
 * @returns Estado de la respuesta
 */
export const changeVehicleStatus = createServerAction(
  async (id: number, estado: VehiculoStatus) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/${id}/estado`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
        cache: "no-store",
      }
    );

    await handleApiResponse(res, "Error al cambiar el estado del vehículo");
    return res.status;
  },
  "Error al cambiar el estado del vehículo"
);

/**
 * Obtiene el total de vehículos en el sistema
 * @returns Información sobre el total de vehículos
 */
export const getTotalVehicles = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/total_vehicles`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(response, "Error al obtener el total de vehículos");
}, "Error al obtener el total de vehículos");
