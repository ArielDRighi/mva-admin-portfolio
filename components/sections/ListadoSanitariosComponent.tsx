"use client";

import {
  createSanitario,
  deleteSanitario,
  editSanitario,
  getSanitarios,
} from "@/app/actions/sanitarios";
import { Sanitario, SanitarioFormulario } from "@/types/types";
import { useMaintenanceToiletStore } from "@/store/maintenanceToiletStore";
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
  Edit2,
  Trash2,
  CheckCircle,
  PauseCircle,
  BadgeInfo,
  Toilet,
  RefreshCcw,
  PlusCircle,
  Info,
  Calendar,
  X,
} from "lucide-react";
import { ToiletServicesDialog } from "./sanitarios/ToiletServicesDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ListadoSanitariosComponent = ({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: Sanitario[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sanitarios, setSanitarios] = useState<Sanitario[]>(data);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSanitario, setSelectedSanitario] = useState<Sanitario | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Nuevos estados para manejo de eliminación con confirmación
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [sanitarioToDelete, setSanitarioToDelete] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("search") || ""
  );

  const createSanitarioSchema = z.object({
    codigo_interno: z.string().min(1, "El código interno es obligatorio"),

    modelo: z.string().min(1, "El modelo es obligatorio"),

    fecha_adquisicion: z
      .string()
      .min(1, "La fecha de adquisición es obligatoria")
      .refine(
        (value) => !isNaN(Date.parse(value)),
        "Formato de fecha inválido"
      ),

    estado: z.enum(
      ["DISPONIBLE", "ASIGNADO", "MANTENIMIENTO", "FUERA_DE_SERVICIO", "BAJA"],
      {
        errorMap: () => ({
          message: "El estado es obligatorio y debe ser válido",
        }),
      }
    ),
  });

  const form = useForm<z.infer<typeof createSanitarioSchema>>({
    resolver: zodResolver(createSanitarioSchema),
    defaultValues: {
      codigo_interno: "",
      modelo: "",
      fecha_adquisicion: "",
      estado: "DISPONIBLE",
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
   */
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

  const handleEditClick = (sanitario: Sanitario) => {
    setSelectedSanitario(sanitario);
    setIsCreating(false);

    const camposFormulario: (keyof SanitarioFormulario)[] = [
      "codigo_interno",
      "modelo",
      "fecha_adquisicion",
      "estado",
    ];

    camposFormulario.forEach((key) => setValue(key, sanitario[key]));
  };

  const handleCreateClick = () => {
    reset({
      codigo_interno: "",
      modelo: "",
      fecha_adquisicion: "",
      estado: "DISPONIBLE",
    });
    setSelectedSanitario(null);
    setIsCreating(true);
  };
  // Esta función ahora solo muestra el diálogo de confirmación
  const handleDeleteClick = (id: string) => {
    setSanitarioToDelete(id);
    setConfirmDeleteDialogOpen(true);
  };

  // Función que realmente elimina después de la confirmación
  const confirmDelete = async () => {
    if (!sanitarioToDelete) return;

    try {
      setLoading(true);
      await deleteSanitario(sanitarioToDelete);

      toast.success("Sanitario eliminado", {
        description: "El sanitario se ha eliminado correctamente.",
        duration: 3000,
      });

      await fetchSanitarios();
    } catch (error) {
      console.error("Error al eliminar el sanitario:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast.error("Error al eliminar sanitario", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setConfirmDeleteDialogOpen(false);
      setSanitarioToDelete(null);
    }
  };
  const onSubmit = async (data: z.infer<typeof createSanitarioSchema>) => {
    // Validación adicional para evitar que se asigne MANTENIMIENTO directamente
    if (data.estado === "MANTENIMIENTO") {
      toast.error("Estado no permitido", {
        description:
          "No se puede asignar manualmente el estado 'MANTENIMIENTO'. Use el botón de Mantenimiento para programar un mantenimiento.",
        duration: 5000,
      });
      return;
    }

    try {
      setLoading(true);

      if (selectedSanitario && selectedSanitario.baño_id) {
        // Actualizar sanitario existente
        const result = await editSanitario(selectedSanitario.baño_id, data);

        // Verificar resultado
        if (result) {
          toast.success("Sanitario actualizado", {
            description: `El sanitario ${data.codigo_interno} se ha actualizado correctamente.`,
            duration: 3000,
          });
        }
      } else {
        // Crear nuevo sanitario
        const result = await createSanitario(data);

        // Verificar resultado
        if (result) {
          toast.success("Sanitario creado", {
            description: `El sanitario ${data.codigo_interno} se ha agregado correctamente.`,
            duration: 3000,
          });
        }
      }

      await fetchSanitarios();
      setIsCreating(false);
      setSelectedSanitario(null);
    } catch (error) {
      console.error("Error en el envío del formulario:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      // Personalizar mensaje según la acción
      toast.error(
        selectedSanitario
          ? "Error al actualizar sanitario"
          : "Error al crear sanitario",
        {
          description: errorMessage,
          duration: 5000,
        }
      );
    } finally {
      setLoading(false);
    }
  }; // La verificación de autenticación ya se maneja en el AuthErrorHandler  // Función para cargar los sanitarios (simplificada)
  const fetchSanitarios = useCallback(async () => {
    try {
      setLoading(true);
      const searchTerm = searchParams.get("search") || "";
      const pageNumber = Number(searchParams.get("page") || currentPage);

      console.log(
        `Buscando sanitarios con término: "${searchTerm}" en página ${pageNumber}, filtro activo: ${activeTab}`
      );

      // Si estamos en un filtro específico, traemos todos los datos de ese estado
      const shouldLoadAll = activeTab !== "todos";
      const result = await getSanitarios(
        shouldLoadAll ? 1 : pageNumber,
        shouldLoadAll ? 999999 : itemsPerPage, // Número grande para traer todos
        searchTerm
      );

      // Utilizamos una aserción de tipo más específica
      type ApiResponse = {
        items?: Sanitario[];
        total?: number;
        page?: number;
      };

      // Verificamos que el resultado sea un objeto con la estructura esperada
      const apiResponse = result as ApiResponse;
      if (apiResponse && Array.isArray(apiResponse.items)) {
        setSanitarios(apiResponse.items);
        setTotal(apiResponse.total || 0);
        setPage(apiResponse.page || 1);
      }
    } catch (error) {
      console.error("Error al obtener sanitarios:", error);

      // Los errores de autenticación ya son manejados por AuthErrorHandler
      // Solo mostramos el mensaje de error genérico
      toast.error("Error al cargar sanitarios", {
        description:
          error instanceof Error ? error.message : "Error desconocido",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage, itemsPerPage, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Siempre resetear a página 1 cuando cambiamos de filtro
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const filteredSanitarios =
    activeTab === "todos"
      ? sanitarios
      : sanitarios.filter((san) => {
          if (activeTab === "disponible") return san.estado === "DISPONIBLE";
          if (activeTab === "asignado") return san.estado === "ASIGNADO";
          if (activeTab === "mantenimiento")
            return san.estado === "MANTENIMIENTO";
          if (activeTab === "fuera_servicio")
            return san.estado === "FUERA_DE_SERVICIO";
          if (activeTab === "baja") return san.estado === "BAJA";
          return true;
        });

  // Determinar si usar paginación remota o local
  const useRemotePagination = activeTab === "todos";
  const effectiveTotalItems = useRemotePagination ? total : filteredSanitarios.length;
  const effectiveCurrentPage = useRemotePagination ? page : Number(searchParams.get("page")) || 1;

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

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    } else {
      fetchSanitarios();
    }
  }, [fetchSanitarios, isFirstLoad, activeTab]);
  // La verificación de autenticación ya se maneja en el AuthErrorHandler

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
              Gestión de Sanitarios
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra la información de los sanitarios de la empresa
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Sanitario
          </Button>
        </div>

        {/* Agregar esta sección de información de estados */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Estados de Sanitarios
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
                    Actualmente instalado en un cliente
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    MANTENIMIENTO
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    En proceso de mantenimiento
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-50 text-red-600 hover:bg-red-50">
                    FUERA DE SERVICIO
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Temporalmente fuera de servicio
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    BAJA
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    Dado de baja definitivamente
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <p>
                  <strong>Importante:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Solo sanitarios <strong>DISPONIBLES</strong> pueden ser
                    asignados a nuevos servicios
                  </li>
                  <li>
                    Sanitarios <strong>ASIGNADOS</strong> solo se usan para
                    servicios de limpieza, retiro o mantenimiento in-situ
                  </li>
                  <li>
                    El estado <strong>MANTENIMIENTO</strong> se asigna
                    automáticamente al programar un mantenimiento
                  </li>
                  <li>
                    Después de un servicio de retiro, los sanitarios pasan
                    automáticamente a <strong>MANTENIMIENTO</strong>
                  </li>
                </ul>
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
            <TabsList className="flex flex-wrap gap-1 w-full">
              <TabsTrigger value="todos" className="flex items-center">
                <Toilet className="mr-2 h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="disponible" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Disponibles
              </TabsTrigger>
              <TabsTrigger value="asignado" className="flex items-center">
                <BadgeInfo className="mr-2 h-4 w-4" />
                Asignados
              </TabsTrigger>
              <TabsTrigger value="mantenimiento" className="flex items-center">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Mantenimiento
              </TabsTrigger>
              <TabsTrigger value="fuera_servicio" className="flex items-center">
                <PauseCircle className="mr-2 h-4 w-4" />
                Fuera de Servicio
              </TabsTrigger>
              <TabsTrigger value="baja" className="flex items-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Baja
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-md border">
          <ListadoTabla
            title=""
            data={filteredSanitarios}
            itemsPerPage={itemsPerPage}
            searchableKeys={["codigo_interno", "modelo", "estado"]}
            searchValue={searchTerm}
            onSearchClear={handleClearSearch}
            remotePagination={useRemotePagination}
            totalItems={effectiveTotalItems}
            currentPage={effectiveCurrentPage}
            onPageChange={handlePageChangeUnified}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Buscar por modelo, código interno o estado... (presiona Enter)"
            columns={[
              { title: "Código interno", key: "codigo_interno" },
              { title: "Modelo", key: "modelo" },
              { title: "Fecha adquisición", key: "fecha_adquisicion" },
              { title: "Estado", key: "estado" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(sanitario) => (
              <>
                <TableCell className="font-medium">
                  {sanitario.codigo_interno}
                </TableCell>
                <TableCell>{sanitario.modelo}</TableCell>
                <TableCell>
                  {sanitario.fecha_adquisicion &&
                    new Date(sanitario.fecha_adquisicion).toLocaleDateString(
                      "es-AR"
                    )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sanitario.estado === "DISPONIBLE"
                        ? "default"
                        : sanitario.estado === "BAJA"
                        ? "destructive"
                        : "outline"
                    }
                    className={
                      sanitario.estado === "DISPONIBLE"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : sanitario.estado === "BAJA"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : sanitario.estado === "MANTENIMIENTO"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        : sanitario.estado === "FUERA_DE_SERVICIO"
                        ? "bg-red-50 text-red-600 hover:bg-red-50"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    }
                  >
                    {sanitario.estado.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(sanitario)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>{" "}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      sanitario.baño_id && handleDeleteClick(sanitario.baño_id)
                    }
                    className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>{" "}
                  <div className="ml-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (sanitario.baño_id) {
                          // Resetear el store primero para evitar estados residuales
                          useMaintenanceToiletStore.getState().reset(); // Establecer el sanitario y abrir el modal
                          useMaintenanceToiletStore
                            .getState()
                            .openCreateModal(sanitario.baño_id);

                          // Navegar a la página de mantenimiento
                          router.push(
                            `/admin/dashboard/sanitarios/mantenimiento`
                          );
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                      Mantenimiento
                    </Button>
                  </div>
                  {/* Botón para ver servicios asignados */}
                  {sanitario.baño_id && (
                    <ToiletServicesDialog
                      toiletId={sanitario.baño_id}
                      toiletName={`${sanitario.codigo_interno} - ${sanitario.modelo}`}
                    >
                      <Button variant="outline" size="sm">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Servicios
                      </Button>
                    </ToiletServicesDialog>
                  )}
                </TableCell>
              </>
            )}
          />
        </div>{" "}
      </CardContent>
      {/* Diálogo de confirmación para eliminación */}
      <FormDialog
        open={confirmDeleteDialogOpen}
        submitButtonText="Eliminar"
        submitButtonVariant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteDialogOpen(false);
            setSanitarioToDelete(null);
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
            Esta acción eliminará permanentemente este sanitario. Esta operación
            no se puede deshacer.
          </p>
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
      </FormDialog>
      <FormDialog
        open={isCreating || selectedSanitario !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setSelectedSanitario(null);
          }
        }}
        title={selectedSanitario ? "Editar Sanitario" : "Crear Sanitario"}
        description={
          selectedSanitario
            ? "Modificar información del sanitario en el sistema."
            : "Completa el formulario para registrar un nuevo sanitario."
        }
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Controller
            name="codigo_interno"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Código interno"
                name="codigo_interno"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ingrese el código interno"
              />
            )}
          />
          <Controller
            name="modelo"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Modelo"
                name="modelo"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ingrese el modelo"
              />
            )}
          />
          <Controller
            name="fecha_adquisicion"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de adquisición"
                name="fecha_adquisicion"
                type="date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />{" "}
          <Controller
            name="estado"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Estado"
                name="estado"
                fieldType="select"
                value={field.value || ""}
                onChange={(selectedValue: string) => {
                  // Verificar si el usuario está intentando asignar directamente el estado MANTENIMIENTO
                  if (selectedValue === "MANTENIMIENTO") {
                    toast.error("Estado no permitido", {
                      description:
                        "No se puede asignar manualmente el estado 'MANTENIMIENTO'. Use el botón de Mantenimiento para programar un mantenimiento.",
                    });
                    // No actualizar el estado
                    return;
                  }
                  field.onChange(selectedValue);
                }}
                options={[
                  { label: "Disponible", value: "DISPONIBLE" },
                  { label: "Asignado", value: "ASIGNADO" },
                  // Eliminamos la opción de mantenimiento de la lista
                  { label: "Fuera de servicio", value: "FUERA_DE_SERVICIO" },
                  { label: "Baja", value: "BAJA" },
                ]}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>{" "}
      </FormDialog>
    </Card>
  );
};

export default ListadoSanitariosComponent;
