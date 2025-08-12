"use server";

import {
  CreateAdvanceDto,
  SalaryAdvance,
  SalaryAdvanceListResponse,
  SalaryAdvanceFilters,
} from "@/types/salaryAdvanceTypes";
import {
  handleApiResponse,
  createServerAction,
  createAuthHeaders,
} from "@/lib/actions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Create salary advance request - matches backend: POST /api/salary-advances
export const createAdvanceAction = createServerAction(
  async (data: CreateAdvanceDto) => {
    const headers = await createAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/salary-advances`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse<SalaryAdvance>(
      response,
      "Error creating salary advance"
    );

    return result;
  },
  "Failed to create salary advance request"
);

// Get all salary advances (admin only) - matches backend: GET /api/salary-advances
export const getAllAdvancesAction = createServerAction(
  async (filters: SalaryAdvanceFilters = {}) => {
    const headers = await createAuthHeaders();
    const params = new URLSearchParams();

    if (filters.status && filters.status !== "all") {
      params.append("status", filters.status);
    }
    if (filters.page) {
      params.append("page", filters.page.toString());
    }
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }

    const url = `${API_BASE_URL}/api/salary-advances${
      params.toString() ? "?" + params.toString() : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    return handleApiResponse<SalaryAdvanceListResponse>(
      response,
      "Error fetching salary advances"
    );
  },
  "Failed to fetch salary advances"
);

// Get employee's own advances - matches backend: GET /api/salary-advances/employee
export const getMyAdvancesAction = createServerAction(
  async (userToken?: string) => {
    // Si se proporciona un token de usuario específico, lo usamos; de lo contrario, obtenemos los headers normalmente
    const headers = userToken
      ? {
          ...(await createAuthHeaders()),
          Authorization: `Bearer ${userToken}`,
        }
      : await createAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/api/salary-advances/employee`,
      {
        method: "GET",
        headers,
      }
    );

    return handleApiResponse<SalaryAdvance[]>(
      response,
      "Error fetching your salary advances"
    );
  },
  "Failed to fetch your salary advances"
);

// Approve salary advance - matches backend: PATCH /api/salary-advances/update/:id
export const approveAdvanceAction = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/api/salary-advances/update/${id}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "approved" }),
    }
  );

  return handleApiResponse<SalaryAdvance>(
    response,
    "Error approving salary advance"
  );
}, "Failed to approve salary advance");

// Reject salary advance - matches backend: PATCH /api/salary-advances/update/:id
export const rejectAdvanceAction = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/api/salary-advances/update/${id}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "rejected" }),
    }
  );

  return handleApiResponse<SalaryAdvance>(
    response,
    "Error rejecting salary advance"
  );
}, "Failed to reject salary advance");

// Get single salary advance (if needed)
export const getAdvanceAction = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/salary-advances/${id}`, {
    method: "GET",
    headers,
  });

  return handleApiResponse<SalaryAdvance>(
    response,
    "Error fetching salary advance"
  );
}, "Failed to fetch salary advance details");

// Delete salary advance (only if pending)
export const deleteAdvanceAction = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/salary-advances/${id}`, {
    method: "DELETE",
    headers,
  });

  const result = await handleApiResponse<{ message: string }>(
    response,
    "Error deleting salary advance"
  );

  return result;
}, "Failed to delete salary advance");
