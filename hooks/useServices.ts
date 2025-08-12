import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getLastServicesByUserId,
  getMineAssignedServicesInProgress,
  getMineAssignedServicesPending,
} from "@/app/actions/empleados";
import { updateStatusService } from "@/app/actions/services";
import {
  ProximoServicio,
  CompletedService,
  UpdateResponse,
} from "@/types/dashboardEmployeeTypes";

// Keep the original enum for compatibility with the API
enum serviceStatus {
  EN_PROGRESO = "EN_PROGRESO",
  COMPLETADO = "COMPLETADO",
  CANCELADO = "CANCELADO",
  SUSPENDIDO = "SUSPENDIDO",
}

interface ServiceResponse {
  id: number;
  clienteId: number;
  fechaProgramada: string;
  ubicacion: string;
  tipoServicio: string;
  estado: string;
  [key: string]: any;
}

export const useServices = (employeeId: number) => {
  const [proximosServicios, setProximosServicios] = useState<ProximoServicio[]>(
    []
  );
  const [inProgressServices, setInProgressServices] = useState<
    ProximoServicio[]
  >([]);
  const [lastServices, setLastServices] = useState<CompletedService[]>([]);
  const [selectedService, setSelectedService] =
    useState<ProximoServicio | null>(null);
  const [selectedCompletedService, setSelectedCompletedService] =
    useState<CompletedService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletedServiceModalOpen, setIsCompletedServiceModalOpen] =
    useState(false);
  const [startingTask, setStartingTask] = useState(false);
  const [completingTask, setCompletingTask] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAllServices = async () => {
    try {
      if (employeeId === 0) return;

      setLoading(true);

      const [
        pendingServicesResult,
        inProgressServicesResult,
        lastServicesResult,
      ] = await Promise.allSettled([
        getMineAssignedServicesPending(employeeId),
        getMineAssignedServicesInProgress(employeeId),
        getLastServicesByUserId(employeeId),
      ]);

      if (pendingServicesResult.status === "fulfilled") {
        setProximosServicios(pendingServicesResult.value as ServiceResponse[]);
      } else {
        console.error(
          "Error al cargar servicios pendientes:",
          pendingServicesResult.reason
        );
        toast.error("Error al cargar servicios pendientes", {
          description: "Algunos datos pueden estar incompletos.",
        });
        setProximosServicios([]);
      }

      if (inProgressServicesResult.status === "fulfilled") {
        setInProgressServices(
          inProgressServicesResult.value as ProximoServicio[]
        );
      } else {
        console.error(
          "Error al cargar servicios en progreso:",
          inProgressServicesResult.reason
        );
        toast.error("Error al cargar servicios en progreso", {
          description: "Algunos datos pueden estar incompletos.",
        });
        setInProgressServices([]);
      }

      if (lastServicesResult.status === "fulfilled") {
        setLastServices(lastServicesResult.value as CompletedService[]);
      } else {
        console.error(
          "Error al cargar servicios completados:",
          lastServicesResult.reason
        );
        toast.error("Error al cargar servicios completados", {
          description: "Algunos datos pueden estar incompletos.",
        });
        setLastServices([]);
      }
    } catch (error) {
      console.error("Error general al cargar datos:", error);
      toast.error("Error de conexión", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar algunos datos. Por favor, refresque la página.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllServices();
  }, [employeeId]);

  const handleStartTask = async (serviceId: number) => {
    try {
      setStartingTask(true);

      if (!serviceId || serviceId <= 0) {
        throw new Error("ID de servicio inválido");
      }

      const response = (await updateStatusService(
        serviceId,
        serviceStatus.EN_PROGRESO
      )) as UpdateResponse;

      if (!response || response.success === false) {
        throw new Error(
          response?.message || "Error al actualizar el estado del servicio"
        );
      }

      toast.success("Tarea iniciada", {
        description: "La tarea se ha iniciado correctamente.",
      });

      if (employeeId) {
        const [pendingServices, inProgressServices] = await Promise.all([
          getMineAssignedServicesPending(employeeId),
          getMineAssignedServicesInProgress(employeeId),
        ]);

        setProximosServicios(pendingServices as ProximoServicio[]);
        setInProgressServices(inProgressServices as ProximoServicio[]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al iniciar tarea:", error);
      toast.error("Error al iniciar la tarea", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar la tarea. Intente nuevamente.",
      });
    } finally {
      setStartingTask(false);
    }
  };

  const handleCompleteTask = async (serviceId: number) => {
    try {
      setCompletingTask(true);

      if (!serviceId || serviceId <= 0) {
        throw new Error("ID de servicio inválido");
      }

      const response = (await updateStatusService(
        serviceId,
        serviceStatus.COMPLETADO
      )) as UpdateResponse;

      if (!response || response.success === false) {
        throw new Error(
          response?.message || "Error al actualizar el estado del servicio"
        );
      }

      toast.success("Tarea completada", {
        description: "La tarea se ha completado correctamente.",
      });

      if (employeeId) {
        const [inProgressServices, lastServices] = await Promise.all([
          getMineAssignedServicesInProgress(employeeId),
          getLastServicesByUserId(employeeId),
        ]);

        setInProgressServices(inProgressServices as ProximoServicio[]);
        setLastServices(lastServices as CompletedService[]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al completar tarea:", error);
      toast.error("Error al completar la tarea", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo completar la tarea. Intente nuevamente.",
      });
    } finally {
      setCompletingTask(false);
    }
  };

  return {
    proximosServicios,
    inProgressServices,
    lastServices,
    selectedService,
    selectedCompletedService,
    isModalOpen,
    isCompletedServiceModalOpen,
    startingTask,
    completingTask,
    loading,
    setSelectedService,
    setSelectedCompletedService,
    setIsModalOpen,
    setIsCompletedServiceModalOpen,
    handleStartTask,
    handleCompleteTask,
    refreshServices: fetchAllServices,
  };
};
