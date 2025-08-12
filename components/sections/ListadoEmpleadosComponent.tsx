"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ListadoTabla } from "@/components/ui/local/ListadoTabla";
import { Badge } from "@/components/ui/badge";
import { CreateEmployee, Empleado, EmpleadoFormulario } from "@/types/types";
import { TableCell } from "../ui/table";
import { useCallback, useEffect, useState } from "react";
import {
  createEmployee,
  getEmployees,
  deleteEmployee,
  editEmployee,
  // changeEmployeeStatus,
  getProximosServiciosPorEmpleado,
} from "@/app/actions/empleados";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormDialog } from "../ui/local/FormDialog";
import { FormField } from "../ui/local/FormField";
import Loader from "../ui/local/Loader";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserRound,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  PauseCircle,
  BadgeInfo,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Info,
  FileText, // Icono para documentos
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ListadoEmpleadosComponent({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: Empleado[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const safeData = Array.isArray(data) ? data : [];

  const [employees, setEmployees] = useState<Empleado[]>(safeData);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [isFirstLoad, setIsFirstLoad] = useState(true); // Estados para el diálogo de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);

  // Estados para el modal de próximos servicios
  const [showProximosServicios, setShowProximosServicios] = useState(false);
  type ProximoServicio = {
    cliente?: {
      nombre?: string;
      email?: string;
      telefono?: string;
    };
    fechaProgramada?: string;
    cantidadEmpleados?: number;
    cantidadBanos?: number;
    ubicacion?: string;
    tipoServicio?: string;
    cantidadVehiculos?: number;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    notas?: string;
  };

  const [proximosServiciosData, setProximosServiciosData] = useState<
    ProximoServicio[]
  >([]);
  const [selectedEmployeeForServicios, setSelectedEmployeeForServicios] =
    useState<Empleado | null>(null);
  const [loadingProximosServicios, setLoadingProximosServicios] =
    useState(false);

  const createEmployeeSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    apellido: z.string().min(1, "El apellido es obligatorio"),
    documento: z.string().min(1, "El documento es obligatorio"),
    fecha_nacimiento: z
      .string()
      .min(1, "La fecha de nacimiento es obligatoria"),
    direccion: z.string().min(1, "La dirección es obligatoria"),
    telefono: z.string().min(1, "El teléfono es obligatorio"),
    email: z
      .string()
      .regex(
        /^[^@]+@[^@]+\.[^@]+$/,
        "Formato de email inválido, ejemplo: empleado@empresa.com"
      ),
    cargo: z.string().min(1, "El puesto es obligatorio"),
    estado: z.enum(["ASIGNADO", "DISPONIBLE", "SUSPENDIDO"], {
      errorMap: () => ({ message: "El estado es obligatorio" }),
    }),
    numero_legajo: z.coerce.number({
      required_error: "El número de legajo es obligatorio",
      invalid_type_error: "El número de legajo debe ser numérico",
    }),
    cuil: z
      .string()
      .min(11, "El CUIL debe tener entre 11 y 20 caracteres")
      .max(20, "El CUIL debe tener entre 11 y 20 caracteres"),
    cbu: z
      .string()
      .min(22, "El CBU debe tener exactamente 22 dígitos")
      .max(22, "El CBU debe tener exactamente 22 dígitos"),
  });

  const form = useForm<z.infer<typeof createEmployeeSchema>>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      documento: "",
      fecha_nacimiento: "",
      direccion: "",
      telefono: "",
      email: "",
      cargo: "",
      estado: "ASIGNADO",
      numero_legajo: undefined,
      cuil: "",
      cbu: "",
    },
  });

  const { handleSubmit, setValue, control, reset } = form;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  /**
   * Maneja el cambio en el término de búsqueda
   * Mejora la búsqueda para diferentes tipos de campos:
   * - Optimiza búsqueda por nombre o apellido
   * - Mejora búsqueda por documento o número de legajo
   * - Permite búsqueda por cargo y estado
   */
  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", search);
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };
  const handleEditClick = (empleado: Empleado) => {
    setSelectedEmployee(empleado);
    setIsCreating(false);

    const camposFormulario: (keyof EmpleadoFormulario)[] = [
      "nombre",
      "apellido",
      "documento",
      "fecha_nacimiento",
      "direccion",
      "telefono",
      "email",
      "cargo",
      "estado",
      "numero_legajo",
      "cuil",
      "cbu",
    ];

    camposFormulario.forEach((key) => {
      const value = empleado[key];
      if (value !== undefined) {
        if (key === "fecha_nacimiento") {
          // Manejar fecha de forma segura
          try {
            if (value instanceof Date) {
              setValue(key, value.toISOString().split("T")[0]);
            } else if (typeof value === "string") {
              // Si es una string, intentamos formatearla correctamente
              const dateObj = new Date(value);
              if (!isNaN(dateObj.getTime())) {
                setValue(key, dateObj.toISOString().split("T")[0]);
              } else {
                // Si no es una fecha válida, usamos la string tal como viene
                setValue(key, value);
              }
            }
          } catch (error) {
            console.error("Error al formatear fecha:", error);
            setValue(key, value ? String(value) : "");
          }
        } else {
          setValue(key, String(value));
        }
      }
    });
  };
  const handleCreateClick = () => {
    reset({
      nombre: "",
      apellido: "",
      documento: "",
      fecha_nacimiento: "",
      direccion: "",
      telefono: "",
      email: "",
      cargo: "",
      estado: "ASIGNADO",
      numero_legajo: undefined,
      cuil: "",
      cbu: "",
    });
    setSelectedEmployee(null);
    setIsCreating(true);
  };

  // Esta función ahora sólo muestra el diálogo de confirmación de eliminación
  const handleDeleteClick = (id: number) => {
    setEmployeeToDelete(id);
    setShowDeleteConfirm(true);
  };
  // Función para mostrar próximos servicios
  const handleProximosServiciosClick = async (empleado: Empleado) => {
    if (!empleado.id) return;

    setSelectedEmployeeForServicios(empleado);
    setLoadingProximosServicios(true);
    setShowProximosServicios(true);

    try {
      const servicios = await getProximosServiciosPorEmpleado(empleado.id);
      console.log("Respuesta completa de servicios:", servicios); // Debug

      // Handle different response structures
      if (Array.isArray(servicios)) {
        console.log("Servicios es array:", servicios); // Debug
        setProximosServiciosData(servicios);
      } else if (
        servicios &&
        typeof servicios === "object" &&
        "data" in servicios
      ) {
        if (
          typeof servicios === "object" &&
          servicios !== null &&
          "data" in servicios &&
          Array.isArray((servicios as { data?: unknown }).data)
        ) {
          console.log(
            "Servicios tiene propiedad data:",
            (servicios as { data: unknown }).data
          ); // Debug
          setProximosServiciosData(
            (servicios as { data: ProximoServicio[] }).data
          );
        } else {
          setProximosServiciosData([]);
        }
      } else {
        console.log("Estructura no reconocida, usando array vacío"); // Debug
        setProximosServiciosData([]);
      }
    } catch (error) {
      console.error("Error al cargar próximos servicios:", error);
      toast.error("Error", {
        description:
          "No se pudieron cargar los próximos servicios del empleado.",
        duration: 3000,
      });
      setProximosServiciosData([]);
    } finally {
      setLoadingProximosServicios(false);
    }
  };

  // Función que realmente elimina el empleado después de la confirmación
  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployee(employeeToDelete);
      toast.success("Empleado eliminado", {
        description: "El empleado se ha eliminado correctamente.",
      });
      await fetchEmployees();
    } catch (error) {
      console.error("Error al eliminar el empleado:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "No se pudo eliminar el empleado.";

      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast.error("Error al eliminar empleado", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
    } finally {
      // Limpiar el estado
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };
  // const handleChangeStatus = async (id: number, estado: string) => {
  //   try {
  //     await changeEmployeeStatus(id, estado);
  //     toast.success("Estado actualizado", {
  //       description: `El empleado ahora está ${estado}.`,
  //     });
  //     await fetchEmployees();
  //   } catch (error) {
  //     console.error("Error al cambiar el estado:", error);

  //     // Extraer el mensaje de error para mostrar información más precisa
  //     let errorMessage = "No se pudo cambiar el estado.";

  //     // Si es un error con mensaje personalizado, lo usamos
  //     if (error instanceof Error) {
  //       errorMessage = error.message || errorMessage;
  //     }

  //     toast.error("Error al cambiar estado", {
  //       description: errorMessage,
  //       duration: 5000, // Duración aumentada para mejor visibilidad
  //     });
  //   }
  // };
  const onSubmit = async (data: z.infer<typeof createEmployeeSchema>) => {
    try {
      // Creamos una copia segura de los datos para manipularlos
      const formattedData = { ...data };

      // Aseguramos que la fecha esté en formato correcto
      if (formattedData.fecha_nacimiento) {
        // Verificamos si es una fecha válida
        const date = new Date(formattedData.fecha_nacimiento);
        if (!isNaN(date.getTime())) {
          formattedData.fecha_nacimiento = date.toISOString().split("T")[0];
        }
      }

      if (selectedEmployee && selectedEmployee.id) {
        await editEmployee(selectedEmployee.id, formattedData);
        toast.success("Empleado actualizado", {
          description: "Los cambios se han guardado correctamente.",
        });
      } else {
        const createData: CreateEmployee = {
          ...formattedData,
          fecha_contratacion: new Date().toISOString().split("T")[0],
        };
        await createEmployee(createData);
        toast.success("Empleado creado", {
          description: "El empleado se ha agregado correctamente.",
        });
      }

      await fetchEmployees();
      setIsCreating(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Error en el envío del formulario:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = selectedEmployee
        ? "No se pudo actualizar el empleado."
        : "No se pudo crear el empleado.";

      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast.error("Error en formulario de empleado", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
    }
  }; // Extraer los valores de searchParams que necesitamos, para evitar recreaciones innecesarias de la función
  const currentPageParam = Number(searchParams.get("page")) || 1;
  const searchParam = searchParams.get("search") || "";

  const fetchEmployees = useCallback(async () => {
    // Usar las variables extraídas en lugar de acceder directamente a searchParams
    const currentPage = currentPageParam;
    const search = searchParam;

    // Comenzar la carga
    setLoading(true);
    console.log(
      `Buscando empleados con término: "${search}" en página ${currentPage}, filtro activo: ${activeTab}`
    );

    try {
      // Si estamos en un filtro específico, traemos todos los datos de ese estado
      const shouldLoadAll = activeTab !== "todos";
      const fetchedEmployees = await getEmployees(
        shouldLoadAll ? 1 : currentPage,
        shouldLoadAll ? 999999 : itemsPerPage, // Número grande para traer todos
        search
      );

      // Type guard for expected response shapes
      if (typeof fetchedEmployees === "object" && fetchedEmployees !== null) {
        type EmployeesResponseA = {
          data: Empleado[];
          totalItems?: number;
          currentPage?: number;
        };
        type EmployeesResponseB = {
          items: Empleado[];
          total?: number;
          page?: number;
        };
        const fe = fetchedEmployees as
          | EmployeesResponseA
          | EmployeesResponseB
          | Empleado[];
        if (
          typeof fe === "object" &&
          fe !== null &&
          "data" in fe &&
          Array.isArray((fe as EmployeesResponseA).data)
        ) {
          setEmployees((fe as EmployeesResponseA).data);
          setTotal((fe as EmployeesResponseA).totalItems || 0);
          setPage((fe as EmployeesResponseA).currentPage || 1);
        } else if (
          typeof fe === "object" &&
          fe !== null &&
          "items" in fe &&
          Array.isArray((fe as EmployeesResponseB).items)
        ) {
          setEmployees((fe as EmployeesResponseB).items);
          setTotal((fe as EmployeesResponseB).total || 0);
          setPage((fe as EmployeesResponseB).page || 1);
        } else if (Array.isArray(fe)) {
          setEmployees(fe as Empleado[]);
          setTotal((fe as Empleado[]).length);
          setPage(currentPage);
        } else {
          console.error(
            "Formato de respuesta no reconocido:",
            fetchedEmployees
          );
        }
      } else if (Array.isArray(fetchedEmployees)) {
        setEmployees(fetchedEmployees as Empleado[]);
        setTotal((fetchedEmployees as Empleado[]).length);
        setPage(currentPage);
      } else {
        console.error("Formato de respuesta no reconocido:", fetchedEmployees);
      }
    } catch (error) {
      console.error("Error al cargar los empleados:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "No se pudieron cargar los empleados.";

      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast.error("Error al cargar empleados", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });

      // Si hay un error al cargar, establecer valores por defecto seguros
      setEmployees([]);
      setTotal(0);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [currentPageParam, searchParam, itemsPerPage, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Siempre resetear a página 1 cuando cambiamos de filtro
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const filteredEmployees =
    activeTab === "todos"
      ? employees
      : employees.filter((emp) => emp.estado === activeTab.toUpperCase());

  // Determinar si usar paginación remota o local
  const useRemotePagination = activeTab === "todos";
  const effectiveTotalItems = useRemotePagination ? total : filteredEmployees.length;
  const effectiveCurrentPage = useRemotePagination ? page : currentPageParam;

  // Manejador de página que funciona tanto para paginación remota como local
  const handlePageChangeUnified = (page: number) => {
    if (useRemotePagination) {
      handlePageChange(page);
    } else {
      // Para paginación local, solo actualizamos la URL para mantener consistencia
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.replace(`?${params.toString()}`);
    }
  };

  // Separamos el efecto para el estado de "primera carga"
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [isFirstLoad]);

  // Un efecto separado para reaccionar a cambios en los parámetros de búsqueda
  useEffect(() => {
    if (!isFirstLoad) {
      fetchEmployees();
    }
  }, [fetchEmployees, isFirstLoad, currentPageParam, searchParam, activeTab]);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Gestión de Personal
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra la información de empleados de la empresa
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Empleado
          </Button>
        </div>

        {/* Agregar esta sección de información de estados */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Estados de Empleados
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    DISPONIBLE
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Listo para ser asignado a servicios
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    ASIGNADO
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Actualmente asignado a un servicio
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    VACACIONES
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Empleado de vacaciones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    LICENCIA
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Con licencia médica u otra
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                    INACTIVO
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Temporalmente inactivo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    BAJA
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Ya no trabaja en la empresa
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                <strong>Nota:</strong> Solo los empleados con estado
                &quot;DISPONIBLE&quot; o &quot;ASIGNADO&quot; pueden ser
                asignados a servicios.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Tabs
            defaultValue="todos"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid grid-cols-4 w-[500px]">
              <TabsTrigger value="todos" className="flex items-center">
                <UserRound className="mr-2 h-4 w-4" />
                Todos
              </TabsTrigger>{" "}
              <TabsTrigger value="asignado" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Asignados
              </TabsTrigger>
              <TabsTrigger value="suspendido" className="flex items-center">
                <PauseCircle className="mr-2 h-4 w-4" />
                Suspendidos
              </TabsTrigger>
              <TabsTrigger value="disponible" className="flex items-center">
                <BadgeInfo className="mr-2 h-4 w-4" />
                Disponibles
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {" "}
        <div className="rounded-md border">
          <ListadoTabla
            title=""
            data={filteredEmployees}
            itemsPerPage={itemsPerPage}
            searchableKeys={[
              "nombre",
              "apellido",
              "documento",
              "cargo",
              "estado",
              "numero_legajo",
            ]}
            searchPlaceholder="Buscar por nombre, apellido, documento... (presiona Enter)"
            remotePagination={useRemotePagination}
            totalItems={effectiveTotalItems}
            currentPage={effectiveCurrentPage}
            onPageChange={handlePageChangeUnified}
            onSearchChange={handleSearchChange}
            columns={[
              { title: "Empleado", key: "empleado" },
              { title: "Contacto", key: "contacto" },
              { title: "Información", key: "informacion" },
              { title: "Documentación", key: "documentacion" },
              { title: "Estado", key: "estado" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(empleado) => (
              <>
                <TableCell className="min-w-[250px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserRound className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium">{`${empleado.nombre} ${empleado.apellido}`}</div>
                      <div className="text-sm text-muted-foreground">{`Legajo: ${
                        empleado.numero_legajo || "N/A"
                      }`}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{empleado.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{empleado.telefono}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{empleado.cargo}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>
                        {empleado.fecha_contratacion &&
                          new Date(
                            empleado.fecha_contratacion
                          ).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>
                        DNI: {empleado.documento || "No especificado"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>CUIL: {empleado.cuil || "No especificado"}</span>
                    </div>
                  </div>{" "}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      empleado.estado === "ASIGNADO"
                        ? "default"
                        : empleado.estado === "SUSPENDIDO"
                        ? "destructive"
                        : "outline"
                    }
                    className={
                      empleado.estado === "ASIGNADO"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : empleado.estado === "SUSPENDIDO"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {empleado.estado}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(empleado)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      empleado.id && handleDeleteClick(empleado.id)
                    }
                    className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProximosServiciosClick(empleado)}
                    className="cursor-pointer border-blue-200 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Próximos Servicios
                  </Button>
                </TableCell>
              </>
            )}
          />
        </div>
      </CardContent>
      <FormDialog
        open={isCreating || selectedEmployee !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setSelectedEmployee(null);
          }
        }}
        title={selectedEmployee ? "Editar Empleado" : "Crear Empleado"}
        description={
          selectedEmployee
            ? "Modificar información del empleado en el sistema."
            : "Completa el formulario para registrar un nuevo empleado."
        }
        onSubmit={handleSubmit(onSubmit)}
        // Remove className prop as it's not accepted by FormDialog
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Controller
            name="nombre"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Nombre"
                name="nombre"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ingrese el nombre"
              />
            )}
          />

          <Controller
            name="apellido"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Apellido"
                name="apellido"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ingrese el apellido"
              />
            )}
          />

          <Controller
            name="documento"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Número de Documento"
                name="documento"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ej: 35789654"
              />
            )}
          />

          <Controller
            name="fecha_nacimiento"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                type="date"
              />
            )}
          />

          <Controller
            name="direccion"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Dirección"
                name="direccion"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Dirección completa"
              />
            )}
          />

          <Controller
            name="telefono"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Teléfono"
                name="telefono"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ej: 123-4567-8901"
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Email"
                name="email"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="correo@ejemplo.com"
              />
            )}
          />

          <Controller
            name="cargo"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Cargo"
                name="cargo"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Cargo o puesto"
              />
            )}
          />

          <Controller
            name="numero_legajo"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Número de Legajo"
                name="numero_legajo"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                type="number"
                placeholder="Ej: 12345"
              />
            )}
          />

          <Controller
            name="cuil"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="CUIL"
                name="cuil"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ej: 20-35789654-0"
              />
            )}
          />

          <Controller
            name="cbu"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="CBU"
                name="cbu"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ej: 2212125212365254258555 (22 dígitos)"
              />
            )}
          />

          <Controller
            name="estado"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Estado"
                name="estado"
                fieldType="select"
                value={field.value || ""}
                onChange={(selectedValue: string) =>
                  field.onChange(selectedValue)
                }
                options={[
                  { label: "Asignado", value: "ASIGNADO" },
                  { label: "Disponible", value: "DISPONIBLE" },
                  { label: "Suspendido", value: "SUSPENDIDO" },
                ]}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>{" "}
      </FormDialog>
      <FormDialog
        open={showDeleteConfirm}
        submitButtonText="Eliminar"
        submitButtonVariant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
          }
        }}
        title="Confirmar eliminación"
        onSubmit={(e) => {
          e.preventDefault();
          confirmDeleteEmployee();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">¡Atención!</p>
          <p>
            Esta acción eliminará permanentemente este empleado. Esta operación
            no se puede deshacer.
          </p>{" "}
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
      </FormDialog>

      {/* Modal de Próximos Servicios */}
      <Dialog
        open={showProximosServicios}
        onOpenChange={setShowProximosServicios}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Próximos Servicios - {selectedEmployeeForServicios?.nombre}{" "}
              {selectedEmployeeForServicios?.apellido}
            </DialogTitle>
            <DialogDescription>
              Lista de servicios próximos asignados al empleado
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loadingProximosServicios ? (
              <div className="flex justify-center items-center py-8">
                <Loader />
              </div>
            ) : proximosServiciosData.length > 0 ? (
              <div className="space-y-3">
                {proximosServiciosData.map((servicio, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {servicio.cliente?.nombre ||
                            "Cliente no especificado"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          <strong>Fecha Programada:</strong>{" "}
                          {servicio.fechaProgramada
                            ? new Date(
                                servicio.fechaProgramada
                              ).toLocaleDateString("es-AR")
                            : "No especificada"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Cantidad de Empleados:</strong>{" "}
                          {servicio.cantidadEmpleados || "No especificada"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Cantidad de Baños:</strong>{" "}
                          {servicio.cantidadBanos || "No especificada"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Ubicación:</strong>{" "}
                          {servicio.ubicacion || "No especificada"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Tipo de Servicio:</strong>{" "}
                          {servicio.tipoServicio || "No especificado"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Cantidad de Vehículos:</strong>{" "}
                          {servicio.cantidadVehiculos || "No especificada"}
                        </p>
                        <div className="mt-2">
                          <Badge
                            variant={
                              servicio.estado === "PROGRAMADO"
                                ? "default"
                                : "outline"
                            }
                            className={
                              servicio.estado === "PROGRAMADO"
                                ? "bg-blue-100 text-blue-800"
                                : servicio.estado === "ASIGNADO"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {servicio.estado || "Sin estado"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Fecha Inicio:</strong>{" "}
                            {servicio.fechaInicio
                              ? new Date(
                                  servicio.fechaInicio
                                ).toLocaleDateString("es-AR")
                              : "No especificada"}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Fecha Fin:</strong>{" "}
                            {servicio.fechaFin
                              ? new Date(servicio.fechaFin).toLocaleDateString(
                                  "es-AR"
                                )
                              : "No especificada"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Cliente Email:</strong>{" "}
                            {servicio.cliente?.email || "No especificado"}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Cliente Teléfono:</strong>{" "}
                            {servicio.cliente?.telefono || "No especificado"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {servicio.notas && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Notas:</strong> {servicio.notas}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No hay próximos servicios asignados a este empleado
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
