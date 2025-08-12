"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ListadoTabla } from "@/components/ui/local/ListadoTabla";
import { Badge } from "@/components/ui/badge";
import { EmpleadoSelector } from "@/components/ui/local/SearchSelector/Selectors";
import {
  CreateEmployeeLeaveDto,
  LeaveType,
  UpdateEmployeeLeaveDto,
} from "@/types/types";
import { TableCell } from "../ui/table";
import { useCallback, useEffect, useState } from "react";
import {
  getEmployeeLeaves,
  createEmployeeLeave,
  updateEmployeeLeave,
  deleteEmployeeLeave,
  approveEmployeeLeave,
  rejectEmployeeLeave,
} from "@/app/actions/LicenciasEmpleados";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FormDialog } from "../ui/local/FormDialog";
import { FormField } from "../ui/local/FormField";
import Loader from "../ui/local/Loader";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserRound,
  Edit2,
  Trash2,
  CheckCircle,
  PauseCircle,
  Calendar,
  FileText,
  Plus,
} from "lucide-react";
import { LicenciaEmpleado } from "@/types/licenciasTypes";

export default function LicenciasEmpleadosComponent({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: LicenciaEmpleado[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Validar y proporcionar un valor seguro para data
  const safeData = Array.isArray(data) ? data : [];

  const [licencias, setLicencias] = useState<LicenciaEmpleado[]>(safeData);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedLicencia, setSelectedLicencia] =
    useState<LicenciaEmpleado | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("todos");
  // Estados para los diálogos de confirmación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [licenciaToDelete, setLicenciaToDelete] = useState<number | null>(null);
  // Nuevos estados para confirmación de aprobación y rechazo
  const [showApproveConfirm, setShowApproveConfirm] = useState<boolean>(false);
  const [licenciaToApprove, setLicenciaToApprove] = useState<number | null>(
    null
  );
  const [showRejectConfirm, setShowRejectConfirm] = useState<boolean>(false);
  const [licenciaToReject, setLicenciaToReject] = useState<number | null>(null);

  // En la definición del esquema de validación
  const createLicenciaSchema = z.object({
    employeeId: z.number({
      required_error: "El empleado es obligatorio",
      invalid_type_error: "El empleado es obligatorio",
    }),
    fechaInicio: z.string().min(1, "La fecha de inicio es obligatoria"),
    fechaFin: z.string().min(1, "La fecha de fin es obligatoria"),
    tipoLicencia: z.enum(
      [
        LeaveType.VACACIONES,
        LeaveType.ENFERMEDAD,
        LeaveType.CASAMIENTO,
        LeaveType.FALLECIMIENTO_FAMILIAR,
        LeaveType.NACIMIENTO,
      ],
      {
        errorMap: () => ({ message: "El tipo de licencia es obligatorio" }),
      }
    ),
    notas: z.string().optional(),
  });

  // 2. Ahora actualizamos el formulario para usar el campo correcto
  const form = useForm<z.infer<typeof createLicenciaSchema>>({
    resolver: zodResolver(createLicenciaSchema),
    defaultValues: {
      employeeId: 0,
      fechaInicio: "",
      fechaFin: "",
      tipoLicencia: LeaveType.VACACIONES,
      notas: "",
    },
  });

  const { handleSubmit, setValue, control, reset } = form;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", search);
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleEditClick = (licencia: LicenciaEmpleado) => {
    try {
      setSelectedLicencia(licencia);
      setIsCreating(false);

      const camposFormulario = [
        "employeeId",
        "fechaInicio",
        "fechaFin",
        "tipoLicencia",
        "notas",
      ] as const;

      camposFormulario.forEach((key) => {
        if (key in licencia) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue(key as any, licencia[key as keyof typeof licencia]);
        }
      });
    } catch (error) {
      console.error("Error al cargar datos para editar:", error);
      toast.error("Error al editar", {
        description: "No se pudieron cargar los datos para editar la licencia.",
        duration: 5000,
      });
    }
  };

  const handleCreateClick = () => {
    try {
      reset({
        employeeId: 0,
        fechaInicio: "",
        fechaFin: "",
        tipoLicencia: LeaveType.VACACIONES,
        notas: "",
      });
      setSelectedLicencia(null);
      setIsCreating(true);
    } catch (error) {
      console.error("Error al preparar formulario de creación:", error);
      toast.error("Error", {
        description: "No se pudo iniciar la creación de licencia.",
        duration: 3000,
      });
    }
  };

  // Esta función ahora sólo muestra el diálogo de confirmación para eliminar
  const handleDeleteClick = (id: number) => {
    setLicenciaToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Nuevas funciones para mostrar los diálogos de confirmación
  const handleApproveClick = (id: number) => {
    setLicenciaToApprove(id);
    setShowApproveConfirm(true);
  };

  const handleRejectClick = (id: number) => {
    setLicenciaToReject(id);
    setShowRejectConfirm(true);
  };

  // Función que realmente elimina después de la confirmación
  const confirmDeleteLicencia = async () => {
    if (!licenciaToDelete) return;

    try {
      setLoading(true);
      await deleteEmployeeLeave(licenciaToDelete);
      toast.success("Licencia eliminada", {
        description: "La licencia se ha eliminado correctamente.",
      });
      await fetchLicencias();
    } catch (error) {
      console.error("Error al eliminar la licencia:", error);

      // Extraer mensaje de error más descriptivo
      let errorMessage = "No se pudo eliminar la licencia.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al eliminar", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setShowDeleteConfirm(false);
      setLicenciaToDelete(null);
      setLoading(false);
    }
  };

  // Nuevas funciones para confirmar aprobación y rechazo
  const confirmApproveLicencia = async () => {
    if (!licenciaToApprove) return;

    try {
      setLoading(true);
      await approveEmployeeLeave(licenciaToApprove);
      toast.success("Licencia aprobada", {
        description: "La licencia ha sido aprobada correctamente.",
      });
      await fetchLicencias();
    } catch (error) {
      console.error("Error al aprobar la licencia:", error);

      let errorMessage = "No se pudo aprobar la licencia.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al aprobar", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setShowApproveConfirm(false);
      setLicenciaToApprove(null);
      setLoading(false);
    }
  };

  const confirmRejectLicencia = async () => {
    if (!licenciaToReject) return;

    try {
      setLoading(true);
      await rejectEmployeeLeave(licenciaToReject);
      toast.success("Licencia rechazada", {
        description: "La licencia ha sido rechazada correctamente.",
      });
      await fetchLicencias();
    } catch (error) {
      console.error("Error al rechazar la licencia:", error);

      let errorMessage = "No se pudo rechazar la licencia.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al rechazar", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setShowRejectConfirm(false);
      setLicenciaToReject(null);
      setLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof createLicenciaSchema>) => {
    try {
      setLoading(true);

      // Validar fechas
      const fechaInicio = new Date(data.fechaInicio);
      const fechaFin = new Date(data.fechaFin);

      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        throw new Error("Las fechas ingresadas no son válidas");
      }

      if (fechaInicio > fechaFin) {
        throw new Error(
          "La fecha de inicio debe ser anterior a la fecha de fin"
        );
      }

      if (selectedLicencia && selectedLicencia.id) {
        const updateData: UpdateEmployeeLeaveDto = {
          employeeId: data.employeeId,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          tipoLicencia: data.tipoLicencia,
          notas: data.notas || "",
        };
        await updateEmployeeLeave(selectedLicencia.id, updateData);
        toast.success("Licencia actualizada", {
          description: "Los cambios se han guardado correctamente.",
        });
      } else {
        const createData: CreateEmployeeLeaveDto = {
          employeeId: data.employeeId,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          tipoLicencia: data.tipoLicencia,
          notas: data.notas || "",
        };
        await createEmployeeLeave(createData);
        toast.success("Licencia creada", {
          description: "La licencia se ha creado correctamente.",
        });
      }

      await fetchLicencias();
      setIsCreating(false);
      setSelectedLicencia(null);
    } catch (error) {
      console.error("Error en el envío del formulario:", error);

      // Extraer mensaje de error más descriptivo
      let errorMessage = selectedLicencia
        ? "No se pudo actualizar la licencia."
        : "No se pudo crear la licencia.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLicencias = useCallback(async () => {
    const currentPage = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    setLoading(true);

    try {
      const fetchedLicencias = await getEmployeeLeaves(
        currentPage,
        itemsPerPage,
        search
      );

      // Manejar diferentes formatos de respuesta posibles
      if (Array.isArray(fetchedLicencias)) {
        setLicencias(fetchedLicencias);
        setTotal(fetchedLicencias.length);
        setPage(currentPage);
      } else if (
        typeof fetchedLicencias === "object" &&
        fetchedLicencias !== null
      ) {
        if (
          "data" in fetchedLicencias &&
          Array.isArray(fetchedLicencias.data)
        ) {
          setLicencias(fetchedLicencias.data);
          setTotal(fetchedLicencias.totalItems || fetchedLicencias.data.length);
          setPage(fetchedLicencias.currentPage || 1);
        } else if (
          "items" in fetchedLicencias &&
          Array.isArray(fetchedLicencias.items)
        ) {
          setLicencias(fetchedLicencias.items);
          // setTotal(fetchedLicencias.total || fetchedLicencias.items.length);
          // setPage(fetchedLicencias.page || 1);
          setTotal(fetchedLicencias.items.length);
          setPage(1);
        } else {
          console.error(
            "Formato de respuesta no reconocido:",
            fetchedLicencias
          );
          toast.error("Error de formato", {
            description: "El formato de respuesta del servidor no es válido.",
            duration: 5000,
          });
          setLicencias([]);
          setTotal(0);
          setPage(1);
        }
      } else {
        console.error("Respuesta no válida:", fetchedLicencias);
        toast.error("Error de datos", {
          description: "Los datos recibidos no son válidos.",
          duration: 5000,
        });
        setLicencias([]);
        setTotal(0);
        setPage(1);
      }
    } catch (error) {
      console.error("Error al cargar las licencias:", error);

      // Extraer mensaje de error más descriptivo
      let errorMessage = "No se pudieron cargar las licencias.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al cargar licencias", {
        description: errorMessage,
        duration: 5000,
      });

      // Establecer estados por defecto en caso de error
      setLicencias([]);
      setTotal(0);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, itemsPerPage]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    } else {
      fetchLicencias();
    }
  }, [fetchLicencias, isFirstLoad]);

  // Función para manejar el cambio de pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Funciones mejoradas para obtener y mostrar el estado de aprobación
  const getApprovalStatus = (
    licencia: LicenciaEmpleado
  ): "APPROVED" | "REJECTED" | "PENDING" => {
    try {
      // Usar la propiedad booleana aprobado para determinar el estado
      if (licencia.aprobado === true) {
        return "APPROVED";
      }
      // Si hay un comentario de rechazo, consideramos que está rechazada
      else if (licencia.comentarioRechazo) {
        return "REJECTED";
      }
      // Por defecto, pendiente
      else {
        return "PENDING";
      }
    } catch (error) {
      console.error("Error al determinar el estado de aprobación:", error);
      return "PENDING"; // Valor por defecto seguro
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "outline" | "destructive" => {
    try {
      const variants: Record<string, "default" | "outline" | "destructive"> = {
        PENDING: "outline",
        APPROVED: "default",
        REJECTED: "destructive",
      };
      return variants[status] || "outline";
    } catch (error) {
      console.error("Error al determinar variante del badge:", error);
      return "outline"; // Valor por defecto seguro
    }
  };

  // Filtrar licencias según la pestaña activa
  const filteredLicencias =
    activeTab === "todos"
      ? licencias
      : licencias.filter((licencia) => {
          try {
            const status = getApprovalStatus(licencia);
            return status === activeTab.toUpperCase();
          } catch (error) {
            console.error("Error al filtrar licencia:", error);
            return false; // Omitir esta licencia en caso de error
          }
        });

  // Función para formatear fechas de manera segura
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Fecha inválida");
      }
      return date.toLocaleDateString("es-AR");
    } catch (error) {
      console.error(`Error al formatear fecha '${dateString}':`, error);
      return "Fecha no válida";
    }
  };

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
              Licencias de Empleados
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra las licencias y permisos del personal
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Licencia
          </Button>
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
                Todas
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center">
                <PauseCircle className="mr-2 h-4 w-4" />
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobadas
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Rechazadas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="rounded-md border">
          <ListadoTabla
            title=""
            data={filteredLicencias}
            itemsPerPage={itemsPerPage}
            searchableKeys={[
              "tipoLicencia",
              "employee.nombre",
              "employee.apellido",
              "empleado.nombre",
              "empleado.apellido",
            ]}
            searchPlaceholder="Buscar por empleado o tipo..."
            remotePagination
            totalItems={total}
            currentPage={page}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            columns={[
              { title: "Empleado", key: "employee" },
              { title: "Tipo", key: "tipoLicencia" },
              { title: "Periodo", key: "fechas" },
              { title: "Estado", key: "status" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(licencia) => (
              <>
                <TableCell className="min-w-[250px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserRound className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {/* Intenta primero con employee (estructura actual) */}
                        {licencia.employee?.nombre ||
                          licencia.empleado?.nombre}{" "}
                        {licencia.employee?.apellido ||
                          licencia.empleado?.apellido}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {licencia.employee?.cargo ||
                          licencia.empleado?.cargo ||
                          ""}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium">
                      <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {licencia.tipoLicencia}
                    </div>
                    {licencia.notas && (
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {licencia.notas}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>
                        Desde:{" "}
                        {licencia.fechaInicio
                          ? formatDate(licencia.fechaInicio)
                          : "No disponible"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>
                        Hasta:{" "}
                        {licencia.fechaFin
                          ? formatDate(licencia.fechaFin)
                          : "No disponible"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(getApprovalStatus(licencia))}
                    className={
                      getApprovalStatus(licencia) === "APPROVED"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : getApprovalStatus(licencia) === "REJECTED"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    }
                  >
                    {getApprovalStatus(licencia) === "APPROVED"
                      ? "Aprobada"
                      : getApprovalStatus(licencia) === "REJECTED"
                      ? "Rechazada"
                      : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(licencia)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>

                  {getApprovalStatus(licencia) === "PENDING" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          licencia.id && handleApproveClick(licencia.id)
                        }
                        className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Aprobar
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          licencia.id && handleRejectClick(licencia.id)
                        }
                        className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                      >
                        <PauseCircle className="h-3.5 w-3.5 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      licencia.id && handleDeleteClick(licencia.id)
                    }
                    className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>
                </TableCell>
              </>
            )}
          />
        </div>
      </CardContent>

      {/* Diálogo de confirmación para eliminación */}
      <FormDialog
        open={showDeleteConfirm}
        submitButtonText="Eliminar"
        submitButtonVariant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm(false);
            setLicenciaToDelete(null);
          }
        }}
        title="Confirmar eliminación"
        onSubmit={(e) => {
          e.preventDefault();
          confirmDeleteLicencia();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">¡Atención!</p>
          <p>
            Esta acción eliminará permanentemente esta licencia. Esta operación
            no se puede deshacer.
          </p>
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
      </FormDialog>

      {/* Nuevo diálogo de confirmación para aprobación */}
      <FormDialog
        open={showApproveConfirm}
        submitButtonText="Aprobar"
        submitButtonVariant="default"
        onOpenChange={(open) => {
          if (!open) {
            setShowApproveConfirm(false);
            setLicenciaToApprove(null);
          }
        }}
        title="Confirmar aprobación"
        onSubmit={(e) => {
          e.preventDefault();
          confirmApproveLicencia();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-green-600 font-semibold">Aprobar licencia</p>
          <p>Esta acción aprobará la solicitud de licencia del empleado.</p>
          <p>¿Estás seguro de que deseas aprobar esta licencia?</p>
        </div>
      </FormDialog>

      {/* Nuevo diálogo de confirmación para rechazo */}
      <FormDialog
        open={showRejectConfirm}
        submitButtonText="Rechazar"
        submitButtonVariant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setShowRejectConfirm(false);
            setLicenciaToReject(null);
          }
        }}
        title="Confirmar rechazo"
        onSubmit={(e) => {
          e.preventDefault();
          confirmRejectLicencia();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">Rechazar licencia</p>
          <p>Esta acción rechazará la solicitud de licencia del empleado.</p>
          <p>¿Estás seguro de que deseas rechazar esta licencia?</p>
        </div>
      </FormDialog>

      {/* Formulario de creación/edición */}
      <FormDialog
        open={isCreating || selectedLicencia !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setSelectedLicencia(null);
          }
        }}
        title={selectedLicencia ? "Editar Licencia" : "Crear Licencia"}
        description={
          selectedLicencia
            ? "Modificar la información de la licencia seleccionada."
            : "Completa el formulario para registrar una nueva licencia."
        }
        onSubmit={handleSubmit(onSubmit)}
      >
        <>
          <Controller
            name="employeeId"
            control={control}
            render={({ field, fieldState }) => (
              <EmpleadoSelector
                label="Empleado"
                name="employeeId"
                value={field.value}
                onChange={(empleadoId) => field.onChange(empleadoId)}
                error={fieldState.error?.message}
                disabled={false}
              />
            )}
          />

          <Controller
            name="tipoLicencia"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Tipo de Licencia"
                name="tipoLicencia"
                fieldType="select"
                value={field.value || ""}
                onChange={(selectedValue: string) =>
                  field.onChange(selectedValue)
                }
                options={[
                  { label: "Vacaciones", value: LeaveType.VACACIONES },
                  { label: "Enfermedad", value: LeaveType.ENFERMEDAD },
                  {
                    label: "Fallecimiento Familiar",
                    value: LeaveType.FALLECIMIENTO_FAMILIAR,
                  },
                  { label: "Casamiento", value: LeaveType.CASAMIENTO },
                  { label: "Nacimiento", value: LeaveType.NACIMIENTO },
                ]}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="fechaInicio"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de Inicio"
                name="fechaInicio"
                type="date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="fechaFin"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de Fin"
                name="fechaFin"
                type="date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="notas"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="notas"
                name="notas"
                value={field.value || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </>
      </FormDialog>
    </Card>
  );
}
