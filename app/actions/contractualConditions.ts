"use server";

import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

// Tipos para las condiciones contractuales
export type ContractualCondition = {
  condicionContractualId?: number;
  cliente?: {
    clienteId: number;
    nombre: string;
    cuit: string;
  };
  clientId?: number;
  tipo_servicio?:
    | "INSTALACION"
    | "LIMPIEZA"
    | "MANTENIMIENTO"
    | "ALQUILER"
    | "RETIRO"
    | string; // Agregando tipo de servicio
  fecha_inicio: string;
  fecha_fin: string;
  condiciones_especificas?: string;
  tarifa: number;
  periodicidad: "Diaria" | "Semanal" | "Mensual" | "Anual";
  estado: "Activo" | "Inactivo" | "Terminado";
};

export type CreateContractualCondition = {
  clientId: number;
  tipo_servicio?:
    | "INSTALACION"
    | "LIMPIEZA"
    | "MANTENIMIENTO"
    | "ALQUILER"
    | "RETIRO"
    | string; // Agregando tipo de servicio
  fecha_inicio: string;
  fecha_fin: string;
  condiciones_especificas?: string;
  tarifa: number;
  periodicidad: "Diaria" | "Semanal" | "Mensual" | "Anual" | string;
  estado?: "Activo" | "Inactivo" | "Terminado" | string;
};

export type UpdateContractualCondition = {
  fecha_inicio?: string;
  fecha_fin?: string;
  condiciones_especificas?: string;
  tarifa?: number;
  periodicidad?: "Diaria" | "Semanal" | "Mensual" | "Anual";
  estado?: "Activo" | "Inactivo" | "Terminado";
};

/**
 * Obtiene todas las condiciones contractuales
 */
export const getAllContractualConditions = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();
    // Si search es vacío, no se filtra por búsqueda y trae todos
    const searchQuery = search ? `&search=${search}` : "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contractual_conditions?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener condiciones contractuales");
  },
  "Error al obtener las condiciones contractuales"
);

/**
 * Obtiene una condición contractual específica por su ID
 */
export const getContractualConditionById = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contractual_conditions/id/${id}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      `Error al obtener la condición contractual con ID ${id}`
    );
  },
  "Error al obtener la condición contractual"
);

/**
 * Obtiene todas las condiciones contractuales asociadas a un cliente específico
 */
export const getContractualConditionsByClient = createServerAction(
  async (
    clientId: number,
    page: number = 1,
    limit: number = 15,
    search: string = ""
  ) => {
    const headers = await createAuthHeaders();
    console.log(
      `Fetching contractual conditions for client ID: ${clientId}, page: ${page}, limit: ${limit}, search: ${search}`
    );
    // Si search es vacío, no se filtra por búsqueda
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contractual_conditions/client-id/${clientId}?page=${page}&limit=${limit}&search=${search}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      `Error al obtener condiciones contractuales del cliente ${clientId}`
    );
  },
  "Error al obtener condiciones contractuales del cliente"
);

/**
 * Crea una nueva condición contractual
 */
export const createContractualCondition = createServerAction(
  async (data: CreateContractualCondition) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contractual_conditions/create`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al crear la condición contractual");
  },
  "Error al crear la condición contractual"
);

/**
 * Modifica una condición contractual existente
 */
export const updateContractualCondition = createServerAction(
  async (id: number, data: UpdateContractualCondition) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contractual_conditions/modify/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al actualizar la condición contractual"
    );
  },
  "Error al actualizar la condición contractual"
);

/**
 * Elimina una condición contractual específica
 */
export const deleteContractualCondition = createServerAction(
  async (id: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/contractual_conditions/delete/${id}`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      `Error al eliminar la condición contractual con ID ${id}`
    );
  },
  "Error al eliminar la condición contractual"
);
