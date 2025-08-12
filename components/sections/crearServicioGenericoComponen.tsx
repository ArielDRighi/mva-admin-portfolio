"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/local/FormField";
import { PaginationLocal } from "@/components/ui/local/PaginationLocal";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getClients } from "@/app/actions/clientes";
import { getContractualConditionsByClient } from "@/app/actions/contractualConditions";
import {
  CreateLimpiezaDto,
  createServicioGenerico,
} from "@/app/actions/services";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/local/Loader";
import { Cliente, Empleado, Sanitario, Vehiculo } from "@/types/types";
import { ServiceType } from "@/types/serviceTypes";
import {
  Search,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Save,
  Clipboard,
  Bath,
  Check,
} from "lucide-react";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { getEmployees } from "@/app/actions/empleados";
import { getVehicles } from "@/app/actions/vehiculos";
import { getSanitariosByClient } from "@/app/actions/sanitarios";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Schema for the form
const formSchema = z.object({
  // Step 1
  clienteId: z.number().min(1, "Debe seleccionar un cliente"),

  // Step 2
  condicionContractualId: z
    .number()
    .min(1, "Debe seleccionar una condición contractual"),

  // Step 3
  fechaProgramada: z.date({
    required_error: "La fecha programada es obligatoria",
  }),
  cantidadVehiculos: z.number().min(1, "Debe especificar al menos 1 vehículo"),
  ubicacion: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
  notas: z.string().optional(),  // Step 4 - campos opcionales para permitir navegación entre pasos
  banosInstalados: z.array(z.number()).optional(),
  empleadosIds: z.array(z.number()).optional(),
  vehiculosIds: z.array(z.number()).optional(),

  // Additional fields for service creation
  tipoServicio: z.literal(ServiceType.LIMPIEZA),
  asignacionAutomatica: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

type CondicionContractual = {
  condicionContractualId: number;
  clientId: number;
  tipo_servicio?: string; // Agregando tipo de servicio
  fecha_inicio: string;
  fecha_fin: string;
  condiciones_especificas: string;
  tarifa: number;
  periodicidad: string;
  estado: string;
};

interface EmpleadosResponse {
  data?: Empleado[];
  items?: Empleado[];
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
}

interface VehiculosResponse {
  data?: Vehiculo[];
  items?: Vehiculo[];
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
}

interface ClientesResponse {
  data?: Cliente[];
  items?: Cliente[];
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
}

interface CondicionesResponse {
  data?: CondicionContractual[];
  items?: CondicionContractual[];
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
}

export function CrearServicioGenericoComponent() {
  const router = useRouter();
  const { isAdmin } = useCurrentUser();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showStepErrors, setShowStepErrors] = useState<boolean>(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTermCliente, setSearchTermCliente] = useState<string>("");
  const [searchInputValue, setSearchInputValue] = useState<string>("");

  const [condicionesContractuales, setCondicionesContractuales] = useState<
    CondicionContractual[]
  >([]);

  const [banosInstalados, setBanosInstalados] = useState<Sanitario[]>([]);
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState<Empleado[]>(
    []
  );
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<Vehiculo[]>(
    []
  );
  const [selectedEmpleados, setSelectedEmpleados] = useState<number[]>([]);
  const [selectedVehiculos, setSelectedVehiculos] = useState<number[]>([]);
  const [selectedBanos, setSelectedBanos] = useState<number[]>([]);

  // Estado para asignación de roles A y B
  const [empleadoRolA, setEmpleadoRolA] = useState<number | null>(null);
  const [empleadoRolB, setEmpleadoRolB] = useState<number | null>(null);
  const [searchTermCondicion, setSearchTermCondicion] = useState<string>("");
  const [filteredCondiciones, setFilteredCondiciones] = useState<
    CondicionContractual[]
  >([]);
  const [searchTermEmpleado, setSearchTermEmpleado] = useState<string>("");
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  const [searchTermVehiculo, setSearchTermVehiculo] = useState<string>("");
  const [filteredVehiculos, setFilteredVehiculos] = useState<Vehiculo[]>([]);
  const [searchTermSanitario, setSearchTermSanitario] = useState<string>("");
  const [filteredSanitarios, setFilteredSanitarios] = useState<Sanitario[]>([]);

  // Estados para paginado
  const [empleadosPagination, setEmpleadosPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });
  const [vehiculosPagination, setVehiculosPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });
  const [clientesPagination, setClientesPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });
  const [condicionesPagination, setCondicionesPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });
  const [sanitariosPagination, setSanitariosPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleEmpleadoSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    page: number = 1
  ) => {
    if (e.key === "Enter" || typeof page === "number") {
      const term = searchTermEmpleado.trim();
      setIsLoading(true);
      try {
        // getEmployees puede aceptar un parámetro de búsqueda con paginación
        const empleadosResponseRaw = await getEmployees(page, empleadosPagination.limit, term) as EmpleadosResponse;
        let empleados: Empleado[] = [];
        let pagination = { page: 1, totalPages: 1, total: 0, limit: empleadosPagination.limit };
        
        if (empleadosResponseRaw && typeof empleadosResponseRaw === "object") {
          if (Array.isArray(empleadosResponseRaw)) {
            empleados = empleadosResponseRaw;
          } else if (empleadosResponseRaw.items && Array.isArray(empleadosResponseRaw.items)) {
            empleados = empleadosResponseRaw.items;
            // Actualizar información de paginación si está disponible
            pagination = {
              page: empleadosResponseRaw.page || page,
              totalPages: empleadosResponseRaw.totalPages || 1,
              total: empleadosResponseRaw.total || empleados.length,
              limit: empleadosResponseRaw.limit || empleadosPagination.limit,
            };
          } else if (empleadosResponseRaw.data && Array.isArray(empleadosResponseRaw.data)) {
            empleados = empleadosResponseRaw.data;
            // Actualizar información de paginación si está disponible
            pagination = {
              page: empleadosResponseRaw.page || page,
              totalPages: empleadosResponseRaw.totalPages || 1,
              total: empleadosResponseRaw.total || empleados.length,
              limit: empleadosResponseRaw.limit || empleadosPagination.limit,
            };
          }
        }
        
        // Filtrar por estado DISPONIBLE o ASIGNADO
        empleados = empleados.filter(
          (empleado) =>
            empleado.estado === "DISPONIBLE" || empleado.estado === "ASIGNADO"
        );

        // Mantener empleados seleccionados aunque no estén en la búsqueda
        const empleadosSeleccionados = empleadosDisponibles.filter(
          (e) =>
            selectedEmpleados.includes(e.id) &&
            !empleados.some((emp) => emp.id === e.id)
        );
        const empleadosParaRenderizar = [
          ...empleados,
          ...empleadosSeleccionados,
        ];
        
        setEmpleadosDisponibles(empleadosParaRenderizar);
        setFilteredEmpleados(empleadosParaRenderizar);
        setEmpleadosPagination(pagination);
      } catch (error) {
        toast.error("Error al buscar empleados", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron buscar empleados.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función para manejar cambio de página de empleados
  const handleEmpleadosPageChange = (newPage: number) => {
    const fakeEvent = { key: "Enter" } as React.KeyboardEvent<HTMLInputElement>;
    handleEmpleadoSearch(fakeEvent, newPage);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched", // Solo validar cuando el campo ha sido tocado
    defaultValues: {
      clienteId: 0,
      condicionContractualId: 0,
      fechaProgramada: undefined,
      cantidadVehiculos: 1,
      ubicacion: "",
      notas: "",
      banosInstalados: undefined,
      empleadosIds: undefined,
      vehiculosIds: undefined,
      tipoServicio: ServiceType.LIMPIEZA,
      asignacionAutomatica: false,
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = form;
  const selectedClientId = watch("clienteId");
  const [selectedCondicionId, setSelectedCondicionId] = useState<number>(0);
  const selectedFechaProgramada = watch("fechaProgramada");

  // Keep selectedCondicionId in sync with form value
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "condicionContractualId") {
        setSelectedCondicionId(value.condicionContractualId as number);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  // Cargar clientes al inicio
  useEffect(() => {
    const fetchClientes = async (page: number = 1) => {
      try {
        setIsLoading(true);

        const clientesData = await getClients(page, clientesPagination.limit) as ClientesResponse;

        if (clientesData && typeof clientesData === "object") {
          let clientesList: Cliente[] = [];
          let pagination = { page: 1, totalPages: 1, total: 0, limit: clientesPagination.limit };

          // Si tiene la propiedad items, usarla
          if (clientesData.items && Array.isArray(clientesData.items)) {
            clientesList = clientesData.items;
            pagination = {
              page: clientesData.page || page,
              totalPages: clientesData.totalPages || 1,
              total: clientesData.total || clientesList.length,
              limit: clientesData.limit || clientesPagination.limit,
            };
          }
          // Si tiene la propiedad data, usarla como alternativa
          else if (clientesData.data && Array.isArray(clientesData.data)) {
            clientesList = clientesData.data;
            pagination = {
              page: clientesData.page || page,
              totalPages: clientesData.totalPages || 1,
              total: clientesData.total || clientesList.length,
              limit: clientesData.limit || clientesPagination.limit,
            };
          }
          // Si es directamente un array
          else if (Array.isArray(clientesData)) {
            clientesList = clientesData;
          }
          // Si no coincide con ninguno de los formatos esperados
          else {
            console.error("Formato de respuesta no reconocido:", clientesData);
            clientesList = [];
            toast.error("Error en el formato de datos", {
              description:
                "El servidor devolvió datos en un formato inesperado",
            });
          }

          setClientes(clientesList);
          setFilteredClientes(clientesList);
          setClientesPagination(pagination);
        } else {
          console.error(
            "La respuesta de getClients no es un objeto:",
            clientesData
          );
          setClientes([]);
          setFilteredClientes([]);
          toast.error("Error en la respuesta", {
            description: "No se recibió una respuesta válida del servidor",
          });
        }
      } catch (error) {
        console.error("Error al cargar los clientes:", error);
        toast.error("Error al cargar los clientes", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los clientes. Por favor, intente nuevamente.",
        });
        setClientes([]);
        setFilteredClientes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, [clientesPagination.limit]);

  // Función para manejar cambio de página de clientes
  const handleClientesPageChange = async (newPage: number) => {
    setIsLoading(true);
    try {
      const clientesData = await getClients(newPage, clientesPagination.limit, searchTermCliente) as ClientesResponse;
      
      if (clientesData && typeof clientesData === "object") {
        let clientesList: Cliente[] = [];
        let pagination = { page: newPage, totalPages: 1, total: 0, limit: clientesPagination.limit };

        if (clientesData.items && Array.isArray(clientesData.items)) {
          clientesList = clientesData.items;
          pagination = {
            page: clientesData.page || newPage,
            totalPages: clientesData.totalPages || 1,
            total: clientesData.total || clientesList.length,
            limit: clientesData.limit || clientesPagination.limit,
          };
        } else if (clientesData.data && Array.isArray(clientesData.data)) {
          clientesList = clientesData.data;
          pagination = {
            page: clientesData.page || newPage,
            totalPages: clientesData.totalPages || 1,
            total: clientesData.total || clientesList.length,
            limit: clientesData.limit || clientesPagination.limit,
          };
        } else if (Array.isArray(clientesData)) {
          clientesList = clientesData;
        }

        setFilteredClientes(clientesList);
        setClientesPagination(pagination);
      }
    } catch (error) {
      toast.error("Error al cargar clientes", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los clientes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar clientes en la API solo cuando se presiona Enter (searchTermCliente cambia)
  useEffect(() => {
    const fetchFilteredClientes = async (page: number = 1) => {
      if (searchTermCliente.trim() === "") {
        setFilteredClientes(clientes);
        return;
      }
      setIsLoading(true);
      try {
        // getClients puede aceptar un parámetro de búsqueda
        const clientesData = await getClients(page, clientesPagination.limit, searchTermCliente.trim()) as ClientesResponse;
        let clientesList: Cliente[] = [];
        let pagination = { page: 1, totalPages: 1, total: 0, limit: clientesPagination.limit };

        if (clientesData && typeof clientesData === "object") {
          if (clientesData.items && Array.isArray(clientesData.items)) {
            clientesList = clientesData.items;
            pagination = {
              page: clientesData.page || page,
              totalPages: clientesData.totalPages || 1,
              total: clientesData.total || clientesList.length,
              limit: clientesData.limit || clientesPagination.limit,
            };
          } else if (clientesData.data && Array.isArray(clientesData.data)) {
            clientesList = clientesData.data;
            pagination = {
              page: clientesData.page || page,
              totalPages: clientesData.totalPages || 1,
              total: clientesData.total || clientesList.length,
              limit: clientesData.limit || clientesPagination.limit,
            };
          } else if (Array.isArray(clientesData)) {
            clientesList = clientesData;
          }
        }
        setFilteredClientes(clientesList);
        setClientesPagination(pagination);
      } catch (error) {
        toast.error("Error al buscar clientes", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron buscar clientes.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFilteredClientes();
  }, [searchTermCliente, clientes, clientesPagination.limit]);

  const handleCondicionSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      const term = searchTermCondicion.trim();
      // Agregar logs para depuración
      console.log("[CondicionSearch] selectedClientId:", selectedClientId);
      console.log("[CondicionSearch] term:", term);
      setIsLoading(true);
      try {
        const condicionesData = await getContractualConditionsByClient(
          selectedClientId,
          1,
          100,
          term
        );
        let condicionesList: CondicionContractual[] = [];
        if (condicionesData && typeof condicionesData === "object") {
          if (Array.isArray(condicionesData)) {
            condicionesList = condicionesData;
          } else if (
            "items" in condicionesData &&
            Array.isArray(condicionesData.items)
          ) {
            condicionesList = condicionesData.items;
          } else if (
            "data" in condicionesData &&
            Array.isArray(condicionesData.data)
          ) {
            condicionesList = condicionesData.data;
          }
        }
        setFilteredCondiciones(condicionesList);
      } catch (error) {
        toast.error("Error al buscar condiciones contractuales", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron buscar condiciones contractuales.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchCondicionesContractuales = async () => {
      if (selectedClientId && selectedClientId > 0) {
        try {
          setIsLoading(true);

          interface CondicionesResponse {
            items?: CondicionContractual[];
            data?: CondicionContractual[];
          }
          const condicionesData = (await getContractualConditionsByClient(
            selectedClientId
          )) as CondicionesResponse | CondicionContractual[];

          let procesadas: CondicionContractual[] = [];

          if (Array.isArray(condicionesData)) {
            procesadas = condicionesData;
          } else if (condicionesData && typeof condicionesData === "object") {
            if (
              "items" in condicionesData &&
              Array.isArray(condicionesData.items)
            ) {
              procesadas = condicionesData.items;
            } else if (
              "data" in condicionesData &&
              Array.isArray(condicionesData.data)
            ) {
              procesadas = condicionesData.data;
            } else {
              console.error(
                "Formato de respuesta no reconocido:",
                condicionesData
              );
              toast.error("Error en el formato de datos", {
                description:
                  "El servidor devolvió datos en un formato inesperado",
              });
            }
          } else {
            console.error("Tipo de respuesta no esperado:", condicionesData);
            toast.error("Error en la respuesta", {
              description: "No se recibió una respuesta válida del servidor",
            });
          }

          setCondicionesContractuales(procesadas);
          setFilteredCondiciones(procesadas); // Mostrar todas por defecto

          // Solo resetear el valor si estamos cambiando de cliente
          // No lo resetea si ya se ha seleccionado una condición
          if (step === 2 && !selectedCondicionId) {
            setValue("condicionContractualId", 0);
          }
        } catch (error) {
          console.error("Error al cargar condiciones contractuales:", error);
          toast.error("Error al cargar condiciones", {
            description:
              error instanceof Error
                ? error.message
                : "No se pudieron cargar las condiciones contractuales. Por favor, intente nuevamente.",
          });
          setCondicionesContractuales([]);
          setFilteredCondiciones([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (step >= 2) {
      fetchCondicionesContractuales();
    }
  }, [selectedClientId, step, setValue, selectedCondicionId]);

  // Cargar recursos cuando se selecciona una fecha
  useEffect(() => {
    const fetchResources = async () => {
      if (selectedClientId && selectedFechaProgramada && step >= 4) {
        let shouldShowErrors = false;
        
        try {
          setIsLoading(true);

          // Pequeño delay para evitar que los errores de carga se muestren inmediatamente 
          // cuando el usuario navega al step 4
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Permitir mostrar errores después del delay
          shouldShowErrors = true;

          // Cargar empleados y vehículos disponibles con tipos correctos
          const empleadosResponse = (await getEmployees(1, empleadosPagination.limit)) as EmpleadosResponse;
          const vehiculosResponse = (await getVehicles(1, vehiculosPagination.limit)) as VehiculosResponse;

          // Procesar respuesta de empleados
          // Permitir empleados tanto en estado DISPONIBLE como ASIGNADO
          // según la lógica del negocio que permite asignar recursos a múltiples servicios
          let empleadosDisp: Empleado[] = [];
          let empleadosPag = { page: 1, totalPages: 1, total: 0, limit: empleadosPagination.limit };
          
          if (empleadosResponse && typeof empleadosResponse === "object") {
            if (empleadosResponse.data && Array.isArray(empleadosResponse.data)) {
              empleadosDisp = empleadosResponse.data.filter(
                (empleado) =>
                  empleado.estado === "DISPONIBLE" ||
                  empleado.estado === "ASIGNADO"
              );
              empleadosPag = {
                page: empleadosResponse.page || 1,
                totalPages: empleadosResponse.totalPages || 1,
                total: empleadosResponse.total || empleadosDisp.length,
                limit: empleadosResponse.limit || empleadosPagination.limit,
              };
            } else if (empleadosResponse.items && Array.isArray(empleadosResponse.items)) {
              empleadosDisp = empleadosResponse.items.filter(
                (empleado) =>
                  empleado.estado === "DISPONIBLE" ||
                  empleado.estado === "ASIGNADO"
              );
              empleadosPag = {
                page: empleadosResponse.page || 1,
                totalPages: empleadosResponse.totalPages || 1,
                total: empleadosResponse.total || empleadosDisp.length,
                limit: empleadosResponse.limit || empleadosPagination.limit,
              };
            } else {
              console.error(
                "Formato de respuesta de empleados no reconocido:",
                empleadosResponse
              );
              // Silenciar error si no debemos mostrar errores de carga de recursos aún
              if (shouldShowErrors) {
                toast.error("Error al cargar empleados", {
                  description:
                    "El servidor devolvió datos en un formato inesperado",
                });
              } else {
                console.warn("Error silenciado durante carga inicial de empleados");
              }
            }
          } else {
            console.error(
              "Tipo de respuesta de empleados no esperado:",
              empleadosResponse
            );
            // Silenciar error si no debemos mostrar errores de carga de recursos aún
            if (shouldShowErrors) {
              toast.error("Error al cargar empleados", {
                description: "No se recibió una respuesta válida del servidor",
              });
            } else {
              console.warn("Error silenciado durante carga inicial de empleados");
            }
          }

          // Procesar respuesta de vehículos
          // Permitir vehículos tanto en estado DISPONIBLE como ASIGNADO
          // según la lógica del negocio que permite asignar recursos a múltiples servicios
          let vehiculosDisp: Vehiculo[] = [];
          let vehiculosPag = { page: 1, totalPages: 1, total: 0, limit: vehiculosPagination.limit };
          
          if (vehiculosResponse && typeof vehiculosResponse === "object") {
            if (vehiculosResponse.data && Array.isArray(vehiculosResponse.data)) {
              vehiculosDisp = vehiculosResponse.data.filter(
                (vehiculo) =>
                  vehiculo.estado === "DISPONIBLE" ||
                  vehiculo.estado === "ASIGNADO"
              );
              vehiculosPag = {
                page: vehiculosResponse.page || 1,
                totalPages: vehiculosResponse.totalPages || 1,
                total: vehiculosResponse.total || vehiculosDisp.length,
                limit: vehiculosResponse.limit || vehiculosPagination.limit,
              };
            } else if (vehiculosResponse.items && Array.isArray(vehiculosResponse.items)) {
              vehiculosDisp = vehiculosResponse.items.filter(
                (vehiculo) =>
                  vehiculo.estado === "DISPONIBLE" ||
                  vehiculo.estado === "ASIGNADO"
              );
              vehiculosPag = {
                page: vehiculosResponse.page || 1,
                totalPages: vehiculosResponse.totalPages || 1,
                total: vehiculosResponse.total || vehiculosDisp.length,
                limit: vehiculosResponse.limit || vehiculosPagination.limit,
              };
            } else {
              console.error(
                "Formato de respuesta de vehículos no reconocido:",
                vehiculosResponse
              );
              // Silenciar error si no debemos mostrar errores de carga de recursos aún
              if (shouldShowErrors) {
                toast.error("Error al cargar vehículos", {
                  description:
                    "El servidor devolvió datos en un formato inesperado",
                });
              } else {
                console.warn("Error silenciado durante carga inicial de vehículos");
              }
            }
          } else {
            console.error(
              "Tipo de respuesta de vehículos no esperado:",
              vehiculosResponse
            );
            // Silenciar error si no debemos mostrar errores de carga de recursos aún
            if (shouldShowErrors) {
              toast.error("Error al cargar vehículos", {
                description: "No se recibió una respuesta válida del servidor",
              });
            } else {
              console.warn("Error silenciado durante carga inicial de vehículos");
            }
          }

          setEmpleadosDisponibles(empleadosDisp);
          setVehiculosDisponibles(vehiculosDisp);
          setFilteredVehiculos(vehiculosDisp); // Mostrar todos por defecto
          setEmpleadosPagination(empleadosPag);
          setVehiculosPagination(vehiculosPag);

          // Cargar baños instalados para el cliente con manejo adecuado de tipos
          interface SanitariosResponse {
            data?: Sanitario[];
            items?: Sanitario[];
            page?: number;
            totalPages?: number;
            total?: number;
            limit?: number;
          }

          const banosClienteResponse = (await getSanitariosByClient(
            selectedClientId
          )) as SanitariosResponse | Sanitario[];

          let sanitarios: Sanitario[] = [];
          let pagination = { page: 1, totalPages: 1, total: 0, limit: sanitariosPagination.limit };

          // Procesamiento de la respuesta
          if (Array.isArray(banosClienteResponse)) {
            sanitarios = banosClienteResponse;
          } else if (
            banosClienteResponse &&
            typeof banosClienteResponse === "object"
          ) {
            if (
              "data" in banosClienteResponse &&
              Array.isArray(banosClienteResponse.data)
            ) {
              sanitarios = banosClienteResponse.data;
              pagination = {
                page: banosClienteResponse.page || 1,
                totalPages: banosClienteResponse.totalPages || 1,
                total: banosClienteResponse.total || sanitarios.length,
                limit: banosClienteResponse.limit || sanitariosPagination.limit,
              };
            } else if (
              "items" in banosClienteResponse &&
              Array.isArray(banosClienteResponse.items)
            ) {
              sanitarios = banosClienteResponse.items;
              pagination = {
                page: banosClienteResponse.page || 1,
                totalPages: banosClienteResponse.totalPages || 1,
                total: banosClienteResponse.total || sanitarios.length,
                limit: banosClienteResponse.limit || sanitariosPagination.limit,
              };
            } else {
              console.error(
                "Formato de respuesta de baños no reconocido:",
                banosClienteResponse
              );
              sanitarios = [];
              // Silenciar error si no debemos mostrar errores de carga de recursos aún
              if (shouldShowErrors) {
                toast.error("Error al cargar baños", {
                  description:
                    "El servidor devolvió datos en un formato inesperado",
                });
              } else {
                console.warn("Error silenciado durante carga inicial de baños");
              }
            }
          } else {
            console.error(
              "Tipo de respuesta de baños no esperado:",
              banosClienteResponse
            );
            sanitarios = [];
            // Silenciar error si no debemos mostrar errores de carga de recursos aún
            if (shouldShowErrors) {
              toast.error("Error al cargar baños", {
                description: "No se recibió una respuesta válida del servidor",
              });
            } else {
              console.warn("Error silenciado durante carga inicial de baños");
            }
          }

          setBanosInstalados(sanitarios);
          setFilteredSanitarios(sanitarios);
          setSanitariosPagination(pagination);
        } catch (error) {
          console.error("Error al cargar recursos:", error);
          // Solo mostrar toast de error si debemos mostrar errores de carga de recursos
          if (shouldShowErrors) {
            toast.error("Error al cargar recursos", {
              description:
                error instanceof Error
                  ? error.message
                  : "No se pudieron cargar los recursos necesarios. Por favor, intente nuevamente.",
            });
          } else {
            console.warn("Error silenciado durante carga inicial de recursos:", error);
          }
          setEmpleadosDisponibles([]);
          setVehiculosDisponibles([]);
          setBanosInstalados([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchResources();
  }, [selectedClientId, selectedFechaProgramada, step, empleadosPagination.limit, vehiculosPagination.limit, sanitariosPagination.limit]);
  // Manejar selección de empleado
  const handleEmpleadoSelection = (empleadoId: number) => {
    const updatedSelection = selectedEmpleados.includes(empleadoId)
      ? selectedEmpleados.filter((id) => id !== empleadoId)
      : [...selectedEmpleados, empleadoId];

    // Si estamos deseleccionando un empleado, también quitarlo de los roles
    if (
      selectedEmpleados.includes(empleadoId) &&
      !updatedSelection.includes(empleadoId)
    ) {
      if (empleadoRolA === empleadoId) {
        setEmpleadoRolA(null);
      }
      if (empleadoRolB === empleadoId) {
        setEmpleadoRolB(null);
      }
    }

    setSelectedEmpleados(updatedSelection);
    setValue("empleadosIds", updatedSelection);

    // Actualizar los valores del formulario para asignaciones específicas
    updateAsignacionesManual(updatedSelection, selectedVehiculos);
  };
  // Estas funciones se utilizan directamente en los botones onClick
  // Actualizar las asignaciones manuales en el formulario
  const updateAsignacionesManual = (
    empleadosIds: number[],
    vehiculosIds: number[],
    rolA: number | null = empleadoRolA,
    rolB: number | null = empleadoRolB
  ) => {
    // Determinar empleado A y B para asignaciones
    const empleadoA =
      rolA !== null ? rolA : empleadosIds.length > 0 ? empleadosIds[0] : 0;
    const empleadoB =
      rolB !== null ? rolB : empleadosIds.length > 1 ? empleadosIds[1] : 0;

    // Asignar vehículo al empleado A (si hay vehículos seleccionados)
    const vehiculoAsignado = vehiculosIds.length > 0 ? vehiculosIds[0] : 0;

    // Las asignaciones serán usadas en onSubmit
  };

  // Manejar selección de vehículo
  const handleVehiculoSelection = (vehiculoId: number) => {
    const updatedSelection = selectedVehiculos.includes(vehiculoId)
      ? selectedVehiculos.filter((id) => id !== vehiculoId)
      : [...selectedVehiculos, vehiculoId];

    setSelectedVehiculos(updatedSelection);
    setValue("vehiculosIds", updatedSelection);
  };

  // Manejar selección de baño
  const handleBanoSelection = (banoId: number) => {
    const updatedSelection = selectedBanos.includes(banoId)
      ? selectedBanos.filter((id) => id !== banoId)
      : [...selectedBanos, banoId];

    setSelectedBanos(updatedSelection);
    setValue("banosInstalados", updatedSelection);
  };

  // Función para manejar búsqueda de vehículos con paginado
  const handleVehiculoSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    page: number = 1
  ) => {
    if (e.key === "Enter" || typeof page === "number") {
      const term = searchTermVehiculo.trim();
      setIsLoading(true);
      try {
        const vehiculosResponse = await getVehicles(
          page,
          vehiculosPagination.limit,
          term
        ) as VehiculosResponse;
        
        let vehiculos: Vehiculo[] = [];
        let pagination = { page: 1, totalPages: 1, total: 0, limit: vehiculosPagination.limit };
        
        if (vehiculosResponse && typeof vehiculosResponse === "object") {
          if (Array.isArray(vehiculosResponse)) {
            vehiculos = vehiculosResponse;
          } else if (vehiculosResponse.items && Array.isArray(vehiculosResponse.items)) {
            vehiculos = vehiculosResponse.items;
            pagination = {
              page: vehiculosResponse.page || page,
              totalPages: vehiculosResponse.totalPages || 1,
              total: vehiculosResponse.total || vehiculos.length,
              limit: vehiculosResponse.limit || vehiculosPagination.limit,
            };
          } else if (vehiculosResponse.data && Array.isArray(vehiculosResponse.data)) {
            vehiculos = vehiculosResponse.data;
            pagination = {
              page: vehiculosResponse.page || page,
              totalPages: vehiculosResponse.totalPages || 1,
              total: vehiculosResponse.total || vehiculos.length,
              limit: vehiculosResponse.limit || vehiculosPagination.limit,
            };
          }
        }
        
        vehiculos = vehiculos.filter(
          (vehiculo) =>
            vehiculo.estado === "DISPONIBLE" ||
            vehiculo.estado === "ASIGNADO"
        );
        
        setVehiculosDisponibles(vehiculos);
        setFilteredVehiculos(vehiculos);
        setVehiculosPagination(pagination);
      } catch (error) {
        toast.error("Error al buscar vehículos", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron buscar vehículos.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función para manejar cambio de página de vehículos
  const handleVehiculosPageChange = (newPage: number) => {
    const fakeEvent = { key: "Enter" } as React.KeyboardEvent<HTMLInputElement>;
    handleVehiculoSearch(fakeEvent, newPage);
  };

  // Función para manejar búsqueda de sanitarios con paginado
  const handleSanitarioSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    page: number = 1
  ) => {
    if (e.key === "Enter" || typeof page === "number") {
      const term = searchTermSanitario.trim();
      setIsLoading(true);
      try {
        // La función getSanitariosByClient no acepta parámetros de paginación,
        // así que aplicamos filtrado local
        interface SanitariosSearchResponse {
          items?: Sanitario[];
          data?: Sanitario[];
        }
        const sanitariosResponse = await getSanitariosByClient(selectedClientId!) as SanitariosSearchResponse | Sanitario[];
        
        let allSanitarios: Sanitario[] = [];
        
        if (Array.isArray(sanitariosResponse)) {
          allSanitarios = sanitariosResponse;
        } else if (sanitariosResponse && typeof sanitariosResponse === "object") {
          if ("items" in sanitariosResponse && Array.isArray(sanitariosResponse.items)) {
            allSanitarios = sanitariosResponse.items;
          } else if ("data" in sanitariosResponse && Array.isArray(sanitariosResponse.data)) {
            allSanitarios = sanitariosResponse.data;
          }
        }
        
        // Filtrar solo sanitarios instalados/disponibles
        allSanitarios = allSanitarios.filter(
          (sanitario) =>
            sanitario.estado === "INSTALADO" ||
            sanitario.estado === "DISPONIBLE"
        );
        
        // Aplicar filtro de búsqueda si hay término
        if (term) {
          allSanitarios = allSanitarios.filter(
            (sanitario) =>
              sanitario.codigo_interno?.toLowerCase().includes(term.toLowerCase()) ||
              sanitario.modelo?.toLowerCase().includes(term.toLowerCase())
          );
        }
        
        // Calcular paginación manualmente
        const total = allSanitarios.length;
        const limit = sanitariosPagination.limit;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const sanitariosPaginados = allSanitarios.slice(startIndex, endIndex);
        
        const pagination = {
          page,
          totalPages,
          total,
          limit,
        };
        
        setBanosInstalados(allSanitarios);
        setFilteredSanitarios(sanitariosPaginados);
        setSanitariosPagination(pagination);
      } catch (error) {
        toast.error("Error al buscar sanitarios", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron buscar sanitarios.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función para manejar cambio de página de sanitarios
  const handleSanitariosPageChange = (newPage: number) => {
    const fakeEvent = { key: "Enter" } as React.KeyboardEvent<HTMLInputElement>;
    handleSanitarioSearch(fakeEvent, newPage);
  }; // Avanzar al siguiente paso
  const handleNextStep = async () => {
    // Validar campos según el paso actual
    let isStepValid = false;

    switch (step) {
      case 1:
        isStepValid = await trigger("clienteId");
        break;
      case 2:
        // Verificar primero si hay condiciones contractuales disponibles
        if (condicionesContractuales.length === 0) {
          toast.error("Este cliente no tiene condiciones contractuales", {
            description:
              "Por favor, seleccione otro cliente o cree una condición contractual antes de continuar.",
          });
          return false;
        }

        isStepValid = await trigger("condicionContractualId");
        // Double-check that we have a valid condition selected
        const currentCondicionId = getValues("condicionContractualId");

        if (currentCondicionId <= 0 || !currentCondicionId) {
          // If form validation didn't catch it, enforce it here
          toast.error("Por favor seleccione una condición contractual");
          return false;
        }
        break;
      case 3:
        isStepValid = await trigger([
          "fechaProgramada",
          "cantidadVehiculos",
          "ubicacion",
        ] as const);
        break;
      default:
        isStepValid = true;
        break;
    }
    if (isStepValid) {
      setShowStepErrors(false); // Resetear errores al avanzar
      setStep((prevStep) => prevStep + 1);
    }
  };
  // Retroceder al paso anterior
  const handlePrevStep = () => {
    // Si venimos del paso 3, asegurarse de que la condición contractual esté correctamente establecida
    if (step === 3) {
      if (selectedCondicionId > 0) {
        setValue("condicionContractualId", selectedCondicionId);
      }
    }

    setShowStepErrors(false); // Resetear errores al retroceder
    setStep((prevStep) => prevStep - 1);
  };
  // Enviar formulario
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setShowStepErrors(true); // Activar la muestra de errores al intentar enviar

      // Validación manual de campos requeridos del paso 4
      // Para servicios de limpieza, los baños son opcionales (se pueden heredar del último servicio de instalación)
      // if (!data.banosInstalados || data.banosInstalados.length === 0) {
      //   toast.error("Validación de formulario", {
      //     description: "Debe seleccionar al menos un baño instalado.",
      //   });
      //   setIsSubmitting(false);
      //   return;
      // }

      if (!data.empleadosIds || data.empleadosIds.length === 0) {
        toast.error("Validación de formulario", {
          description: "Debe seleccionar al menos un empleado.",
        });
        setIsSubmitting(false);
        return;
      }

      if (!data.vehiculosIds || data.vehiculosIds.length === 0) {
        toast.error("Validación de formulario", {
          description: "Debe seleccionar al menos un vehículo.",
        });
        setIsSubmitting(false);
        return;
      }

      // Validar que haya al menos un empleado seleccionado para el rol A si hay vehículos seleccionados
      if (
        data.vehiculosIds.length > 0 &&
        empleadoRolA === null &&
        data.empleadosIds.length === 0
      ) {
        toast.error("Error en la asignación de roles", {
          description:
            "Debe seleccionar al menos un empleado para el rol de conductor (Rol A) cuando hay vehículos asignados.",
        });
        setIsSubmitting(false);
        return;
      }

      // Si hay vehículos y empleados pero no se asignó el rol A, asignar automáticamente
      if (
        data.vehiculosIds.length > 0 &&
        empleadoRolA === null &&
        data.empleadosIds.length > 0
      ) {
        setEmpleadoRolA(data.empleadosIds[0]);
        // Si hay más de un empleado y no hay rol B asignado
        if (data.empleadosIds.length > 1 && empleadoRolB === null) {
          setEmpleadoRolB(data.empleadosIds[1]);
        }
        // Notificar al usuario
        toast.info("Roles asignados automáticamente", {
          description:
            "Se han asignado roles automáticamente a los empleados seleccionados.",
        });
      }

      // Determinar quiénes son los empleados para los roles A y B
      // Si hay roles asignados explícitamente, usarlos; si no, usar los primeros empleados seleccionados
      const empleadoA =
        empleadoRolA !== null
          ? empleadoRolA
          : data.empleadosIds.length > 0
          ? data.empleadosIds[0]
          : 0;

      // Para el empleado B, si hay un rol asignado, usarlo;
      // si no, usar el segundo empleado seleccionado o el primero si solo hay uno y no es el mismo que empleadoA
      const empleadoB =
        empleadoRolB !== null
          ? empleadoRolB
          : data.empleadosIds.length > 1
          ? data.empleadosIds[0] !== empleadoA
            ? data.empleadosIds[0]
            : data.empleadosIds[1]
          : data.empleadosIds.length === 1 && data.empleadosIds[0] !== empleadoA
          ? data.empleadosIds[0]
          : 0;

      const empleadoAObj = empleadoA
        ? empleadosDisponibles.find((e: Empleado) => e.id === empleadoA)
        : null;
      const empleadoBObj = empleadoB
        ? empleadosDisponibles.find((e: Empleado) => e.id === empleadoB)
        : null;

      const empleadoANombre = empleadoAObj
        ? `${empleadoAObj.nombre} ${empleadoAObj.apellido}`
        : "Ninguno";
      const empleadoBNombre = empleadoBObj
        ? `${empleadoBObj.nombre} ${empleadoBObj.apellido}`
        : "Ninguno";

      // Preparar las asignaciones manuales según el formato exacto requerido por CreateLimpiezaDto
      const asignacionesManual: [
        { empleadoId: number; vehiculoId: number; rol: string },
        { empleadoId: number; rol: string }
      ] = [
        {
          // Rol A: Conductor principal con vehículo
          empleadoId: empleadoA,
          vehiculoId: data.vehiculosIds.length > 0 ? data.vehiculosIds[0] : 0,
          rol: "A",
        },
        {
          // Rol B: Empleado adicional/asistente
          empleadoId: empleadoB,
          rol: "B",
        },
      ];

      // Objeto para enviar a la API - usando la estructura exacta de CreateLimpiezaDto
      const servicioRequest: CreateLimpiezaDto = {
        tipoServicio: "LIMPIEZA", // Tipo literal exacto
        condicionContractualId:
          selectedCondicionId || data.condicionContractualId,
        cantidadVehiculos: data.cantidadVehiculos,
        fechaProgramada: data.fechaProgramada.toISOString(),
        ubicacion: data.ubicacion,
        asignacionAutomatica: false,
        banosInstalados: data.banosInstalados || [],
        asignacionesManual: asignacionesManual,
        notas: data.notas || "Limpieza mensual según contrato",
      };

      // Verificación adicional
      if (
        !servicioRequest.condicionContractualId ||
        servicioRequest.condicionContractualId <= 0
      ) {
        toast.error("Error en el formulario", {
          description: "Por favor seleccione una condición contractual válida.",
        });
        return;
      }

      // Crear el servicio y tipar correctamente la respuesta
      // Define ServicioResponse type if not imported
      type ServicioResponse = {
        id?: number;
        success?: boolean;
        message?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      };

      const response = (await createServicioGenerico(
        servicioRequest
      )) as ServicioResponse;

      // Verificar la respuesta
      if (response && response.id) {
        toast.success("Servicio de limpieza creado", {
          description: `El servicio de limpieza #${response.id} se ha creado exitosamente.`,
        });
      } else if (response && response.success) {
        toast.success("Servicio de limpieza creado", {
          description:
            response.message ||
            "El servicio de limpieza se ha creado exitosamente.",
        });
      } else {
        toast.success("Servicio de limpieza creado", {
          description: "El servicio de limpieza se ha creado exitosamente.",
        });
      }

      // Redireccionar a la página de listado de servicios después de un breve retraso
      setTimeout(() => {
        router.push("/admin/dashboard/servicios/listado");
      }, 1000);
    } catch (error) {
      console.error("Error al crear el servicio:", error);

      // Extraer el mensaje de error
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo crear el servicio. Por favor, intente nuevamente.";

      // Mostrar toast con el mensaje específico del error
      toast.error("Error al crear el servicio", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && step === 1) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Bath className="h-6 w-6" />
              Crear Servicio de Limpieza
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {step === 1 && "Seleccione el cliente para el nuevo servicio de limpieza"}
              {step === 2 && "Seleccione la condición contractual aplicable"}
              {step === 3 && "Defina la fecha y detalles del servicio de limpieza"}
              {step === 4 && "Asigne los recursos necesarios para el servicio"}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 text-base px-3 py-1"
          >
            Paso {step} de 4
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
            <form
              onSubmit={handleSubmit(
                (data) => {
                  onSubmit(data);
                },
                (errors) => {
                  console.error("Form validation failed:", errors);
                  return false;
                }
              )}
            >
              {/* Paso 1: Selección de Cliente */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Selección de Cliente
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Seleccione el cliente para el cual se realizará el servicio de limpieza
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Buscar cliente por nombre, CUIT o email..."
                      className="pl-10"
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setSearchTermCliente(searchInputValue);
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredClientes.map((cliente) => (
                      <div
                        key={cliente.clienteId}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedClientId === cliente.clienteId
                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                        onClick={async () => {
                          if (cliente.clienteId !== undefined) {
                            setValue("clienteId", cliente.clienteId);
                            // Reset condicionContractualId when changing clients to avoid confusion
                            if (selectedClientId !== cliente.clienteId) {
                              setValue("condicionContractualId", 0);
                              setSelectedCondicionId(0);

                              // Verificar si el cliente tiene condiciones contractuales
                              try {
                                setIsLoading(true);

                                interface CondicionesResponse {
                                  items?: CondicionContractual[];
                                  data?: CondicionContractual[];
                                }

                                const condicionesData =
                                  (await getContractualConditionsByClient(
                                    cliente.clienteId
                                  )) as
                                    | CondicionesResponse
                                    | CondicionContractual[];

                                let condiciones: CondicionContractual[] = [];

                                if (Array.isArray(condicionesData)) {
                                  condiciones = condicionesData;
                                } else if (
                                  condicionesData &&
                                  typeof condicionesData === "object"
                                ) {
                                  if (
                                    "items" in condicionesData &&
                                    Array.isArray(condicionesData.items)
                                  ) {
                                    condiciones = condicionesData.items;
                                  } else if (
                                    "data" in condicionesData &&
                                    Array.isArray(condicionesData.data)
                                  ) {
                                    condiciones = condicionesData.data;
                                  }
                                }

                                if (condiciones.length === 0) {
                                  toast.warning(
                                    `${cliente.nombre} no tiene condiciones contractuales`,
                                    {
                                      description:
                                        "Este cliente no tiene condiciones contractuales configuradas, lo que será necesario para crear un servicio.",
                                      duration: 5000,
                                    }
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error al verificar condiciones contractuales:",
                                  error
                                );
                              } finally {
                                setIsLoading(false);
                              }
                            }
                          }
                        }}
                      >
                        <div className="flex items-start">
                          <div
                            className={`w-4 h-4 mt-1 mr-3 rounded-full border flex items-center justify-center ${
                              selectedClientId === cliente.clienteId
                                ? "border-indigo-500 bg-indigo-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedClientId === cliente.clienteId && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {cliente.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              CUIT: {cliente.cuit}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cliente.email}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {cliente.direccion}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.clienteId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.clienteId.message}
                    </p>
                  )}
                  
                  {/* Paginación de clientes */}
                  {clientesPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Mostrando {filteredClientes.length} de {clientesPagination.total} clientes
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClientesPageChange(clientesPagination.page - 1)}
                          disabled={clientesPagination.page <= 1}
                        >
                          Anterior
                        </Button>
                        
                        <span className="text-sm text-gray-600">
                          Página {clientesPagination.page} de {clientesPagination.totalPages}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClientesPageChange(clientesPagination.page + 1)}
                          disabled={clientesPagination.page >= clientesPagination.totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Condición Contractual */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Selección de Condición Contractual
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Seleccione la condición contractual que define los términos del servicio
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      className="pl-10"
                      placeholder="Buscar por tipo de servicio, periodicidad, etc..."
                      value={searchTermCondicion}
                      onChange={(e) => {
                        setSearchTermCondicion(e.target.value);
                        if (e.target.value.trim() === "") {
                          setFilteredCondiciones(condicionesContractuales);
                        }
                      }}
                      onKeyDown={handleCondicionSearch}
                      disabled={isLoading}
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader className="h-6 w-6 text-indigo-500" />
                    </div>
                  ) : condicionesContractuales.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-red-400 mb-3" />
                        <p className="text-red-700 font-semibold mb-2">
                          No hay condiciones contractuales disponibles
                        </p>
                        <p className="text-red-600 mb-4 max-w-md">
                          Este cliente no tiene condiciones contractuales configuradas. 
                          Primero debe crear al menos una condición contractual para poder asignarle un servicio.
                        </p>
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" /> 
                          Seleccionar otro cliente
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredCondiciones.map((condicion) => (
                        <div
                          key={condicion.condicionContractualId}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedCondicionId === condicion.condicionContractualId
                              ? "border-indigo-500 bg-indigo-50 shadow-md"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                          onClick={() => {
                            setValue("condicionContractualId", condicion.condicionContractualId);
                            setSelectedCondicionId(condicion.condicionContractualId);
                          }}
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-4 h-4 mt-1 mr-3 rounded-full border flex items-center justify-center ${
                                selectedCondicionId === condicion.condicionContractualId
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedCondicionId === condicion.condicionContractualId && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-2">
                                {condicion.tipo_servicio}
                              </div>
                              <div className="text-sm text-gray-500 mb-1">
                                Período: {new Date(condicion.fecha_inicio).toLocaleDateString()} - {new Date(condicion.fecha_fin).toLocaleDateString()}
                              </div>
                              {isAdmin && (
                                <div className="text-sm text-gray-500 mb-2">
                                  Tarifa: ${condicion.tarifa} ({condicion.periodicidad})
                                </div>
                              )}
                              {condicion.condiciones_especificas && (
                                <div className="text-sm text-gray-500 mb-2">
                                  <span className="font-medium">Condiciones:</span> {condicion.condiciones_especificas}
                                </div>
                              )}
                              <Badge
                                className={`text-xs ${
                                  condicion.estado === "Activo"
                                    ? "bg-green-100 text-green-700"
                                    : condicion.estado === "Terminado"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {condicion.estado}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.condicionContractualId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.condicionContractualId.message}
                    </p>
                  )}
                </div>
              )}

              {/* Paso 3: Detalles de Limpieza */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Clipboard className="h-5 w-5" />
                      Detalles del Servicio de Limpieza
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure los detalles específicos del servicio de limpieza
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha Programada */}
                    <Controller
                      name="fechaProgramada"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Fecha y Hora Programada
                          </label>
                          <SimpleDatePicker
                            date={field.value}
                            onChange={(date) => field.onChange(date)}
                            format="dd/MM/yyyy"
                            placeholder="Seleccione fecha y hora"
                            className="w-full"
                            showTimeSelect={true}
                          />
                          {errors.fechaProgramada && (
                            <p className="text-red-500 text-sm">
                              {errors.fechaProgramada.message}
                            </p>
                          )}
                        </div>
                      )}
                    />

                    {/* Cantidad de Vehículos */}
                    <Controller
                      name="cantidadVehiculos"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Cantidad de Vehículos"
                          name="cantidadVehiculos"
                          type="number"
                          value={field.value?.toString() || "1"}
                          onChange={(value) =>
                            field.onChange(parseInt(value, 10))
                          }
                          error={fieldState.error?.message}
                          min={1}
                        />
                      )}
                    />
                  </div>

                  {/* Ubicación */}
                  <Controller
                    name="ubicacion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="Ubicación"
                        name="ubicacion"
                        value={field.value || ""}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                        placeholder="Dirección completa donde se realizará el servicio"
                      />
                    )}
                  />

                  {/* Notas */}
                  <Controller
                    name="notas"
                    control={control}
                    render={({ field }) => (
                      <FormField
                        label="Notas Adicionales"
                        name="notas"
                        type="textarea"
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Instrucciones especiales, contactos en sitio, etc."
                      />
                    )}
                  />
                </div>
              )}

              {/* Paso 4: Asignación de Recursos */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Bath className="h-5 w-5" />
                      Selección de Recursos
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Asigne los empleados, vehículos y baños necesarios para el servicio
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Selección de Baños Instalados */}
                      <div>
                        <div className="relative mb-4">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            className="pl-10"
                            placeholder="Buscar por código interno o modelo..."
                            value={searchTermSanitario}
                            onChange={(e) => {
                              setSearchTermSanitario(e.target.value);
                              if (e.target.value.trim() === "") {
                                setFilteredSanitarios(banosInstalados);
                              }
                            }}
                            onKeyDown={handleSanitarioSearch}
                          />
                        </div>
                        
                        <h3 className="text-lg font-medium mb-3 flex items-center justify-between">
                          Seleccionar Baños Instalados
                          <Badge variant="outline" className="bg-blue-50">
                            {selectedBanos.length} seleccionados
                          </Badge>
                        </h3>

                        {filteredSanitarios.length === 0 ? (
                          <div className="text-center py-8 border rounded-md">
                            <p className="text-gray-500">
                              {searchTermSanitario.trim() ? "No se encontraron baños que coincidan con la búsqueda." : "No hay baños instalados para este cliente."}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSanitarios.map((bano) => (
                              <div
                                key={bano.baño_id}
                                className={`border p-3 rounded-md cursor-pointer transition-colors ${
                                  selectedBanos.includes(
                                    parseInt(bano.baño_id || "0")
                                  )
                                    ? "bg-blue-50 border-blue-300"
                                    : "hover:bg-slate-50"
                                }`}
                                onClick={() =>
                                  handleBanoSelection(
                                    parseInt(bano.baño_id || "0")
                                  )
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      Código: {bano.codigo_interno}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Modelo: {bano.modelo}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Adquirido:{" "}
                                      {new Date(
                                        bano.fecha_adquisicion
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge
                                    className={
                                      bano.estado === "ASIGNADO"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {bano.estado}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {errors.banosInstalados && (
                          <p className="text-red-500 text-sm mt-2">
                            {errors.banosInstalados.message}
                          </p>
                        )}
                        
                        {/* Paginación de sanitarios */}
                        {sanitariosPagination.totalPages > 1 && (
                          <div className="mt-4">
                            <PaginationLocal
                              currentPage={sanitariosPagination.page}
                              total={sanitariosPagination.totalPages}
                              onChangePage={handleSanitariosPageChange}
                            />
                          </div>
                        )}
                      </div>{" "}
                      {/* Selección de Empleados */}
                      <div>
                        <Input
                          className="pl-10"
                          placeholder="Buscar por nombre, apellido o cargo..."
                          value={searchTermEmpleado}
                          onChange={(e) => {
                            setSearchTermEmpleado(e.target.value);
                            if (e.target.value.trim() === "") {
                              // Si se borra el input, recargar empleados sin filtro
                              (async () => {
                                setIsLoading(true);
                                try {
                                  const empleadosResponseRaw = await getEmployees(1, empleadosPagination.limit, "") as EmpleadosResponse;
                                  let empleados: Empleado[] = [];
                                  let pagination = { page: 1, totalPages: 1, total: 0, limit: empleadosPagination.limit };
                                  
                                  if (empleadosResponseRaw && typeof empleadosResponseRaw === "object") {
                                    if (Array.isArray(empleadosResponseRaw)) {
                                      empleados = empleadosResponseRaw;
                                    } else if (empleadosResponseRaw.items && Array.isArray(empleadosResponseRaw.items)) {
                                      empleados = empleadosResponseRaw.items;
                                      pagination = {
                                        page: empleadosResponseRaw.page || 1,
                                        totalPages: empleadosResponseRaw.totalPages || 1,
                                        total: empleadosResponseRaw.total || empleados.length,
                                        limit: empleadosResponseRaw.limit || empleadosPagination.limit,
                                      };
                                    } else if (empleadosResponseRaw.data && Array.isArray(empleadosResponseRaw.data)) {
                                      empleados = empleadosResponseRaw.data;
                                      pagination = {
                                        page: empleadosResponseRaw.page || 1,
                                        totalPages: empleadosResponseRaw.totalPages || 1,
                                        total: empleadosResponseRaw.total || empleados.length,
                                        limit: empleadosResponseRaw.limit || empleadosPagination.limit,
                                      };
                                    }
                                  }
                                  empleados = empleados.filter(
                                    (empleado) =>
                                      empleado.estado === "DISPONIBLE" ||
                                      empleado.estado === "ASIGNADO"
                                  );
                                  setEmpleadosDisponibles(empleados);
                                  setFilteredEmpleados(empleados);
                                  setEmpleadosPagination(pagination);
                                } catch (error) {
                                  toast.error("Error al cargar empleados", {
                                    description:
                                      error instanceof Error
                                        ? error.message
                                        : "No se pudieron cargar empleados.",
                                  });
                                } finally {
                                  setIsLoading(false);
                                }
                              })();
                            }
                          }}
                          onKeyDown={handleEmpleadoSearch}
                        />{" "}
                        <h3 className="text-lg font-medium mb-3 flex items-center justify-between">
                          Seleccionar Empleados
                          <Badge variant="outline" className="bg-blue-50">
                            {selectedEmpleados.length} seleccionados
                          </Badge>
                        </h3>{" "}
                        <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm">
                          <p className="font-medium mb-1">
                            Asignación de roles:
                          </p>
                          <p>
                            <span className="font-medium">Rol A (azul):</span>{" "}
                            Conductor principal con vehículo asignado
                          </p>
                          <p>
                            <span className="font-medium">Rol B (verde):</span>{" "}
                            Asistente/s
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Después de seleccionar un empleado, puede asignarle
                            un rol haciendo clic en los botones de &quot;Rol
                            A&quot; o &quot;Rol B&quot;
                          </p>

                          {/* Resumen de asignaciones actuales */}
                          {(empleadoRolA !== null || empleadoRolB !== null) && (
                            <div className="mt-3 pt-2 border-t border-blue-200">
                              <p className="font-medium mb-1">
                                Asignaciones actuales:
                              </p>
                              {empleadoRolA !== null &&
                                empleadosDisponibles && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-600">Rol A</Badge>
                                    <span>
                                      {
                                        empleadosDisponibles.find(
                                          (e: Empleado) => e.id === empleadoRolA
                                        )?.nombre
                                      }{" "}
                                      {
                                        empleadosDisponibles.find(
                                          (e: Empleado) => e.id === empleadoRolA
                                        )?.apellido
                                      }
                                    </span>
                                  </div>
                                )}
                              {empleadoRolB !== null &&
                                empleadosDisponibles && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-green-600">
                                      Rol B
                                    </Badge>
                                    <span>
                                      {
                                        empleadosDisponibles.find(
                                          (e: Empleado) => e.id === empleadoRolB
                                        )?.nombre
                                      }{" "}
                                      {
                                        empleadosDisponibles.find(
                                          (e: Empleado) => e.id === empleadoRolB
                                        )?.apellido
                                      }
                                    </span>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                        {empleadosDisponibles.length === 0 ? (
                          <div className="text-center py-8 border rounded-md">
                            <p className="text-gray-500">
                              No hay empleados disponibles.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {empleadosDisponibles.map((empleado) => (
                              <div
                                key={empleado.id}
                                className={`border p-3 rounded-md cursor-pointer transition-colors ${
                                  selectedEmpleados.includes(empleado.id)
                                    ? "bg-blue-50 border-blue-300"
                                    : "hover:bg-slate-50"
                                }`}
                                onClick={() =>
                                  handleEmpleadoSelection(empleado.id)
                                }
                              >
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-3">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                        selectedEmpleados.includes(empleado.id)
                                          ? "bg-blue-500"
                                          : "bg-slate-400"
                                      }`}
                                    >
                                      {empleado.nombre.charAt(0)}
                                      {empleado.apellido.charAt(0)}
                                    </div>
                                  </div>{" "}
                                  <div className="flex-grow">
                                    <p className="font-medium">{`${empleado.apellido}, ${empleado.nombre}`}</p>
                                    <p className="text-xs text-gray-500">{`DNI: ${empleado.documento}`}</p>
                                    <p className="text-xs text-gray-500">{`Cargo: ${empleado.cargo}`}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className="bg-green-100 text-green-800 hover:bg-green-100"
                                      >
                                        {empleado.estado}
                                      </Badge>

                                      {selectedEmpleados.includes(
                                        empleado.id
                                      ) && (
                                        <div className="flex gap-1 mt-1">
                                          <Badge
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEmpleadoRolA(empleado.id);
                                              if (
                                                empleadoRolB === empleado.id
                                              ) {
                                                setEmpleadoRolB(null);
                                              }
                                            }}
                                            className={`cursor-pointer ${
                                              empleadoRolA === empleado.id
                                                ? "bg-blue-600 hover:bg-blue-700"
                                                : "bg-gray-300 hover:bg-gray-400"
                                            }`}
                                          >
                                            Rol A
                                          </Badge>
                                          <Badge
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEmpleadoRolB(empleado.id);
                                              if (
                                                empleadoRolA === empleado.id
                                              ) {
                                                setEmpleadoRolA(null);
                                              }
                                            }}
                                            className={`cursor-pointer ${
                                              empleadoRolB === empleado.id
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-gray-300 hover:bg-gray-400"
                                            }`}
                                          >
                                            Rol B
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {errors.empleadosIds && showStepErrors && (
                          <p className="text-red-500 text-sm mt-2">
                            {errors.empleadosIds.message}
                          </p>
                        )}
                        
                        {/* Paginación de empleados */}
                        {empleadosPagination.totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <div className="text-sm text-gray-500">
                              Mostrando {filteredEmpleados.length} de {empleadosPagination.total} empleados
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEmpleadosPageChange(empleadosPagination.page - 1)}
                                disabled={empleadosPagination.page <= 1}
                              >
                                Anterior
                              </Button>
                              
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: empleadosPagination.totalPages }, (_, i) => i + 1)
                                  .filter(pageNum => 
                                    pageNum === 1 || 
                                    pageNum === empleadosPagination.totalPages || 
                                    Math.abs(pageNum - empleadosPagination.page) <= 1
                                  )
                                  .map((pageNum, index, array) => (
                                    <React.Fragment key={pageNum}>
                                      {index > 0 && array[index - 1] !== pageNum - 1 && (
                                        <span className="px-2 text-gray-400">...</span>
                                      )}
                                      <Button
                                        variant={pageNum === empleadosPagination.page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleEmpleadosPageChange(pageNum)}
                                      >
                                        {pageNum}
                                      </Button>
                                    </React.Fragment>
                                  ))}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEmpleadosPageChange(empleadosPagination.page + 1)}
                                disabled={empleadosPagination.page >= empleadosPagination.totalPages}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Selección de Vehículos */}
                      <div>
                        <Input
                          className="pl-10"
                          placeholder="Buscar por marca, modelo o placa..."
                          value={searchTermVehiculo}
                          onChange={(e) => {
                            setSearchTermVehiculo(e.target.value);
                            if (e.target.value.trim() === "") {
                              setFilteredVehiculos(vehiculosDisponibles);
                            }
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              const term = searchTermVehiculo.trim();
                              setIsLoading(true);
                              try {
                                const vehiculosResponse = await getVehicles(
                                  vehiculosPagination.page,
                                  vehiculosPagination.limit,
                                  term
                                ) as VehiculosResponse;
                                
                                let vehiculos: Vehiculo[] = [];
                                let pagination = { page: 1, totalPages: 1, total: 0, limit: vehiculosPagination.limit };
                                
                                if (vehiculosResponse && typeof vehiculosResponse === "object") {
                                  if (Array.isArray(vehiculosResponse)) {
                                    vehiculos = vehiculosResponse;
                                  } else if (vehiculosResponse.items && Array.isArray(vehiculosResponse.items)) {
                                    vehiculos = vehiculosResponse.items;
                                    pagination = {
                                      page: vehiculosResponse.page || 1,
                                      totalPages: vehiculosResponse.totalPages || 1,
                                      total: vehiculosResponse.total || vehiculos.length,
                                      limit: vehiculosResponse.limit || vehiculosPagination.limit,
                                    };
                                  } else if (vehiculosResponse.data && Array.isArray(vehiculosResponse.data)) {
                                    vehiculos = vehiculosResponse.data;
                                    pagination = {
                                      page: vehiculosResponse.page || 1,
                                      totalPages: vehiculosResponse.totalPages || 1,
                                      total: vehiculosResponse.total || vehiculos.length,
                                      limit: vehiculosResponse.limit || vehiculosPagination.limit,
                                    };
                                  }
                                }
                                
                                vehiculos = vehiculos.filter(
                                  (vehiculo) =>
                                    vehiculo.estado === "DISPONIBLE" ||
                                    vehiculo.estado === "ASIGNADO"
                                );
                                
                                setVehiculosDisponibles(vehiculos);
                                setFilteredVehiculos(vehiculos);
                                setVehiculosPagination(pagination);
                              } catch (error) {
                                toast.error("Error al buscar vehículos", {
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "No se pudieron buscar vehículos.",
                                });
                              } finally {
                                setIsLoading(false);
                              }
                            }
                          }}
                        />
                        <h3 className="text-lg font-medium mb-3 flex items-center justify-between">
                          Seleccionar Vehículos
                          <Badge variant="outline" className="bg-blue-50">
                            {selectedVehiculos.length} seleccionados
                          </Badge>
                        </h3>

                        {filteredVehiculos.length === 0 ? (
                          <div className="text-center py-8 border rounded-md">
                            <p className="text-gray-500">
                              No hay vehículos disponibles.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vehiculosDisponibles.map((vehiculo) => (
                              <div
                                key={vehiculo.id}
                                className={`border p-3 rounded-md cursor-pointer transition-colors ${
                                  selectedVehiculos.includes(vehiculo.id)
                                    ? "bg-blue-50 border-blue-300"
                                    : "hover:bg-slate-50"
                                }`}
                                onClick={() =>
                                  handleVehiculoSelection(vehiculo.id)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-grow">
                                    <p className="font-medium">
                                      {vehiculo.marca} {vehiculo.modelo}
                                    </p>
                                    <p className="text-sm">
                                      Placa: {vehiculo.placa}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {vehiculo.anio} •{" "}
                                      {vehiculo.tipoCabina || "N/A"}
                                    </p>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">
                                    {vehiculo.estado}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {errors.vehiculosIds && (
                          <p className="text-red-500 text-sm mt-2">
                            {errors.vehiculosIds.message}
                          </p>
                        )}
                        
                        {/* Paginación de vehículos */}
                        {vehiculosPagination.totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <div className="text-sm text-gray-500">
                              Mostrando {filteredVehiculos.length} de {vehiculosPagination.total} vehículos
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVehiculosPageChange(vehiculosPagination.page - 1)}
                                disabled={vehiculosPagination.page <= 1}
                              >
                                Anterior
                              </Button>
                              
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: vehiculosPagination.totalPages }, (_, i) => i + 1)
                                  .filter(pageNum => 
                                    pageNum === 1 || 
                                    pageNum === vehiculosPagination.totalPages || 
                                    Math.abs(pageNum - vehiculosPagination.page) <= 1
                                  )
                                  .map((pageNum, index, array) => (
                                    <React.Fragment key={pageNum}>
                                      {index > 0 && array[index - 1] !== pageNum - 1 && (
                                        <span className="px-2 text-gray-400">...</span>
                                      )}
                                      <Button
                                        variant={pageNum === vehiculosPagination.page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleVehiculosPageChange(pageNum)}
                                      >
                                        {pageNum}
                                      </Button>
                                    </React.Fragment>
                                  ))}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVehiculosPageChange(vehiculosPagination.page + 1)}
                                disabled={vehiculosPagination.page >= vehiculosPagination.totalPages}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex items-center justify-between pt-6 border-t">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                ) : (
                  <div></div>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Crear Servicio
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
      </CardContent>
    </Card>
  );
}
