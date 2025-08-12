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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getClients } from "@/app/actions/clientes";
import { getContractualConditionsByClient } from "@/app/actions/contractualConditions";
import { createServiceInstalacion } from "@/app/actions/services";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/local/Loader";
import { Cliente, Empleado, Sanitario, Vehiculo } from "@/types/types";
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
} from "lucide-react";
import { CustomDatePicker } from "@/components/ui/local/CustomDatePicker";
import { getEmployees } from "@/app/actions/empleados";
import { getVehicles } from "@/app/actions/vehiculos";
import { getSanitarios } from "@/app/actions/sanitarios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PaginationLocal } from "@/components/ui/local/PaginationLocal";

// Combined schema
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
  notas: z.string().optional(),
  // Step 4
  empleadosIds: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos un empleado"),
  vehiculosIds: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos un vehículo"),
  banosIds: z.array(z.number()).optional(),

  // Additional fields for service creation
  tipoServicio: z.string().min(1, "El tipo de servicio es obligatorio"),
  cantidadEmpleados: z.number().min(1, "Debe especificar al menos 1 empleado"),
  cantidadBanos: z
    .number()
    .min(0, "La cantidad de baños no puede ser negativa"),
  asignacionAutomatica: z.boolean(),

  // Campos opcionales para empleados A y B
  empleadoAId: z.number().optional(),
  empleadoBId: z.number().optional(),
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
  cantidad_banos?: number;
};

export default function CrearInstalacionComponent() {
  // Estado para búsqueda de baños
  const [searchTermBano, setSearchTermBano] = useState<string>("");
  const [filteredBanos, setFilteredBanos] = useState<Sanitario[]>([]);
  // Estado para búsqueda de empleados
  const [searchTermEmpleado, setSearchTermEmpleado] = useState<string>("");
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  // Filtrar empleados según búsqueda

  const router = useRouter();
  const { isAdmin } = useCurrentUser();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCondicionContractualId, setSelectedCondicionContractualId] =
    useState<number>(0);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTermCliente, setSearchTermCliente] = useState<string>("");

  const [condicionesContractuales, setCondicionesContractuales] = useState<
    CondicionContractual[]
  >([]);
  const [cantidadBanosRequired, setCantidadBanosRequired] = useState<number>(0);

  const [empleadosDisponibles, setEmpleadosDisponibles] = useState<Empleado[]>(
    []
  );
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<Vehiculo[]>(
    []
  );
  const [banosDisponibles, setBanosDisponibles] = useState<Sanitario[]>([]);
  // Estados para paginación de baños
  const [banosPage, setBanosPage] = useState<number>(1);
  const [banosTotalPages, setBanosTotalPages] = useState<number>(1);
  const [banosTotal, setBanosTotal] = useState<number>(0);
  const [isLoadingBanos, setIsLoadingBanos] = useState<boolean>(false);

  // Estados para paginación de empleados
  const [empleadosPagination, setEmpleadosPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15
  });

  // Estados para paginación de vehículos
  const [vehiculosPagination, setVehiculosPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15
  });

  // Estados para paginación de clientes
  const [clientesPagination, setClientesPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15
  });

  // Estado para asignación de roles A y B
  const [empleadoRolA, setEmpleadoRolA] = useState<number | null>(null);
  const [empleadoRolB, setEmpleadoRolB] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTermCondicion, setSearchTermCondicion] = useState<string>("");
  const [filteredCondiciones, setFilteredCondiciones] = useState<
    CondicionContractual[]
  >([]);

  // Estado para búsqueda de vehículos
  const [searchTermVehiculo, setSearchTermVehiculo] = useState<string>("");
  const [filteredVehiculos, setFilteredVehiculos] = useState<Vehiculo[]>([]);
  // Actualizar filteredVehiculos cuando cambia vehiculosDisponibles o searchTermVehiculo
  useEffect(() => {
    if (!searchTermVehiculo.trim()) {
      setFilteredVehiculos(vehiculosDisponibles);
    } else {
      const term = searchTermVehiculo.toLowerCase();
      setFilteredVehiculos(
        vehiculosDisponibles.filter(
          (vehiculo: Vehiculo) =>
            (vehiculo.marca && vehiculo.marca.toLowerCase().includes(term)) ||
            (vehiculo.modelo && vehiculo.modelo.toLowerCase().includes(term)) ||
            (vehiculo.placa && vehiculo.placa.toLowerCase().includes(term))
        )
      );
    }
  }, [vehiculosDisponibles, searchTermVehiculo]);
  // Estado para búsqueda de condiciones contractuales
  // Actualizar filteredCondiciones cuando cambia condicionesContractuales
  useEffect(() => {
    setFilteredCondiciones(condicionesContractuales);
  }, [condicionesContractuales]);

  // Handler para el search de condiciones contractuales
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
          15,
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

  // Buscar empleados en la API al presionar Enter
  useEffect(() => {
    setFilteredEmpleados(empleadosDisponibles);
  }, [empleadosDisponibles]);

  const handleEmpleadoSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      const term = searchTermEmpleado.trim();
      setIsLoading(true);
      try {
        // getEmployees puede aceptar un parámetro de búsqueda
        const empleadosResponseRaw = await getEmployees(1, 15, term);
        let empleados: Empleado[] = [];
        if (empleadosResponseRaw && typeof empleadosResponseRaw === "object") {
          if (Array.isArray(empleadosResponseRaw)) {
            empleados = empleadosResponseRaw;
          } else if (
            "items" in empleadosResponseRaw &&
            Array.isArray(empleadosResponseRaw.items)
          ) {
            empleados = empleadosResponseRaw.items;
          } else if (
            "data" in empleadosResponseRaw &&
            Array.isArray(empleadosResponseRaw.data)
          ) {
            empleados = empleadosResponseRaw.data;
          }
        }
        // Filtrar por estado DISPONIBLE o ASIGNADO
        empleados = empleados.filter(
          (empleado) =>
            empleado.estado === "DISPONIBLE" || empleado.estado === "ASIGNADO"
        );

        // Mezclar empleados seleccionados que no estén en el resultado actual
        const empleadosSeleccionadosIds = getValues("empleadosIds") || [];
        const empleadosSeleccionados = empleadosDisponibles.filter((emp) =>
          empleadosSeleccionadosIds.includes(emp.id)
        );
        // Agregar empleados seleccionados que no estén en la búsqueda actual
        const empleadosNoIncluidos = empleadosSeleccionados.filter(
          (empSel) => !empleados.some((emp) => emp.id === empSel.id)
        );
        const empleadosFinal = [...empleadosNoIncluidos, ...empleados];

        setEmpleadosDisponibles(empleadosFinal);
        setFilteredEmpleados(empleadosFinal);
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId: 0,
      condicionContractualId: 0,
      fechaProgramada: undefined,
      cantidadVehiculos: 1,
      ubicacion: "",
      notas: "",
      empleadosIds: [],
      vehiculosIds: [],
      banosIds: [],
      tipoServicio: "INSTALACION",
      cantidadEmpleados: 1,
      cantidadBanos: 0,
      asignacionAutomatica: false,
      empleadoAId: undefined,
      empleadoBId: undefined,
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
  const selectedCondicionId = watch("condicionContractualId");
  const selectedFechaProgramada = watch("fechaProgramada");
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setIsLoading(true);
        // Tipar correctamente la respuesta
        interface ClienteResponse {
          items?: Cliente[];
          data?: Cliente[];
          total?: number;
          totalItems?: number;
          page?: number;
          totalPages?: number;
          limit?: number;
        }

        const clientesData = (await getClients(clientesPagination.page, clientesPagination.limit)) as ClienteResponse;

        if (clientesData && typeof clientesData === "object") {
          // Determinar qué propiedad contiene los datos (items o data)
          if ("items" in clientesData && Array.isArray(clientesData.items)) {
            setClientes(clientesData.items);
            setFilteredClientes(clientesData.items);
            setClientesPagination({
              page: clientesData.page || 1,
              totalPages: clientesData.totalPages || 1,
              total: clientesData.total || 0,
              limit: clientesData.limit || 15
            });
          } else if (
            "data" in clientesData &&
            Array.isArray(clientesData.data)
          ) {
            setClientes(clientesData.data);
            setFilteredClientes(clientesData.data);
            setClientesPagination({
              page: clientesData.page || 1,
              totalPages: clientesData.totalPages || 1,
              total: clientesData.total || 0,
              limit: clientesData.limit || 15
            });
          } else {
            console.error("Formato de respuesta no reconocido:", clientesData);
            toast.error("Error de formato", {
              description: "El formato de los datos recibidos no es válido",
            });
            setClientes([]);
            setFilteredClientes([]);
          }
        } else {
          console.error("Respuesta no válida:", clientesData);
          toast.error("Error", {
            description: "No se pudieron obtener los datos de clientes",
          });
          setClientes([]);
          setFilteredClientes([]);
        }
      } catch (error) {
        console.error("Error al cargar los clientes:", error);
        toast.error("Error al cargar los clientes", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los clientes. Por favor, intente nuevamente.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, [clientesPagination.page, clientesPagination.limit]);

  // Buscar clientes en la API al presionar Enter
  useEffect(() => {
    setFilteredClientes(clientes);
  }, [clientes]);

  const handleClienteSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      const term = searchTermCliente.trim();
      setIsLoading(true);
      try {
        // getClients puede aceptar un parámetro de búsqueda
        const clientesData = await getClients(1, 15, term);
        let clientesList: Cliente[] = [];
        if (clientesData && typeof clientesData === "object") {
          if (Array.isArray(clientesData)) {
            clientesList = clientesData;
          } else if (
            "items" in clientesData &&
            Array.isArray(clientesData.items)
          ) {
            clientesList = clientesData.items;
          } else if (
            "data" in clientesData &&
            Array.isArray(clientesData.data)
          ) {
            clientesList = clientesData.data;
          }
        }
        setClientes(clientesList);
        setFilteredClientes(clientesList);
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
    }
  };

  useEffect(() => {
    const fetchCondicionesContractuales = async () => {
      if (selectedClientId && selectedClientId > 0) {
        try {
          setIsLoading(true);
          const condicionesData = await getContractualConditionsByClient(
            selectedClientId
          );

          // Verificar que la respuesta sea válida
          if (condicionesData && Array.isArray(condicionesData)) {
            setCondicionesContractuales(condicionesData);
          } else if (condicionesData && typeof condicionesData === "object") {
            // Si la respuesta es un objeto, intentamos extraer los datos del formato adecuado
            interface CondicionesResponse {
              data?: CondicionContractual[];
              items?: CondicionContractual[];
            }

            const response = condicionesData as CondicionesResponse;
            if ("data" in response && Array.isArray(response.data)) {
              setCondicionesContractuales(response.data);
            } else if ("items" in response && Array.isArray(response.items)) {
              setCondicionesContractuales(response.items);
            } else {
              console.error(
                "Formato de respuesta no reconocido:",
                condicionesData
              );
              toast.error("Error de formato", {
                description: "El formato de los datos recibidos no es válido",
              });
              setCondicionesContractuales([]);
            }
          } else {
            console.error("Respuesta no válida:", condicionesData);
            toast.error("Error", {
              description:
                "No se pudieron obtener las condiciones contractuales",
            });
            setCondicionesContractuales([]);
          }

          // Resetear valores
          setValue("condicionContractualId", 0);
          setCantidadBanosRequired(0);
        } catch (error) {
          console.error(
            "Error al cargar las condiciones contractuales:",
            error
          );
          toast.error("Error al cargar condiciones contractuales", {
            description:
              error instanceof Error
                ? error.message
                : "No se pudieron cargar las condiciones del cliente seleccionado.",
          });
          setCondicionesContractuales([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (step >= 2) {
      fetchCondicionesContractuales();
    }
  }, [selectedClientId, step, setValue]);
  useEffect(() => {
    const fetchResources = async () => {
      if (selectedFechaProgramada && step >= 4) {
        try {
          setIsLoading(true);

          // Define interfaces para tipado correcto de respuestas
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

          interface SanitariosResponse {
            data?: Sanitario[];
            items?: Sanitario[];
          }

          // Obtener datos con Promise.all para optimizar las peticiones
          const [empleadosResponseRaw, vehiculosResponseRaw] =
            await Promise.all([
              getEmployees(empleadosPagination.page, empleadosPagination.limit),
              getVehicles(vehiculosPagination.page, vehiculosPagination.limit)
            ]);

          // Procesar respuesta de empleados con verificación de tipo
          // Permitir empleados tanto en estado DISPONIBLE como ASIGNADO
          // según la lógica del negocio que permite asignar recursos a múltiples servicios
          const empleadosResponse = empleadosResponseRaw as EmpleadosResponse;
          let empleadosDisp: Empleado[] = [];

          if (empleadosResponse && typeof empleadosResponse === "object") {
            if (
              "data" in empleadosResponse &&
              Array.isArray(empleadosResponse.data)
            ) {
              empleadosDisp = empleadosResponse.data.filter(
                (empleado) =>
                  empleado.estado === "DISPONIBLE" ||
                  empleado.estado === "ASIGNADO"
              );
              setEmpleadosPagination({
                page: empleadosResponse.page || 1,
                totalPages: empleadosResponse.totalPages || 1,
                total: empleadosResponse.total || 0,
                limit: empleadosResponse.limit || 15
              });
            } else if (
              "items" in empleadosResponse &&
              Array.isArray(empleadosResponse.items)
            ) {
              empleadosDisp = empleadosResponse.items.filter(
                (empleado) =>
                  empleado.estado === "DISPONIBLE" ||
                  empleado.estado === "ASIGNADO"
              );
              setEmpleadosPagination({
                page: empleadosResponse.page || 1,
                totalPages: empleadosResponse.totalPages || 1,
                total: empleadosResponse.total || 0,
                limit: empleadosResponse.limit || 15
              });
            }
          }

          // Procesar respuesta de vehículos con verificación de tipo
          // Permitir vehículos tanto en estado DISPONIBLE como ASIGNADO
          // según la lógica del negocio que permite asignar recursos a múltiples servicios
          const vehiculosResponse = vehiculosResponseRaw as VehiculosResponse;
          let vehiculosDisp: Vehiculo[] = [];

          if (vehiculosResponse && typeof vehiculosResponse === "object") {
            if (
              "data" in vehiculosResponse &&
              Array.isArray(vehiculosResponse.data)
            ) {
              vehiculosDisp = vehiculosResponse.data.filter(
                (vehiculo) =>
                  vehiculo.estado === "DISPONIBLE" ||
                  vehiculo.estado === "ASIGNADO"
              );
              setVehiculosPagination({
                page: vehiculosResponse.page || 1,
                totalPages: vehiculosResponse.totalPages || 1,
                total: vehiculosResponse.total || 0,
                limit: vehiculosResponse.limit || 15
              });
            } else if (
              "items" in vehiculosResponse &&
              Array.isArray(vehiculosResponse.items)
            ) {
              vehiculosDisp = vehiculosResponse.items.filter(
                (vehiculo) =>
                  vehiculo.estado === "DISPONIBLE" ||
                  vehiculo.estado === "ASIGNADO"
              );
              setVehiculosPagination({
                page: vehiculosResponse.page || 1,
                totalPages: vehiculosResponse.totalPages || 1,
                total: vehiculosResponse.total || 0,
                limit: vehiculosResponse.limit || 15
              });
            }
          }

          // Actualizar estados con los datos procesados
          setEmpleadosDisponibles(empleadosDisp);
          setVehiculosDisponibles(vehiculosDisp);

          // Resetear las selecciones (no resetear banosIds aquí)
          setValue("empleadosIds", []);
          setValue("vehiculosIds", []);
        } catch (error) {
          console.error("Error al cargar recursos:", error);
          toast.error("Error al cargar recursos", {
            description:
              error instanceof Error
                ? error.message
                : "No se pudieron cargar los recursos disponibles.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (step >= 4) {
      setBanosPage(1); // Resetear página de baños
      fetchResources();
    }
  }, [selectedFechaProgramada, step, setValue, empleadosPagination.page, empleadosPagination.limit, vehiculosPagination.page, vehiculosPagination.limit]);

  useEffect(() => {
    if (selectedCondicionId && selectedCondicionId > 0) {
      const selectedCondicion = condicionesContractuales.find(
        (c) => c.condicionContractualId === selectedCondicionId
      );

      if (selectedCondicion) {
        const cantidadBanos = selectedCondicion.cantidad_banos || 0;
        setCantidadBanosRequired(cantidadBanos);
        setValue("cantidadBanos", cantidadBanos);

        setValue("condicionContractualId", selectedCondicionId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    }
  }, [selectedCondicionId, condicionesContractuales, setValue]);

  // const validateStep = (currentStep: number): boolean => {
  //   switch (currentStep) {
  //     case 1:
  //       return getValues().clienteId > 0;
  //     case 2:
  //       return getValues().condicionContractualId > 0;
  //     case 3:
  //       return (
  //         !!getValues().fechaProgramada &&
  //         getValues().cantidadVehiculos > 0 &&
  //         getValues().ubicacion.length >= 3
  //       );
  //     case 4:
  //       return (
  //         getValues().empleadosIds.length > 0 &&
  //         getValues().vehiculosIds.length > 0
  //       );
  //     default:
  //       return true;
  //   }
  // };

  const handleNext = async () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = await trigger("clienteId");
        break;
      case 2:
        if (getValues().condicionContractualId === 0) {
          toast.error("Error de validación", {
            description: "Debes seleccionar una condición contractual válida",
          });
          return;
        }

        isValid = await trigger("condicionContractualId");
        break;
      case 3:
        isValid = await trigger([
          "fechaProgramada",
          "cantidadVehiculos",
          "ubicacion",
        ]);
        break;
      case 4:
        isValid = await trigger(["empleadosIds", "vehiculosIds", "banosIds"]);

        break;
    }

    if (step === 2) {
      const currentCondicionId = getValues().condicionContractualId;

      if (!currentCondicionId || currentCondicionId === 0) {
        toast.error("Error de validación", {
          description: "Debes seleccionar una condición contractual válida",
        });
        return;
      }
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Validar que haya una condición contractual seleccionada
      const effectiveCondicionId =
        data.condicionContractualId || selectedCondicionContractualId;

      if (!effectiveCondicionId || effectiveCondicionId === 0) {
        throw new Error("La condición contractual es requerida");
      }

      const empleadosSeleccionados = data.empleadosIds;

      // Validar que haya al menos un empleado seleccionado
      if (!empleadosSeleccionados || empleadosSeleccionados.length === 0) {
        throw new Error("Se requiere seleccionar al menos un empleado");
      }

      // Validar que haya al menos un vehículo seleccionado
      if (!data.vehiculosIds || data.vehiculosIds.length === 0) {
        throw new Error("Se requiere seleccionar al menos un vehículo");
      } // Formatear fecha correctamente
      const date = new Date(data.fechaProgramada);
      const formattedDate = date.toISOString().split("T")[0];

      // Determinar empleados A y B basándose en los roles asignados o en el orden de selección
      let empleadoA = empleadoRolA;
      let empleadoB = empleadoRolB;

      // Si no hay roles asignados explícitamente, usar el orden de selección
      if (!empleadoA && empleadosSeleccionados.length > 0) {
        empleadoA = empleadosSeleccionados[0];
      }
      if (!empleadoB && empleadosSeleccionados.length > 1) {
        empleadoB = empleadosSeleccionados[1];
      }

      // Crear las asignaciones manuales según el formato requerido para CreateInstalacionDto
      const asignacionesManual: [
        {
          empleadoId?: number;
          vehiculoId: number;
          banosIds: number[];
          rol: string;
        },
        { empleadoId?: number; rol: string }
      ] = [
        {
          empleadoId: empleadoA || undefined,
          vehiculoId: data.vehiculosIds.length > 0 ? data.vehiculosIds[0] : 0,
          banosIds: data.banosIds || [],
          rol: "A",
        },
        {
          empleadoId: empleadoB || undefined,
          rol: "B",
        },
      ]; // Construir objeto con datos del servicio
      const serviceData = {
        clienteId: data.clienteId,
        condicionContractualId: effectiveCondicionId,
        fechaProgramada: formattedDate,
        tipoServicio: "INSTALACION" as const,
        cantidadBanos: (data.banosIds || []).length, // Usar la cantidad real de baños seleccionados
        cantidadVehiculos: data.cantidadVehiculos,
        ubicacion: data.ubicacion,
        notas: data.notas || "",
        asignacionAutomatica: false,
        empleadoAId: empleadoA || undefined,
        empleadoBId: empleadoB || undefined,
        asignacionesManual: asignacionesManual,
      };

      // Realizar la llamada a la API
      const response = await createServiceInstalacion(serviceData);

      // Verificar respuesta
      if (response && typeof response === "object") {
        let successMessage = "El servicio ha sido programado con éxito.";

        // Intentar extraer un mensaje específico de la respuesta si existe
        if ("message" in response && typeof response.message === "string") {
          successMessage = response.message;
        } else if ("id" in response) {
          // Si tiene un ID, asumimos que se creó correctamente
          successMessage = `Servicio creado correctamente con ID: ${response.id}`;
        }

        toast.success("¡Servicio creado correctamente!", {
          description: successMessage,
        });
      } else {
        toast.success("¡Servicio creado correctamente!", {
          description: "El servicio ha sido programado con éxito.",
        });
      }

      // Redireccionar después de un breve delay
      setTimeout(() => {
        router.push("/admin/dashboard/servicios/listado");
      }, 2000);
    } catch (error) {
      console.error("Error al crear el servicio:", error);

      // Manejo detallado del error
      let errorMessage = "Ocurrió un error inesperado";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        } else if ("error" in error && typeof error.error === "string") {
          errorMessage = error.error;
        } else if ("detail" in error && typeof error.detail === "string") {
          errorMessage = error.detail;
        }
      }

      toast.error("Error al crear el servicio", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const toggleResourceSelection = (
    resourceType: "empleadosIds" | "vehiculosIds" | "banosIds",
    id: number
  ) => {
    const currentSelection = getValues(resourceType) || [];
    if (currentSelection.includes(id)) {
      setValue(
        resourceType,
        currentSelection.filter((itemId) => itemId !== id)
      );

      // Si se deselecciona un empleado, también quitarlo de los roles
      if (resourceType === "empleadosIds") {
        if (empleadoRolA === id) {
          setEmpleadoRolA(null);
          setValue("empleadoAId", undefined);
        }
        if (empleadoRolB === id) {
          setEmpleadoRolB(null);
          setValue("empleadoBId", undefined);
        }
      }
    } else {
      setValue(resourceType, [...currentSelection, id]);
    }
  };

  // Función para asignar rol A a un empleado
  const handleAsignarRolA = (empleadoId: number) => {
    // Si este empleado ya tiene rol B, intercambiar roles
    if (empleadoRolB === empleadoId) {
      setEmpleadoRolB(empleadoRolA);
      setValue("empleadoBId", empleadoRolA || undefined);
    }
    setEmpleadoRolA(empleadoId);
    setValue("empleadoAId", empleadoId);
  };

  // Función para asignar rol B a un empleado
  const handleAsignarRolB = (empleadoId: number) => {
    // Si este empleado ya tiene rol A, intercambiar roles
    if (empleadoRolA === empleadoId) {
      setEmpleadoRolA(empleadoRolB);
      setValue("empleadoAId", empleadoRolB || undefined);
    }
    setEmpleadoRolB(empleadoId);
    setValue("empleadoBId", empleadoId);
  };

  // Función separada para cargar baños con paginación
  const fetchBanos = async (page: number = 1) => {
    try {
      setIsLoadingBanos(true);
      const sanitariosResponse = await getSanitarios(page, 15, "");

      if (sanitariosResponse && typeof sanitariosResponse === "object") {
        let sanitariosDisp: Sanitario[] = [];

        if (
          "items" in sanitariosResponse &&
          Array.isArray(sanitariosResponse.items)
        ) {
          sanitariosDisp = sanitariosResponse.items.filter(
            (sanitario) => sanitario.estado === "DISPONIBLE"
          );
          const response = sanitariosResponse as any;
          setBanosTotalPages(response.totalPages || 1);
          setBanosTotal(response.total || 0);
        } else if (Array.isArray(sanitariosResponse)) {
          sanitariosDisp = sanitariosResponse.filter(
            (sanitario) => sanitario.estado === "DISPONIBLE"
          );
          setBanosTotalPages(1);
          setBanosTotal(sanitariosDisp.length);
        }

        setBanosDisponibles(sanitariosDisp);
      }
    } catch (error) {
      console.error("Error al cargar baños:", error);
      toast.error("Error al cargar baños", {
        description:
          error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsLoadingBanos(false);
    }
  };

  // useEffect para cargar baños cuando cambia la página o el paso
  useEffect(() => {
    if (step >= 4) {
      fetchBanos(banosPage);
      setSearchTermBano("");
    }
  }, [banosPage, step]);

  // Actualizar filteredBanos cuando cambia banosDisponibles o searchTermBano
  useEffect(() => {
    if (!searchTermBano.trim()) {
      setFilteredBanos(banosDisponibles);
    } else {
      const term = searchTermBano.toLowerCase();
      setFilteredBanos(
        banosDisponibles.filter(
          (bano) =>
            (bano.codigo_interno &&
              bano.codigo_interno.toLowerCase().includes(term)) ||
            (bano.modelo && bano.modelo.toLowerCase().includes(term))
        )
      );
    }
  }, [banosDisponibles, searchTermBano]);
  // Función para cambiar página de baños
  const handleBanosPageChange = (page: number) => {
    setBanosPage(page);
  };

  // Funciones para manejar paginación
  const handleClientesPageChange = (newPage: number) => {
    setClientesPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleEmpleadosPageChange = (newPage: number) => {
    setEmpleadosPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleVehiculosPageChange = (newPage: number) => {
    setVehiculosPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Crear Nuevo Servicio
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {step === 1 && "Seleccione el cliente para el nuevo servicio"}
              {step === 2 && "Seleccione la condición contractual aplicable"}
              {step === 3 && "Defina la fecha y detalles del servicio"}
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

      <CardContent className="p-6">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span
              className={`font-medium flex items-center gap-1 ${
                step >= 1 ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <FileText className="h-4 w-4" /> Cliente
            </span>
            <span
              className={`font-medium flex items-center gap-1 ${
                step >= 2 ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <Calendar className="h-4 w-4" /> Contrato
            </span>
            <span
              className={`font-medium flex items-center gap-1 ${
                step >= 3 ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <MapPin className="h-4 w-4" /> Programación
            </span>
            <span
              className={`font-medium flex items-center gap-1 ${
                step >= 4 ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <Users className="h-4 w-4" /> Recursos
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>
        {/* Step 1: Client selection */}
        {step === 1 && (
          <div className="space-y-6">
            <Controller
              name="clienteId"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cliente
                  </label>
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      className="pl-10"
                      placeholder="Buscar por nombre, CUIT o email..."
                      value={searchTermCliente}
                      onChange={(e) => {
                        setSearchTermCliente(e.target.value);
                        if (e.target.value.trim() === "") {
                          // Si se borra el input, recargar todos los clientes
                          (async () => {
                            setIsLoading(true);
                            try {
                              const clientesData = await getClients(1, 15, "");
                              let clientesList: Cliente[] = [];
                              if (
                                clientesData &&
                                typeof clientesData === "object"
                              ) {
                                if (Array.isArray(clientesData)) {
                                  clientesList = clientesData;
                                } else if (
                                  "items" in clientesData &&
                                  Array.isArray(clientesData.items)
                                ) {
                                  clientesList = clientesData.items;
                                } else if (
                                  "data" in clientesData &&
                                  Array.isArray(clientesData.data)
                                ) {
                                  clientesList = clientesData.data;
                                }
                              }
                              setClientes(clientesList);
                              setFilteredClientes(clientesList);
                            } catch (error) {
                              toast.error("Error al cargar clientes", {
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "No se pudieron cargar clientes.",
                              });
                            } finally {
                              setIsLoading(false);
                            }
                          })();
                        }
                      }}
                      onKeyDown={handleClienteSearch}
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader className="h-8 w-8 text-indigo-500" />
                    </div>
                  ) : (
                    <div className="border rounded-md max-h-[350px] overflow-y-auto">
                      {filteredClientes.length > 0 ? (
                        filteredClientes.map((cliente) => (
                          <div
                            key={cliente.clienteId}
                            className={`px-4 py-3 cursor-pointer hover:bg-slate-50 ${
                              field.value === cliente.clienteId
                                ? "bg-indigo-50 border-l-4 border-indigo-500"
                                : "border-l-4 border-transparent"
                            }`}
                            onClick={() => field.onChange(cliente.clienteId)}
                          >
                            <div className="font-medium">{cliente.nombre}</div>
                            <div className="text-sm text-slate-600 flex flex-col sm:flex-row sm:gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />{" "}
                                {cliente.cuit}
                              </span>
                              <span className="flex items-center gap-1">
                                <Search className="h-3.5 w-3.5 text-slate-400" />{" "}
                                {cliente.email}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : searchTermCliente.length > 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          No se encontraron clientes con ese criterio de
                          búsqueda.
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          No hay clientes disponibles. Por favor, cree un
                          cliente primero.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paginación de clientes */}
                  {clientesPagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClientesPageChange(clientesPagination.page - 1)}
                        disabled={clientesPagination.page === 1}
                      >
                        Anterior
                      </Button>
                      
                      <span className="text-sm text-gray-600">
                        Página {clientesPagination.page} de {clientesPagination.totalPages} ({clientesPagination.total} clientes)
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClientesPageChange(clientesPagination.page + 1)}
                        disabled={clientesPagination.page === clientesPagination.totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}

                  {fieldState.error?.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}
        {/* Step 2: Contractual condition selection */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Buscador de condiciones contractuales */}
            <div className="relative mb-3">
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
            <Controller
              name="condicionContractualId"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">
                      Condición Contractual
                    </label>
                    <Badge variant="outline" className="text-xs bg-slate-100">
                      {filteredCondiciones.length} condiciones disponibles
                    </Badge>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader className="h-8 w-8 text-indigo-500" />
                    </div>
                  ) : (
                    <div className="max-h-[450px] overflow-y-auto px-1 py-2">
                      {filteredCondiciones.length > 0 ? (
                        filteredCondiciones.map((condicion) => (
                          <div
                            key={condicion.condicionContractualId}
                            className={`px-4 py-4 cursor-pointer hover:bg-slate-50 mb-2 border rounded-md shadow-sm ${
                              field.value === condicion.condicionContractualId
                                ? "bg-indigo-50 border-l-4 border-indigo-500"
                                : "border-l-4 border-transparent"
                            }`}
                            onClick={() => {
                              setSelectedCondicionContractualId(
                                condicion.condicionContractualId
                              );
                              setValue(
                                "condicionContractualId",
                                condicion.condicionContractualId,
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                }
                              );
                            }}
                          >
                            <div className="flex justify-between">
                              <Badge
                                variant="outline"
                                className="bg-indigo-50 text-indigo-700 mb-1"
                              >
                                {condicion.tipo_servicio}
                              </Badge>
                              <Badge
                                variant={
                                  condicion.estado === "Activo"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  condicion.estado === "Activo"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : ""
                                }
                              >
                                {condicion.estado}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 mt-2">
                              <div className="mb-1">
                                <span className="font-medium">
                                  Tipo de Servicio:
                                </span>{" "}
                                <span className="text-slate-800">
                                  {condicion.tipo_servicio}
                                </span>{" "}
                              </div>
                              <div className="flex justify-between mb-1">
                                {isAdmin && (
                                  <span>Tarifa: ${condicion.tarifa}</span>
                                )}
                                <span>
                                  Periodicidad: {condicion.periodicidad}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs mb-2">
                                <span>
                                  Inicio:{" "}
                                  {new Date(
                                    condicion.fecha_inicio
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  Fin:{" "}
                                  {new Date(
                                    condicion.fecha_fin
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {condicion.condiciones_especificas && (
                                <div className="border-t pt-1 border-slate-100">
                                  <span className="font-medium text-slate-700">
                                    Condiciones Específicas:
                                  </span>
                                  <p className="text-sm text-slate-700 mt-1">
                                    {condicion.condiciones_especificas}
                                  </p>
                                </div>
                              )}
                              {condicion.cantidad_banos && (
                                <div className="mt-1 font-medium text-indigo-600">
                                  Baños requeridos: {condicion.cantidad_banos}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          No hay condiciones contractuales para este cliente.
                          Por favor, cree una condición contractual primero.
                        </div>
                      )}
                    </div>
                  )}
                  {fieldState.error?.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}
        {/* Step 3: Service scheduling */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="fechaProgramada"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fecha Programada
                    </label>{" "}
                    <CustomDatePicker
                      date={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      minDate={new Date()}
                      showTimeSelect
                      format="yyyy-MM-dd HH:mm"
                      placeholder="Selecciona fecha y hora de inicio"
                      className="w-full"
                    />
                    {fieldState.error?.message && (
                      <p className="text-sm text-red-500 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="cantidadVehiculos"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Cantidad de Vehículos"
                    name="cantidadVehiculos"
                    type="number"
                    value={field.value.toString()}
                    onChange={(value) => field.onChange(parseInt(value) || 0)}
                    error={fieldState.error?.message}
                    min={1}
                  />
                )}
              />
            </div>

            <Controller
              name="ubicacion"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Ubicación"
                  name="ubicacion"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Dirección completa donde se realizará el servicio"
                />
              )}
            />

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
        )}{" "}
        {/* Step 4: Resource assignment */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1 flex items-center justify-between">
                Empleados Disponibles
                <Badge variant="outline" className="bg-blue-50">
                  {watch("empleadosIds").length} seleccionados
                </Badge>
              </h3>

              {/* Buscador de empleados */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
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
                          const empleadosResponseRaw = await getEmployees(
                            1,
                            15,
                            ""
                          );
                          let empleados: Empleado[] = [];
                          if (
                            empleadosResponseRaw &&
                            typeof empleadosResponseRaw === "object"
                          ) {
                            if (Array.isArray(empleadosResponseRaw)) {
                              empleados = empleadosResponseRaw;
                            } else if (
                              "items" in empleadosResponseRaw &&
                              Array.isArray(empleadosResponseRaw.items)
                            ) {
                              empleados = empleadosResponseRaw.items;
                            } else if (
                              "data" in empleadosResponseRaw &&
                              Array.isArray(empleadosResponseRaw.data)
                            ) {
                              empleados = empleadosResponseRaw.data;
                            }
                          }
                          empleados = empleados.filter(
                            (empleado) =>
                              empleado.estado === "DISPONIBLE" ||
                              empleado.estado === "ASIGNADO"
                          );
                          setEmpleadosDisponibles(empleados);
                          setFilteredEmpleados(empleados);
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
                />
              </div>

              {/* Información de roles */}
              <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm">
                <p className="font-medium mb-1">Asignación de roles:</p>
                <p>
                  <span className="font-medium">Empleado A (azul):</span>{" "}
                  Conductor principal con vehículo asignado
                </p>
                <p>
                  <span className="font-medium">Empleado B (verde):</span>{" "}
                  Asistente/colaborador
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Después de seleccionar empleados, puede asignarles roles
                  haciendo clic en los botones "Rol A" o "Rol B"
                </p>

                {/* Resumen de asignaciones actuales */}
                {(empleadoRolA !== null || empleadoRolB !== null) && (
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <p className="font-medium mb-1">Asignaciones actuales:</p>
                    {empleadoRolA !== null && empleadosDisponibles && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600">Empleado A</Badge>
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
                    {empleadoRolB !== null && empleadosDisponibles && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-600">Empleado B</Badge>
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

              <p className="text-xs text-slate-500 mb-3">
                Se muestran empleados con estado &quot;DISPONIBLE&quot; y
                &quot;ASIGNADO&quot;
              </p>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 text-indigo-500" />
                </div>
              ) : filteredEmpleados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredEmpleados.map((empleado) => {
                    const isSelected = watch("empleadosIds").includes(
                      empleado.id
                    );
                    return (
                      <div
                        key={empleado.id}
                        className={`border rounded-md p-3 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() =>
                          toggleResourceSelection("empleadosIds", empleado.id)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1">
                            <div
                              className={`w-4 h-4 mr-2 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{`${empleado.nombre} ${empleado.apellido}`}</div>
                              <div className="text-xs flex items-center gap-2">
                                <span className="text-slate-500">
                                  {empleado.cargo}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 text-xs"
                                >
                                  {empleado.estado}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Botones de roles - solo visibles si el empleado está seleccionado */}
                          {isSelected && (
                            <div className="flex gap-1 ml-2">
                              <Badge
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAsignarRolA(empleado.id);
                                }}
                                className={`cursor-pointer text-xs ${
                                  empleadoRolA === empleado.id
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                                }`}
                              >
                                Rol A
                              </Badge>
                              <Badge
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAsignarRolB(empleado.id);
                                }}
                                className={`cursor-pointer text-xs ${
                                  empleadoRolB === empleado.id
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                                }`}
                              >
                                Rol B
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 border rounded-md">
                  No hay empleados disponibles para la fecha seleccionada.
                </div>
              )}

              {/* Paginación de empleados */}
              {empleadosPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmpleadosPageChange(empleadosPagination.page - 1)}
                    disabled={empleadosPagination.page === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Página {empleadosPagination.page} de {empleadosPagination.totalPages} ({empleadosPagination.total} empleados)
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmpleadosPageChange(empleadosPagination.page + 1)}
                    disabled={empleadosPagination.page === empleadosPagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              {errors.empleadosIds && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.empleadosIds.message}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-1">Vehículos Disponibles</h3>
              <p className="text-xs text-slate-500 mb-3">
                Se muestran vehículos con estado &quot;DISPONIBLE&quot; y
                &quot;ASIGNADO&quot;
              </p>
              {/* Buscador de vehículos */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  className="pl-10"
                  placeholder="Buscar por marca, modelo o placa..."
                  value={searchTermVehiculo}
                  onChange={(e) => {
                    setSearchTermVehiculo(e.target.value);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      setIsLoading(true);
                      try {
                        const vehiculosResponse = await getVehicles(
                          1,
                          15,
                          searchTermVehiculo
                        );
                        let vehiculos: Vehiculo[] = [];
                        if (
                          vehiculosResponse &&
                          typeof vehiculosResponse === "object"
                        ) {
                          if (Array.isArray(vehiculosResponse)) {
                            vehiculos = vehiculosResponse;
                          } else if (
                            "items" in vehiculosResponse &&
                            Array.isArray(vehiculosResponse.items)
                          ) {
                            vehiculos = vehiculosResponse.items;
                          } else if (
                            "data" in vehiculosResponse &&
                            Array.isArray(vehiculosResponse.data)
                          ) {
                            vehiculos = vehiculosResponse.data;
                          }
                        }
                        vehiculos = vehiculos.filter(
                          (vehiculo) =>
                            vehiculo.estado === "DISPONIBLE" ||
                            vehiculo.estado === "ASIGNADO"
                        );
                        setVehiculosDisponibles(vehiculos);
                        setFilteredVehiculos(vehiculos);
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
              </div>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 text-indigo-500" />
                </div>
              ) : (
                (() => {
                  // Unir vehículos seleccionados y filtrados, sin duplicados
                  const vehiculosIdsSeleccionados = watch("vehiculosIds") || [];
                  const vehiculosSeleccionados = vehiculosDisponibles.filter(
                    (v) => vehiculosIdsSeleccionados.includes(v.id)
                  );
                  const vehiculosNoSeleccionados = filteredVehiculos.filter(
                    (v) => !vehiculosIdsSeleccionados.includes(v.id)
                  );
                  const vehiculosParaMostrar = [
                    ...vehiculosSeleccionados,
                    ...vehiculosNoSeleccionados,
                  ];
                  if (vehiculosParaMostrar.length > 0) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {vehiculosParaMostrar.map((vehiculo) => {
                          const isSelected = vehiculosIdsSeleccionados.includes(
                            vehiculo.id
                          );
                          return (
                            <div
                              key={vehiculo.id}
                              className={`border rounded-md p-2 cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-300"
                                  : "hover:bg-slate-50"
                              }`}
                              onClick={() =>
                                toggleResourceSelection(
                                  "vehiculosIds",
                                  vehiculo.id
                                )
                              }
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-4 h-4 mr-2 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? "border-indigo-500 bg-indigo-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{`${vehiculo.marca} ${vehiculo.modelo}`}</div>
                                  <div className="text-xs flex items-center gap-2">
                                    <span className="text-slate-500">
                                      Placa: {vehiculo.placa}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 text-xs"
                                    >
                                      {vehiculo.estado}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 text-center text-slate-500 border rounded-md">
                        No hay vehículos disponibles para la fecha seleccionada.
                      </div>
                    );
                  }
                })()
              )}

              {/* Paginación de vehículos */}
              {vehiculosPagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVehiculosPageChange(vehiculosPagination.page - 1)}
                    disabled={vehiculosPagination.page === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Página {vehiculosPagination.page} de {vehiculosPagination.totalPages} ({vehiculosPagination.total} vehículos)
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVehiculosPageChange(vehiculosPagination.page + 1)}
                    disabled={vehiculosPagination.page === vehiculosPagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              {errors.vehiculosIds && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.vehiculosIds.message}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-1">
                Baños Disponibles{" "}
                {cantidadBanosRequired > 0 &&
                  `(${cantidadBanosRequired} requeridos)`}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Solo se muestran baños con estado &quot;DISPONIBLE&quot;
              </p>
              {/* Buscador de baños */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  className="pl-10"
                  placeholder="Buscar por código interno o modelo..."
                  value={searchTermBano}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setSearchTermBano(value);
                    if (value.trim() === "") {
                      setFilteredBanos(banosDisponibles);
                      // Si se borra el input, recargar baños de la página actual sin filtro
                      setIsLoadingBanos(true);
                      try {
                        const sanitariosResponse = await getSanitarios(
                          banosPage,
                          15,
                          ""
                        );
                        let sanitariosDisp: Sanitario[] = [];
                        if (
                          sanitariosResponse &&
                          typeof sanitariosResponse === "object"
                        ) {
                          if (
                            "items" in sanitariosResponse &&
                            Array.isArray(sanitariosResponse.items)
                          ) {
                            sanitariosDisp = sanitariosResponse.items.filter(
                              (sanitario) => sanitario.estado === "DISPONIBLE"
                            );
                          } else if (Array.isArray(sanitariosResponse)) {
                            sanitariosDisp = sanitariosResponse.filter(
                              (sanitario) => sanitario.estado === "DISPONIBLE"
                            );
                          }
                        }
                        setBanosDisponibles(sanitariosDisp);
                        setFilteredBanos(sanitariosDisp);
                      } catch (error) {
                        toast.error("Error al buscar baños", {
                          description:
                            error instanceof Error
                              ? error.message
                              : "No se pudieron buscar baños.",
                        });
                      } finally {
                        setIsLoadingBanos(false);
                      }
                    } else {
                      // Buscar en la API por el término ingresado
                      setIsLoadingBanos(true);
                      try {
                        const sanitariosResponse = await getSanitarios(
                          banosPage,
                          15,
                          value
                        );
                        let sanitariosDisp: Sanitario[] = [];
                        if (
                          sanitariosResponse &&
                          typeof sanitariosResponse === "object"
                        ) {
                          if (
                            "items" in sanitariosResponse &&
                            Array.isArray(sanitariosResponse.items)
                          ) {
                            sanitariosDisp = sanitariosResponse.items.filter(
                              (sanitario) => sanitario.estado === "DISPONIBLE"
                            );
                          } else if (Array.isArray(sanitariosResponse)) {
                            sanitariosDisp = sanitariosResponse.filter(
                              (sanitario) => sanitario.estado === "DISPONIBLE"
                            );
                          }
                        }
                        setBanosDisponibles(sanitariosDisp);
                        setFilteredBanos(sanitariosDisp);
                      } catch (error) {
                        toast.error("Error al buscar baños", {
                          description:
                            error instanceof Error
                              ? error.message
                              : "No se pudieron buscar baños.",
                        });
                      } finally {
                        setIsLoadingBanos(false);
                      }
                    }
                  }}
                  // Búsqueda en tiempo real con llamada a la API
                />
              </div>
              {isLoadingBanos ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 text-indigo-500" />
                </div>
              ) : (
                (() => {
                  // Unir baños seleccionados y filtrados, sin duplicados
                  const banosIdsSeleccionados = watch("banosIds") || [];
                  // Buscar los objetos de baños seleccionados en todas las fuentes posibles
                  const banosSeleccionados = banosIdsSeleccionados
                    .map((idSel) =>
                      banosDisponibles.find((b) => Number(b.baño_id) === idSel) ||
                      filteredBanos.find((b) => Number(b.baño_id) === idSel)
                    )
                    .filter(Boolean);
                  // Agregar los seleccionados que no estén en los resultados actuales
                  const banosNoSeleccionados = filteredBanos.filter(
                    (b) => !banosIdsSeleccionados.includes(Number(b.baño_id))
                  );
                  const banosParaMostrar = [...banosSeleccionados, ...banosNoSeleccionados];
                  if (banosParaMostrar.length > 0) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {banosParaMostrar.map((bano) => {
                          const banosIds = banosIdsSeleccionados;
                          const isSelected = banosIds.includes(
                            Number(bano?.baño_id)
                          );
                          const isSelectable =
                            isSelected ||
                            banosIds.length < cantidadBanosRequired ||
                            cantidadBanosRequired === 0;
                          return (
                            <div
                              key={bano?.baño_id}
                              className={`border rounded-md p-2 ${
                                isSelectable
                                  ? "cursor-pointer"
                                  : "opacity-50 cursor-not-allowed"
                              } ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-300"
                                  : "hover:bg-slate-50"
                              }`}
                              onClick={() =>
                                isSelectable &&
                                toggleResourceSelection(
                                  "banosIds",
                                  Number(bano?.baño_id)
                                )
                              }
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-4 h-4 mr-2 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? "border-indigo-500 bg-indigo-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {bano?.codigo_interno}
                                  </div>
                                  <div className="text-xs flex items-center gap-2">
                                    <span className="text-slate-500">
                                      {bano?.modelo}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 text-xs"
                                    >
                                      {bano?.estado}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 text-center text-slate-500 border rounded-md">
                        No hay baños disponibles para la fecha seleccionada.
                      </div>
                    );
                  }
                })()
              )}

              {/* Paginación de baños */}
              {banosTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBanosPageChange(banosPage - 1)}
                    disabled={banosPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Página {banosPage} de {banosTotalPages} ({banosDisponibles.length} baños)
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBanosPageChange(banosPage + 1)}
                    disabled={banosPage === banosTotalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
              {errors.banosIds && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.banosIds.message}
                </p>
              )}
            </div>
          </div>
        )}
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
          )}

          <div className={step > 1 ? "ml-auto" : ""}>
            {step < 4 && (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 4 && (
              <Button
                onClick={() => {
                  const formValues = getValues();

                  if (
                    !formValues.condicionContractualId ||
                    formValues.condicionContractualId === 0
                  ) {
                    if (selectedCondicionContractualId > 0) {
                      setValue(
                        "condicionContractualId",
                        selectedCondicionContractualId,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        }
                      );
                    } else {
                      console.error(
                        "⛔ Error: No valid condicionContractualId found"
                      );
                      toast.error("Error de validación", {
                        description:
                          "Debes seleccionar una condición contractual válida. Por favor, vuelve al paso 2 y selecciona una condición.",
                      });
                      return;
                    }
                  }

                  const updatedValues = getValues();

                  if (
                    !updatedValues.condicionContractualId ||
                    updatedValues.condicionContractualId === 0
                  ) {
                    console.error(
                      "⛔ Error: Debes seleccionar una condición contractual válida"
                    );
                    toast.error("Error de validación", {
                      description:
                        "Debes seleccionar una condición contractual válida. Por favor, vuelve al paso 2 y selecciona una condición.",
                    });
                    return;
                  }
                  trigger().then((isValid) => {
                    if (!isValid) {
                      console.error("⛔ Form validation failed");
                      return;
                    }

                    // Validar asignación de roles
                    const empleadosIds = getValues().empleadosIds || [];
                    const vehiculosIds = getValues().vehiculosIds || [];

                    // Si hay vehículos pero no hay empleado A asignado, asignar automáticamente
                    if (
                      vehiculosIds.length > 0 &&
                      !empleadoRolA &&
                      empleadosIds.length > 0
                    ) {
                      setEmpleadoRolA(empleadosIds[0]);
                      setValue("empleadoAId", empleadosIds[0]);

                      // Si hay más empleados y no hay empleado B, asignar automáticamente
                      if (empleadosIds.length > 1 && !empleadoRolB) {
                        setEmpleadoRolB(empleadosIds[1]);
                        setValue("empleadoBId", empleadosIds[1]);
                      }

                      toast.info("Roles asignados automáticamente", {
                        description:
                          "Se han asignado roles automáticamente a los empleados seleccionados.",
                      });
                    }

                    const banosIds = getValues().banosIds || [];
                    if (
                      cantidadBanosRequired > 0 &&
                      banosIds.length < cantidadBanosRequired
                    ) {
                      console.error(
                        `⛔ Error: Debes seleccionar ${cantidadBanosRequired} baños`
                      );
                      toast.error("Error de validación", {
                        description: `Debes seleccionar ${cantidadBanosRequired} baños`,
                      });
                      return;
                    }

                    handleSubmit(onSubmit)();
                  });
                }}
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
        </div>
      </CardContent>
    </Card>
  );
}
