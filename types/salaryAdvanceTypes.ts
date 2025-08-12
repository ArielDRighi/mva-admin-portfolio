// Salary Advance Types
export interface SalaryAdvance {
  id: number;
  employee: {
    id: number;
    nombre: string;
    apellido: string;
    legajo: string;
    email: string;
  };
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date | string;
  updatedAt: Date | string;
  approvedBy?: string;
  approvedAt?: Date | string;
}

export interface CreateAdvanceDto {
  amount: number;
  reason: string;
  status?: string;
}

export interface ApproveAdvanceDto {
  status: 'approved' | 'rejected';
  comentario?: string;
}

export interface SalaryAdvanceListResponse {
  advances: SalaryAdvance[];
  total: number;
  page: number;
  limit: number;
}

export interface SalaryAdvanceFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  employeeId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
