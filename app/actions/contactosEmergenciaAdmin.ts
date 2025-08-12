"use server";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
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
  empleado?: {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
  };
};

export type EmpleadoConContactos = {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  emergencyContacts: ContactoEmergencia[];
};

/**
 * Obtiene los contactos de emergencia de un empleado específico
 */
export const getEmployeeEmergencyContacts = createServerAction(
  async (empleadoId: number) => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/${empleadoId}`,
      {
        method: "GET",
        headers,
      }
    );

    return handleApiResponse(
      response,
      `Error al obtener los contactos del empleado ${empleadoId}`
    );
  },
  "Error al obtener los contactos del empleado"
);

/**
 * Crea un nuevo contacto de emergencia para un empleado
 */
export const createEmployeeEmergencyContact = createServerAction(
  async (
    empleadoId: number,
    data: CreateContactDto
  ): Promise<ContactoEmergencia> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/${empleadoId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse(
      response,
      "Error al crear el contacto de emergencia"
    );
  },
  "Error al crear el contacto de emergencia"
);

/**
 * Actualiza un contacto de emergencia existente
 */
export const updateEmployeeEmergencyContact = createServerAction(
  async (
    contactoId: number,
    data: UpdateContactDto
  ): Promise<ContactoEmergencia> => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/modify/${contactoId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse(
      response,
      "Error al actualizar el contacto de emergencia"
    );
  },
  "Error al actualizar el contacto de emergencia"
);

/**
 * Elimina un contacto de emergencia
 */
export const deleteEmployeeEmergencyContact = createServerAction(
  async (contactoId: number) => {
    const headers = await createAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/emergency/delete/${contactoId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    return handleApiResponse(
      response,
      "Error al eliminar el contacto de emergencia"
    );
  },
  "Error al eliminar el contacto de emergencia"
);
