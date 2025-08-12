import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  createEmployeeLeave,
  getLicenciasByUserId,
} from "@/app/actions/LicenciasEmpleados";
import { CreateEmployeeLeaveDto, LeaveType } from "@/types/types";
import { Licencia, LeaveResponse } from "@/types/dashboardEmployeeTypes";

interface LicenciaResponse {
  id: number;
  employeeId: number;
  fechaInicio: string;
  fechaFin: string;
  tipoLicencia: string;
  notas: string;
  aprobado: boolean | null; // null = pendiente, true = aprobado, false = rechazado
  [key: string]: any;
}

interface EmployeeVacationData {
  diasVacacionesTotal: number;
  diasVacacionesRestantes: number;
  diasVacacionesUsados: number;
}

export const useLeaveManagement = (
  employeeId: number,
  employeeVacationData?: EmployeeVacationData
) => {
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | "">(
    ""
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notesText, setNotesText] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLicencias = async () => {
    try {
      if (employeeId === 0) return;

      setLoading(true);
      const fetchLicencias = await getLicenciasByUserId(employeeId);
      setLicencias(fetchLicencias as LicenciaResponse[]);
    } catch (error) {
      console.error("Error al cargar licencias:", error);
      toast.error("Error al cargar licencias", {
        description: "Algunos datos pueden estar incompletos.",
      });
      setLicencias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencias();
  }, [employeeId]);

  // Function to calculate days between two dates (inclusive)
  const calculateDaysBetween = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
    return diffDays;
  };

  const handleLeaveRequest = async () => {
    if (!selectedLeaveType || !startDate || !endDate || !employeeId) {
      toast.error("Datos incompletos", {
        description: "Por favor complete todos los campos requeridos.",
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj < today) {
      toast.error("Fecha inválida", {
        description: "La fecha de inicio no puede ser anterior al día de hoy.",
      });
      return;
    }

    if (endDateObj < today) {
      toast.error("Fecha inválida", {
        description: "La fecha de fin no puede ser anterior al día de hoy.",
      });
      return;
    }

    if (endDateObj < startDateObj) {
      toast.error("Fechas inválidas", {
        description:
          "La fecha de fin no puede ser anterior a la fecha de inicio.",
      });
      return;
    }

    // Validate vacation days for "VACACIONES" leave type
    if (selectedLeaveType === "VACACIONES" && employeeVacationData) {
      const requestedDays = calculateDaysBetween(startDate, endDate);
      const availableDays = employeeVacationData.diasVacacionesRestantes;

      if (requestedDays > availableDays) {
        toast.error("Días de vacaciones insuficientes", {
          description: `Solo tienes ${availableDays} días de vacaciones disponibles, pero solicitas ${requestedDays} días.`,
        });
        return;
      }
    }

    setIsSubmittingLeave(true);

    try {
      const leaveData: CreateEmployeeLeaveDto = {
        employeeId: employeeId,
        fechaInicio: startDate,
        fechaFin: endDate,
        tipoLicencia: selectedLeaveType as LeaveType,
        notas: notesText.trim(),
      };

      const response = (await createEmployeeLeave(leaveData)) as LeaveResponse;

      if (!response || response.success === false) {
        throw new Error(
          response?.message || "Error al crear la solicitud de licencia"
        );
      }

      toast.success("Solicitud enviada", {
        description:
          "Su solicitud de licencia ha sido enviada correctamente y está pendiente de aprobación.",
      });

      // Clear form and refresh licencias
      clearForm();
      setIsLeaveModalOpen(false);
      await fetchLicencias();
    } catch (error) {
      console.error("Error al solicitar licencia:", error);
      toast.error("Error al solicitar licencia", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud. Por favor intente nuevamente.",
      });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const clearForm = () => {
    setSelectedLeaveType("");
    setStartDate("");
    setEndDate("");
    setNotesText("");
  };

  const openLeaveModal = () => {
    clearForm();
    setIsLeaveModalOpen(true);
  };

  const closeLeaveModal = () => {
    clearForm();
    setIsLeaveModalOpen(false);
  };

  return {
    licencias,
    selectedLeaveType,
    startDate,
    endDate,
    notesText,
    isSubmittingLeave,
    isLeaveModalOpen,
    loading,
    setSelectedLeaveType,
    setStartDate,
    setEndDate,
    setNotesText,
    setIsLeaveModalOpen,
    handleLeaveRequest,
    openLeaveModal,
    closeLeaveModal,
    refreshLicencias: fetchLicencias,
    calculateDaysBetween,
    availableVacationDays: employeeVacationData?.diasVacacionesRestantes || 0,
  };
};
