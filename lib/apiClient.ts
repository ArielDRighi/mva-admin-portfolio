"use client";

import { getCookie } from "cookies-next";
import { SalaryAdvanceListResponse } from "@/types/salaryAdvanceTypes";
import { RopaTalles } from "@/types/types";

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
