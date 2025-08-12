"use server";

import {
  CreateVehicleMaintenance,
  UpdateVehicleMaintenance,
} from "@/types/types";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene todos los mantenimientos de vehículos con paginación y búsqueda opcional
 */
export const getMantenimientosVehiculos = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();
    // Corregir esta línea - asegúrate de codificar el término de búsqueda
    console.log("search", search);
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";
    console.log(
      `Fetching vehicle maintenance with page=${page}, limit=${limit}, search=${search}`
    );
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener mantenimientos de vehículos"
    );
  },
  "Error al obtener mantenimientos de vehículos"
);

/**
 * Obtiene los mantenimientos programados próximos
 */
export const getMantenimientosProgramados = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance/upcoming`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener mantenimientos programados");
}, "Error al obtener mantenimientos programados");

/**
 * Obtiene un mantenimiento de vehículo específico por su ID
 */
export const getMantenimientoVehiculoPorId = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance/${id}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener el mantenimiento del vehículo"
    );
  },
  "Error al obtener el mantenimiento del vehículo"
);

/**
 * Obtiene todos los mantenimientos asociados a un vehículo específico
 */
export const getMantenimientosPorVehiculo = createServerAction(
  async (vehiculoId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance/vehiculo/${vehiculoId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener mantenimientos del vehículo"
    );
  },
  "Error al obtener mantenimientos del vehículo"
);

/**
 * Crea un nuevo registro de mantenimiento para un vehículo
 */
export const createMantenimientoVehiculo = createServerAction(
  async (data: CreateVehicleMaintenance) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          vehiculoId: data.vehiculoId,
          fechaMantenimiento: data.fechaMantenimiento,
          tipoMantenimiento: data.tipoMantenimiento,
          descripcion: data.descripcion,
          costo: data.costo,
          proximoMantenimiento: data.proximoMantenimiento,
        }),
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al programar el mantenimiento del vehículo"
    );
  },
  "Error al programar el mantenimiento del vehículo"
);

/**
 * Actualiza un registro de mantenimiento existente
 */
export const editMantenimientoVehiculo = createServerAction(
  async (id: number, data: UpdateVehicleMaintenance) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          fechaMantenimiento: data.fechaMantenimiento,
          tipoMantenimiento: data.tipoMantenimiento,
          descripcion: data.descripcion,
          costo: data.costo,
          proximoMantenimiento: data.proximoMantenimiento,
        }),
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al actualizar el mantenimiento del vehículo"
    );
  },
  "Error al actualizar el mantenimiento del vehículo"
);

/**
 * Elimina un registro de mantenimiento
 */
export const deleteMantenimientoVehiculo = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance/${id}`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al eliminar el mantenimiento del vehículo"
    );
  },
  "Error al eliminar el mantenimiento del vehículo"
);

/**
 * Marca un mantenimiento como completado
 */
export const completarMantenimientoVehiculo = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance/${id}/complete`,
      {
        method: "PATCH",
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al completar el mantenimiento del vehículo"
    );
  },
  "Error al completar el mantenimiento del vehículo"
);

/**
 * Fetch normal para obtener mantenimientos de vehículos desde el cliente
 */
export async function fetchMantenimientosVehiculos(
  page: number = 1,
  limit: number = 15,
  search: string = ""
) {
  const headers = await createAuthHeaders();
  const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle_maintenance?page=${page}&limit=${limit}${searchQuery}`,
    {
      headers,
      cache: "no-store",
    }
  );
  return handleApiResponse(
    res,
    "Error al obtener mantenimientos de vehículos"
  );
}
