"use client";

import { getCookie } from "cookies-next";
import { SalaryAdvanceListResponse } from "@/types/salaryAdvanceTypes";
import { RopaTalles } from "@/types/types";
import { CreateTallesDto, UpdateTallesDto } from "@/app/actions/clothing";

/**
 * Cliente API para hacer llamadas directas desde el cliente
 * Evita problemas de Server Actions con autenticación
 */

// Tipos de respuesta
interface TallesResponse {
  data?: RopaTalles[];
  items?: RopaTalles[];
  total?: number;
  totalItems?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  itemsPerPage?: number;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Token no encontrado. Por favor, inicia sesión nuevamente.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function clientFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("URL de API no configurada");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as unknown as T;
}

/**
 * API específicas para el cliente
 */

// Salary Advances
export async function getSalaryAdvances(): Promise<SalaryAdvanceListResponse> {
  return clientFetch<SalaryAdvanceListResponse>("/salary-advances");
}

// Talles de empleados
export async function getTallesEmpleados(page = 1, limit = 10, search = ""): Promise<TallesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  return clientFetch<TallesResponse>(`/clothing?${params.toString()}`);
}

export async function createTallesEmpleado(empleadoId: number, talles: CreateTallesDto): Promise<RopaTalles> {
  return clientFetch(`/clothing/create/${empleadoId}`, {
    method: "POST",
    body: JSON.stringify(talles),
  });
}

export async function updateTallesEmpleado(empleadoId: number, talles: UpdateTallesDto): Promise<RopaTalles> {
  return clientFetch(`/clothing/modify/${empleadoId}`, {
    method: "PUT",
    body: JSON.stringify(talles),
  });
}

export async function deleteTallesEmpleado(empleadoId: number): Promise<{ message: string }> {
  return clientFetch(`/clothing/delete/${empleadoId}`, {
    method: "DELETE",
  });
}

export async function exportTallesToExcel(): Promise<Blob> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = await getAuthHeaders();

  const response = await fetch(`${baseUrl}/clothing/export`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Error al exportar a Excel");
  }

  return response.blob();
}
