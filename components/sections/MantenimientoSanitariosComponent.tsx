"use client";
import {
  completarMantenimientoSanitario,
  createSanitarioEnMantenimiento,
  deleteSanitarioEnMantenimiento,
  editSanitarioEnMantenimiento,
  getSanitariosEnMantenimiento,
} from "@/app/actions/sanitarios";
import { getEmployeeById } from "@/app/actions/empleados";
import { SanitarioSelector } from "@/components/ui/local/SearchSelector/Selectors/SanitarioSelector";
import { EmpleadoSelector } from "@/components/ui/local/SearchSelector/Selectors/EmpleadoSelector";
import { MantenimientoSanitario } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Loader from "../ui/local/Loader";
import { ListadoTabla } from "../ui/local/ListadoTabla";
import { TableCell } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { FormDialog } from "../ui/local/FormDialog";
import { FormField } from "../ui/local/FormField";
import {
  Toilet,
  Edit2,
  Trash2,
  CheckCircle,
  PlusCircle,
  RefreshCcw,
  Calendar,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMaintenanceToiletStore } from "@/store/maintenanceToiletStore";

const MantenimientoSanitariosComponent = ({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: MantenimientoSanitario[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mantenimientoSanitarios, setMantenimientoSanitarios] =
    useState<MantenimientoSanitario[]>(data);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMantenimientoSanitario, setSelectedMantenimientoSanitario] =
    useState<MantenimientoSanitario | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [mantenimientoToComplete, setMantenimientoToComplete] = useState<
    number | null
  >(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [mantenimientoToDelete, setMantenimientoToDelete] = useState<
    number | null
  >(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get("search") || "");
  const createSanitarioSchema = z.object({
    baño_id: z.number({
      required_error: "El baño es obligatorio",
      invalid_type_error: "El ID del baño debe ser un número",
    }),

    fecha_mantenimiento: z.string().optional(),

    tipo_mantenimiento: z.enum(["Preventivo", "Correctivo"], {
      errorMap: () => ({
        message:
          "El tipo de mantenimiento debe ser 'Preventivo' o 'Correctivo'",
      }),
    }),
    descripcion: z.string().min(1, "La descripción es obligatoria"),
    empleado_id: z
      .number({
        required_error: "El técnico responsable es obligatorio",
        invalid_type_error: "Debe seleccionar un empleado válido",
      })
      .positive("Debe seleccionar un empleado válido"),

    costo: z
      .number({
        invalid_type_error: "El costo debe ser un número",
      })
      .nonnegative("El costo no puede ser negativo")
      .optional(),
  });
  const form = useForm<z.infer<typeof createSanitarioSchema>>({
    resolver: zodResolver(createSanitarioSchema),
    defaultValues: {
      baño_id: 0,
      fecha_mantenimiento: new Date().toISOString().split("T")[0],
      tipo_mantenimiento: "Preventivo",
      descripcion: "",
      empleado_id: 1, // Temporary default - user must select an employee
      costo: undefined,
    },
  });

  const { handleSubmit, setValue, control, reset } = form;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    // Solo actualizar el estado local, no la URL
    // La URL se actualizará cuando el debounce del ListadoTabla termine
    setSearchTerm(search);
    
    // Actualizar URL cuando llegue la llamada desde ListadoTabla (ya con debounce)
    const params = new URLSearchParams(searchParams.toString());
    
    if (!search || search.trim() === "") {
      params.delete("search");
    } else {
      params.set("search", search);
    }
    
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const filteredMantenimientos =
    activeTab === "todos"
      ? mantenimientoSanitarios
      : mantenimientoSanitarios.filter((man) => {
          if (activeTab === "pendiente")
            return (
              !man.completado &&
              new Date(man.fecha_mantenimiento || "") >= new Date()
            );
          if (activeTab === "proceso")
            return (
              !man.completado &&
              new Date(man.fecha_mantenimiento || "") < new Date()
            );
          if (activeTab === "completado") return man.completado;
          return true;
        });

  const handleEditClick = (mantenimientoSanitario: MantenimientoSanitario) => {
    setSelectedMantenimientoSanitario(mantenimientoSanitario);
    setIsCreating(false);
    setValue("baño_id", mantenimientoSanitario.baño_id ?? 0);
    setValue(
      "fecha_mantenimiento",
      mantenimientoSanitario.fecha_mantenimiento ||
        new Date().toISOString().split("T")[0]
    );
    setValue(
      "tipo_mantenimiento",
      mantenimientoSanitario.tipo_mantenimiento === "Preventivo"
        ? "Preventivo"
        : "Correctivo"
    );
    setValue("descripcion", mantenimientoSanitario.descripcion);
    setValue(
      "empleado_id",
      typeof mantenimientoSanitario.empleado_id === "string"
        ? 1 // Si es string (legacy data), usar 1 como default para que pase validación
        : mantenimientoSanitario.empleado_id || 1
    );
    setValue("costo", mantenimientoSanitario.costo);
  };
  const handleCreateClick = () => {
    reset({
      baño_id: 0,
      fecha_mantenimiento: new Date().toISOString().split("T")[0],
      tipo_mantenimiento: "Preventivo",
      descripcion: "",
      empleado_id: 1, // Temporary default - user must select an employee
      costo: undefined,
    });
    setSelectedMantenimientoSanitario(null);
    setIsCreating(true);
  };
  // Esta función ahora solo muestra el diálogo de confirmación
  const handleDeleteClick = (id: number) => {
    setMantenimientoToDelete(id);
    setConfirmDeleteDialogOpen(true);
  };

  // Función que realmente elimina después de la confirmación
  const confirmDelete = async () => {
    if (!mantenimientoToDelete) return;

    try {
      setLoading(true);
      await deleteSanitarioEnMantenimiento(mantenimientoToDelete);

      toast.success("Mantenimiento eliminado", {
        description:
          "El registro de mantenimiento se ha eliminado correctamente.",
        duration: 3000,
      });

      await fetchSanitariosMantenimiento();
    } catch (error) {
      console.error("Error al eliminar el mantenimiento:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast.error("Error al eliminar mantenimiento", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setConfirmDeleteDialogOpen(false);
      setMantenimientoToDelete(null);
    }
  };
  const handleCompleteClick = async (id: number) => {
    try {
      setLoading(true);
      await completarMantenimientoSanitario(id);

      toast.success("Mantenimiento completado", {
        description: "El mantenimiento se ha marcado como completado.",
        duration: 3000,
      });

      await fetchSanitariosMantenimiento();
    } catch (error) {
      console.error("Error al completar el mantenimiento:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast.error("Error al completar mantenimiento", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  const onSubmit = async (data: z.infer<typeof createSanitarioSchema>) => {
    try {
      setLoading(true); // Debug: Log the form data
      console.log("Form data:", data);
      console.log("empleado_id:", data.empleado_id, typeof data.empleado_id);

      // Validate empleado_id before processing
      if (!data.empleado_id || data.empleado_id <= 0) {
        toast.error("Error de validación", {
          description: "Debe seleccionar un empleado válido",
          duration: 5000,
        });
        return;
      }

      // Fetch employee name from ID
      let empleadoNombre = "";
      if (data.empleado_id && data.empleado_id > 0) {
        try {
          const empleado = (await getEmployeeById(
            data.empleado_id.toString()
          )) as {
            nombre: string;
            apellido: string;
          };
          empleadoNombre = `${empleado.nombre} ${empleado.apellido}`;
        } catch (error) {
          console.error("Error fetching employee:", error);
          toast.error("Error", {
            description:
              "No se pudo obtener la información del empleado seleccionado",
            duration: 5000,
          });
          return;
        }
      } // Transform the form data to match API expectations
      const submitData: MantenimientoSanitario = {
        ...data,
        empleado_id: Number(data.empleado_id), // Ensure it's a number for API compatibility
        costo: data.costo || 0, // Default to 0 if undefined
      };

      // Debug: Log the submit data with type information
      console.log("Submit data:", submitData);
      console.log(
        "empleado_id",
        submitData.empleado_id,
        typeof submitData.empleado_id
      );

      if (
        selectedMantenimientoSanitario &&
        selectedMantenimientoSanitario.mantenimiento_id
      ) {
        // Actualizar mantenimiento existente
        const result = await editSanitarioEnMantenimiento(
          selectedMantenimientoSanitario.mantenimiento_id,
          submitData
        );

        // Verificar resultado
        if (result) {
          toast.success("Mantenimiento actualizado", {
            description: "Los cambios se han guardado correctamente.",
            duration: 3000,
          });
        }
      } else {
        // Crear nuevo mantenimiento
        console.log("Creating new maintenance with data:", submitData);
        const result = await createSanitarioEnMantenimiento(submitData);

        // Verificar resultado
        if (result) {
          toast.success("Mantenimiento creado", {
            description: "El mantenimiento se ha registrado correctamente.",
            duration: 3000,
          });
        }
      }

      await fetchSanitariosMantenimiento();
      setIsCreating(false);
      setSelectedMantenimientoSanitario(null);
    } catch (error) {
      console.error("Error en el envío del formulario:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast.error(
        selectedMantenimientoSanitario
          ? "Error al actualizar mantenimiento"
          : "Error al crear mantenimiento",
        {
          description: errorMessage,
          duration: 5000,
        }
      );
    } finally {
      setLoading(false);
    }
  }; // Definición del tipo fuera de la función para evitar errores de importación
  type ApiResponse = {
    data: MantenimientoSanitario[];
    total: number;
    page: number;
  };
  const fetchSanitariosMantenimiento = useCallback(async () => {
    try {
      setLoading(true);
      const currentPage = Number(searchParams.get("page")) || 1;
      const searchTerm = searchParams.get("search") || "";

      // Realizar la petición para obtener los mantenimientos
      const result = await getSanitariosEnMantenimiento(
        currentPage,
        itemsPerPage,
        searchTerm
      );

      // Verificar que la respuesta tenga la estructura esperada
      if (result && typeof result === "object") {
        const typedResult = result as ApiResponse;
        setMantenimientoSanitarios(typedResult.data || []);
        setTotal(typedResult.total || 0);
        setPage(typedResult.page || 1);
      }
    } catch (error) {
      console.error("Error al cargar los mantenimientos:", error);

      // Los errores de autenticación ya son manejados por AuthErrorHandler
      // Solo mostramos el mensaje de error genérico
      toast.error("Error al cargar mantenimientos", {
        description:
          error instanceof Error ? error.message : "Error desconocido",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, itemsPerPage]);
  useEffect(() => {
    fetchSanitariosMantenimiento();
  }, [fetchSanitariosMantenimiento]);
  // Efecto para manejar la apertura del modal de creación a partir del store
  useEffect(() => {
    // Solo ejecutar en el primer renderizado
    if (isFirstLoad) {
      setIsFirstLoad(false);

      // Verificar el estado inicial del store
      const { isCreateModalOpen, selectedToiletId } =
        useMaintenanceToiletStore.getState();

      // Si hay datos en el store, mostrar el formulario de creación
      if (isCreateModalOpen && selectedToiletId) {
        // Resetear el formulario
        reset({
          baño_id: Number(selectedToiletId),
          fecha_mantenimiento: new Date().toISOString().split("T")[0],
          tipo_mantenimiento: "Preventivo",
          descripcion: "",
          empleado_id: 1, // Temporary default - user must select an employee
          costo: undefined,
        });

        // Mostrar el formulario de creación
        setIsCreating(true);

        // Notificar al usuario
        toast.info("Programar mantenimiento", {
          description: `Creando mantenimiento para el sanitario seleccionado`,
          duration: 3000,
        });

        // Importante: Resetear el store después de procesarlo para evitar que
        // se vuelva a abrir el modal al volver a la página
        useMaintenanceToiletStore.getState().reset();
      }
    }
  }, [isFirstLoad, reset]);

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
              Gestión de Mantenimientos
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra los mantenimientos de sanitarios de la empresa
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Mantenimiento
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
                <Toilet className="mr-2 h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="pendiente" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="proceso" className="flex items-center">
                <RefreshCcw className="mr-2 h-4 w-4" />
                En Proceso
              </TabsTrigger>
              <TabsTrigger value="completado" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Completados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-md border">
          <ListadoTabla
            title=""
            data={filteredMantenimientos}
            itemsPerPage={itemsPerPage}
            searchableKeys={[
              "tipo_mantenimiento",
              "empleado_id",
              "descripcion",
              "baño_id",
              "completado",
              "toilet.codigo_interno",
            ]}
            searchValue={searchTerm}
            onSearchClear={handleClearSearch}
            remotePagination
            totalItems={total}
            currentPage={page}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Buscar por tipo, descripción, técnico, ID de baño, código o estado..."
            columns={[
              { title: "Sanitario", key: "codigo_interno" },
              { title: "Fecha", key: "fecha_mantenimiento" },
              { title: "Tipo", key: "tipo_mantenimiento" },
              { title: "Descripción", key: "descripcion" },
              { title: "Técnico", key: "empleado_id" },
              { title: "Estado", key: "estado" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(mantenimientoSanitario) => (
              <>
                <TableCell className="min-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Toilet className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {mantenimientoSanitario.toilet?.codigo_interno ||
                          "No disponible"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {mantenimientoSanitario.toilet?.modelo ||
                          "Modelo no disponible"}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="min-w-[120px]">
                  {mantenimientoSanitario.fecha_mantenimiento &&
                    new Date(
                      mantenimientoSanitario.fecha_mantenimiento
                    ).toLocaleDateString("es-AR")}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      mantenimientoSanitario.tipo_mantenimiento === "Preventivo"
                        ? "default"
                        : "outline"
                    }
                    className={
                      mantenimientoSanitario.tipo_mantenimiento === "Preventivo"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }
                  >
                    {mantenimientoSanitario.tipo_mantenimiento}
                  </Badge>
                </TableCell>

                <TableCell className="max-w-[200px] truncate">
                  {mantenimientoSanitario.descripcion}
                </TableCell>

                <TableCell>{mantenimientoSanitario.empleado_id}</TableCell>

                <TableCell>
                  <Badge
                    variant={
                      mantenimientoSanitario.completado
                        ? "default"
                        : mantenimientoSanitario.fecha_mantenimiento &&
                          new Date(mantenimientoSanitario.fecha_mantenimiento) <
                            new Date()
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      mantenimientoSanitario.completado
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : mantenimientoSanitario.fecha_mantenimiento &&
                          new Date(mantenimientoSanitario.fecha_mantenimiento) <
                            new Date()
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {mantenimientoSanitario.completado
                      ? "Completado"
                      : mantenimientoSanitario.fecha_mantenimiento &&
                        new Date(mantenimientoSanitario.fecha_mantenimiento) <
                          new Date()
                      ? "En proceso"
                      : "Pendiente"}
                  </Badge>
                </TableCell>

                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(mantenimientoSanitario)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      mantenimientoSanitario.mantenimiento_id &&
                      handleDeleteClick(mantenimientoSanitario.mantenimiento_id)
                    }
                    className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>

                  {!mantenimientoSanitario.completado && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (mantenimientoSanitario.mantenimiento_id) {
                          setMantenimientoToComplete(
                            mantenimientoSanitario.mantenimiento_id
                          );
                          setConfirmDialogOpen(true);
                        }
                      }}
                      className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Completar
                    </Button>
                  )}
                </TableCell>
              </>
            )}
          />
        </div>
      </CardContent>
      <FormDialog
        open={isCreating || selectedMantenimientoSanitario !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setSelectedMantenimientoSanitario(null);
          }
        }}
        title={
          selectedMantenimientoSanitario
            ? "Editar Mantenimiento"
            : "Crear Mantenimiento"
        }
        description={
          selectedMantenimientoSanitario
            ? "Modificar información del mantenimiento de sanitario en el sistema."
            : "Completa el formulario para registrar un nuevo mantenimiento."
        }
        onSubmit={handleSubmit((data) => {
          console.log("Form submission attempt with data:", data);
          onSubmit(data);
        })}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4">
          <Controller
            name="baño_id"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label htmlFor="baño_id" className="text-sm font-medium">
                  Sanitario
                </label>
                <SanitarioSelector
                  value={field.value || 0}
                  onChange={(id) => field.onChange(id)}
                  name="baño_id"
                  label=""
                  error={fieldState.error?.message}
                  disabled={false}
                />
              </div>
            )}
          />
          <Controller
            name="fecha_mantenimiento"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de mantenimiento"
                name="fecha_mantenimiento"
                type="date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="tipo_mantenimiento"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Tipo de mantenimiento"
                name="tipo_mantenimiento"
                fieldType="select"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: "Preventivo", value: "Preventivo" },
                  { label: "Correctivo", value: "Correctivo" },
                ]}
                error={fieldState.error?.message}
              />
            )}
          />{" "}
          <Controller
            name="costo"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Costo (Opcional)"
                name="costo"
                type="number"
                value={field.value ? String(field.value) : ""}
                onChange={(value) =>
                  field.onChange(value ? parseFloat(value) : undefined)
                }
                error={fieldState.error?.message}
                placeholder="$0.00"
              />
            )}
          />{" "}
          <Controller
            name="empleado_id"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label htmlFor="empleado_id" className="text-sm font-medium">
                  Técnico Responsable
                </label>{" "}
                <EmpleadoSelector
                  value={field.value === 1 ? 0 : field.value} // Convert temporary default back to 0 for display
                  onChange={(empleadoId) => {
                    console.log(
                      "EmpleadoSelector onChange called with:",
                      empleadoId,
                      typeof empleadoId
                    );
                    field.onChange(empleadoId || 1); // Ensure we always have a valid value
                  }}
                  name="empleado_id"
                  label=""
                  error={fieldState.error?.message}
                  disabled={false}
                />
              </div>
            )}
          />
          <Controller
            name="descripcion"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  {...field}
                  placeholder="Detalle el mantenimiento a realizar"
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </FormDialog>{" "}
      <FormDialog
        open={confirmDialogOpen}
        submitButtonText="Confirmar"
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogOpen(false);
            setMantenimientoToComplete(null);
          }
        }}
        title="Confirmar completado del mantenimiento"
        onSubmit={(e) => {
          e.preventDefault();
          if (mantenimientoToComplete) {
            handleCompleteClick(mantenimientoToComplete);
            setConfirmDialogOpen(false);
            setMantenimientoToComplete(null);
          }
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">¡Atención!</p>
          <p>
            Esta acción marcará el mantenimiento como completado y no será
            reversible. ¿Estás seguro de que deseas continuar?
          </p>
        </div>
      </FormDialog>
      {/* Diálogo de confirmación para eliminación */}
      <FormDialog
        open={confirmDeleteDialogOpen}
        submitButtonText="Eliminar"
        submitButtonVariant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteDialogOpen(false);
            setMantenimientoToDelete(null);
          }
        }}
        title="Confirmar eliminación"
        onSubmit={(e) => {
          e.preventDefault();
          confirmDelete();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">¡Atención!</p>
          <p>
            Esta acción eliminará permanentemente este registro de
            mantenimiento. Esta operación no se puede deshacer.
          </p>
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
      </FormDialog>
    </Card>
  );
};

export default MantenimientoSanitariosComponent;
