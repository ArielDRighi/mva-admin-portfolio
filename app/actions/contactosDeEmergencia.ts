"use server";

import { 
  createAuthHeaders, 
  handleApiResponse,
  createServerAction 
} from "@/lib/actions";

export interface CreateContactDto {
  nombre: string;
  apellido: string;
  parentesco: string;
  telefono: string;
}

export interface UpdateContactDto {
  nombre?: string;
  apellido?: string;
  parentesco?: string;
  telefono?: string;
}

export type ContactoEmergencia = {
  id: number;
  nombre: string;
  apellido: string;
  parentesco: string;
  telefono: string;
};

/**
 * Crea un nuevo contacto de emergencia para un empleado
 */
export const createMyEmergencyContact = createServerAction(
  async (empleadoId: number, data: CreateContactDto) => {
    const headers = await createAuthHeaders();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/${empleadoId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse(response, "Error al crear el contacto de emergencia");
  },
  "Error al crear el contacto de emergencia"
);

/**
 * Obtiene todos los contactos de emergencia de un empleado
 */
export const getMyEmergencyContacts = createServerAction(
  async (employeeId: number) => {
    const headers = await createAuthHeaders();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/${employeeId}`,
      {
        headers,
      }
    );

    return handleApiResponse(response, "Error al obtener los contactos de emergencia");
  },
  "Error al obtener los contactos de emergencia"
);

/**
 * Elimina un contacto de emergencia
 */
export const deleteMyEmergencyContact = createServerAction(
  async (contactoId: number) => {
    const headers = await createAuthHeaders();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/delete/${contactoId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return handleApiResponse(response, "Error al eliminar el contacto de emergencia");
  },
  "Error al eliminar el contacto de emergencia"
);

/**
 * Actualiza un contacto de emergencia
 */
export const updateMyEmergencyContact = createServerAction(
  async (contactoId: number, data: UpdateContactDto) => {
    const headers = await createAuthHeaders();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/modify/${contactoId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse(response, "Error al actualizar el contacto de emergencia");
  },
  "Error al actualizar el contacto de emergencia"
);