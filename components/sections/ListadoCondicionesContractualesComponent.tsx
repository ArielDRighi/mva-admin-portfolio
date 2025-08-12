"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ListadoTabla } from "@/components/ui/local/ListadoTabla";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormDialog } from "../ui/local/FormDialog";
import { FormField } from "../ui/local/FormField";
import Loader from "../ui/local/Loader";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  FileCheck,
  Info,
  User,
} from "lucide-react";
import {
  deleteContractualCondition,
  getAllContractualConditions,
} from "@/app/actions/contractualConditions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Definir el tipo para la condición contractual
type CondicionContractual = {
  condicionContractualId: number;
  condiciones_especificas: string;
  estado: string;
  fecha_fin: string;
  fecha_inicio: string;
  periodicidad: string;
  tarifa: string;
  // Campos adicionales
  clientId?: number;
  tarifa_alquiler?: number;
  tarifa_instalacion?: number;
  tarifa_limpieza?: number;
  tipo_servicio?: string;
  cantidad_banos?: number;
  cliente?: {
    nombre?: string;
    telefono?: string;
    email?: string;
  };
};

export default function ListadoCondicionesContractualesComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isSupervisor } = useCurrentUser();

  // Estado para manejar los datos
  const [condiciones, setCondiciones] = useState<CondicionContractual[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCondicion, setSelectedCondicion] =
    useState<CondicionContractual | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // Esquema de validación para las condiciones contractuales
  const condicionContractualSchema = z.object({
    condiciones_especificas: z
      .string()
      .min(1, "Las condiciones específicas son obligatorias"),
    estado: z.string().min(1, "El estado es obligatorio"),
    fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria"),
    fecha_fin: z.string().min(1, "La fecha de fin es obligatoria"),
    periodicidad: z.string().min(1, "La periodicidad es obligatoria"),
    tarifa: z.string().min(1, "La tarifa es obligatoria"),
  });
  const form = useForm<z.infer<typeof condicionContractualSchema>>({
    resolver: zodResolver(condicionContractualSchema),
    defaultValues: {
      condiciones_especificas: "",
      estado: "Activo",
      fecha_inicio: "",
      fecha_fin: "",
      periodicidad: "Mensual",
      tarifa: "",
    },
  });

  const { handleSubmit, setValue, control } = form;

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
    setPage(page);
  };

  // Función para manejar búsqueda
  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };
  // Función para manejar edición
  const handleEditClick = (condicion: CondicionContractual) => {
    setSelectedCondicion(condicion);
    setValue("condiciones_especificas", condicion.condiciones_especificas);
    setValue("estado", condicion.estado);
    setValue("fecha_inicio", condicion.fecha_inicio);
    setValue("fecha_fin", condicion.fecha_fin);
    setValue("periodicidad", condicion.periodicidad);
    setValue("tarifa", condicion.tarifa);
    setIsCreating(false);
  };
  // Función para manejar creación
  // const handleCreateClick = () => {
  //   reset({
  //     condiciones_especificas: "",
  //     estado: "Activo",
  //     fecha_inicio: "",
  //     fecha_fin: "",
  //     periodicidad: "Mensual",
  //     tarifa: "",
  //   });
  //   setSelectedCondicion(null);
  //   setIsCreating(true);
  // };
  // Función para manejar eliminación
  const handleDeleteClick = async (id: number) => {
    try {
      setLoading(true);
      const response = await deleteContractualCondition(id);

      // Verificamos el tipo de respuesta
      if (response && typeof response === "object") {
        // Si la respuesta tiene un mensaje específico, lo usamos
        const message =
          "message" in response ? (response.message as string) : "";

        // Actualizamos el estado local tras la eliminación exitosa
        setCondiciones(
          condiciones.filter((c) => c.condicionContractualId !== id)
        );

        toast.success("Condición contractual eliminada", {
          description:
            message ||
            "La condición contractual se ha eliminado correctamente.",
        });
      } else {
        // Si no hay respuesta específica pero la operación fue exitosa
        setCondiciones(
          condiciones.filter((c) => c.condicionContractualId !== id)
        );

        toast.success("Condición contractual eliminada", {
          description:
            "La condición contractual se ha eliminado correctamente.",
        });
      }
    } catch (error) {
      console.error("Error al eliminar la condición contractual:", error);

      // Extraemos el mensaje de error si está disponible
      let errorMessage = "No se pudo eliminar la condición contractual.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = error.message as string;
      }

      toast.error("Error al eliminar", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambio de tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Función para manejar la visualización de detalles
  const handleViewDetails = (condicion: CondicionContractual) => {
    setSelectedCondicion(condicion);
    setIsViewModalOpen(true);
  };

  // Función para manejar el envío del formulario
  const onSubmit = async (data: z.infer<typeof condicionContractualSchema>) => {
    try {
      if (isCreating) {
        // Simulamos creación de una nueva condición
        const newId =
          condiciones.length > 0
            ? Math.max(...condiciones.map((c) => c.condicionContractualId)) + 1
            : 1;

        const newCondicion: CondicionContractual = {
          condicionContractualId: newId,
          ...data,
        };

        setCondiciones([...condiciones, newCondicion]);
        toast.success("Condición contractual creada", {
          description: "La condición contractual se ha creado correctamente.",
        });
      } else if (selectedCondicion) {
        // Simulamos actualización de condición existente
        const updatedCondiciones = condiciones.map((c) =>
          c.condicionContractualId === selectedCondicion.condicionContractualId
            ? { ...c, ...data }
            : c
        );

        setCondiciones(updatedCondiciones);
        toast.success("Condición contractual actualizada", {
          description:
            "La condición contractual se ha actualizado correctamente.",
        });
      }

      setIsCreating(false);
      setSelectedCondicion(null);
    } catch (error) {
      console.error("Error en el envío del formulario:", error);
      toast.error("Error", {
        description: selectedCondicion
          ? "No se pudo actualizar la condición contractual."
          : "No se pudo crear la condición contractual.",
      });
    }
  };

  // Primer render: cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getAllContractualConditions(
          page,
          itemsPerPage,
          ""
        );
        let items: any[] = [];
        let total = 0;
        let pageNum = 1;
        let limitNum = 15;
        if (result && typeof result === "object") {
          if ("items" in result) {
            items = Array.isArray((result as any).items)
              ? (result as any).items
              : [];
            total = (result as any).total || 0;
            pageNum = (result as any).page || 1;
            limitNum = (result as any).limit || 15;
          } else if ("data" in result) {
            items = Array.isArray((result as any).data)
              ? (result as any).data
              : [];
            total = (result as any).totalItems || 0;
            pageNum = (result as any).page || 1;
            limitNum = (result as any).limit || 15;
          }
        }
        setCondiciones(items);
        setTotal(total);
        setPage(pageNum);
        setItemsPerPage(limitNum);
      } catch (err) {
        setCondiciones([]);
        setTotal(0);
        toast.error("Error al cargar condiciones contractuales");
      } finally {
        setLoading(false);
        setIsFirstLoad(false);
      }
    };
    if (isFirstLoad) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstLoad]);

  // Efecto para recargar datos cuando cambian los searchParams (búsqueda o paginación)
  useEffect(() => {
    if (isFirstLoad) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const search = params.get("search") || "";
        const pageParam = params.get("page") || "1";
        // Llama a la función getAllContractualConditions con page, limit, search
        const result = await getAllContractualConditions(
          Number(pageParam),
          itemsPerPage,
          search
        );
        // Unificar manejo de respuesta para 'items' o 'data'
        let items: any[] = [];
        let total = 0;
        let pageNum = Number(pageParam);
        let limitNum = itemsPerPage;
        if (result && typeof result === "object") {
          if ("items" in result) {
            items = Array.isArray((result as any).items)
              ? (result as any).items
              : [];
            total = (result as any).total || 0;
            pageNum = (result as any).page || Number(pageParam);
            limitNum = (result as any).limit || itemsPerPage;
          } else if ("data" in result) {
            items = Array.isArray((result as any).data)
              ? (result as any).data
              : [];
            total = (result as any).totalItems || 0;
            pageNum = (result as any).page || Number(pageParam);
            limitNum = (result as any).limit || itemsPerPage;
          }
        }
        setCondiciones(items);
        setTotal(total);
        setPage(pageNum);
        setItemsPerPage(limitNum);
      } catch (err) {
        setCondiciones([]);
        setTotal(0);
        toast.error("Error al buscar condiciones contractuales");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Filtrar según el tab seleccionado
  const filteredCondiciones =
    activeTab === "todos"
      ? condiciones
      : condiciones.filter((condicion) => condicion.estado === activeTab);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  // Función para determinar la variante del badge según el estado
  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<
      string,
      "default" | "outline" | "secondary" | "destructive"
    > = {
      Activo: "default",
      Inactivo: "outline",
      Finalizado: "secondary",
      Cancelado: "destructive",
    };
    return variants[status] || "outline";
  };

  // Función para determinar la clase CSS del badge según el estado
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Activo":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Inactivo":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "Finalizado":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "Cancelado":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Formatear la fecha para mostrarla en formato local
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Gestión de Condiciones Contractuales
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra las condiciones contractuales de la empresa
            </CardDescription>{" "}
          </div>
          {isAdmin && (
            <Button
              onClick={() =>
                router.push("/admin/dashboard/condiciones-contractuales/crear")
              }
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Condición Contractual
            </Button>
          )}
        </div>

        <div className="mt-4">
          <Tabs
            defaultValue="todos"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid grid-cols-4 w-[500px]">
              <TabsTrigger value="todos" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="Activo" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Activos
              </TabsTrigger>
              <TabsTrigger value="Inactivo" className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                Inactivos
              </TabsTrigger>
              <TabsTrigger value="Finalizado" className="flex items-center">
                <FileCheck className="mr-2 h-4 w-4" />
                Finalizados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="rounded-md border">
          {" "}
          <ListadoTabla
            title=""
            data={filteredCondiciones}
            itemsPerPage={itemsPerPage}
            searchableKeys={[
              "condiciones_especificas",
              "periodicidad",
              "cliente.nombre",
            ]}
            remotePagination
            totalItems={total}
            currentPage={page}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            columns={[
              { title: "Cliente", key: "cliente" },
              { title: "Detalles", key: "detalles" },
              { title: "Información del Contrato", key: "informacion" },
              { title: "Financieros", key: "financieros" },
              { title: "Estado", key: "estado" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(condicion) => (
              <>
                <TableCell className="min-w-[180px]">
                  <div
                    className="space-y-1 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                    onClick={() => handleViewDetails(condicion)}
                  >
                    <div className="flex items-center text-sm font-medium">
                      <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{condicion.cliente?.nombre || "Sin cliente"}</span>
                    </div>
                    {condicion.cliente?.email && (
                      <div className="text-xs text-muted-foreground">
                        {condicion.cliente.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="min-w-[250px]">
                  <div
                    className="space-y-1 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                    onClick={() => handleViewDetails(condicion)}
                  >
                    <div className="font-medium">
                      {condicion.tipo_servicio} #
                      {condicion.condicionContractualId}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {condicion.condiciones_especificas}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <div
                    className="space-y-1 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                    onClick={() => handleViewDetails(condicion)}
                  >
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>
                        {formatDate(condicion.fecha_inicio)} -{" "}
                        {formatDate(condicion.fecha_fin)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div
                    className="space-y-1 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                    onClick={() => handleViewDetails(condicion)}
                  >
                    <div className="flex items-center text-sm">
                      <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{condicion.periodicidad}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <span>${condicion.tarifa}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(condicion.estado)}
                    className={getStatusBadgeClass(condicion.estado)}
                  >
                    {condicion.estado}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(condicion)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Ver detalles
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(condicion)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      condicion.condicionContractualId &&
                      handleDeleteClick(condicion.condicionContractualId)
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

      <FormDialog
        open={selectedCondicion !== null || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCondicion(null);
            setIsCreating(false);
          }
        }}
        title={
          isCreating
            ? "Crear Condición Contractual"
            : "Editar Condición Contractual"
        }
        description={
          isCreating
            ? "Completa el formulario para crear una nueva condición contractual."
            : "Modifica los datos de la condición contractual."
        }
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="md:col-span-2">
            <Controller
              name="condiciones_especificas"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Condiciones Específicas"
                  name="condiciones_especificas"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  type="textarea"
                />
              )}
            />
          </div>
          <Controller
            name="fecha_inicio"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de Inicio"
                name="fecha_inicio"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                type="date"
              />
            )}
          />
          <Controller
            name="fecha_fin"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Fecha de Fin"
                name="fecha_fin"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                type="date"
              />
            )}
          />{" "}
          <Controller
            name="periodicidad"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Periodicidad"
                name="periodicidad"
                fieldType="select"
                value={field.value}
                onChange={(value: string) => field.onChange(value)}
                options={[
                  { label: "Diaria", value: "Diaria" },
                  { label: "Semanal", value: "Semanal" },
                  { label: "Quincenal", value: "Quincenal" },
                  { label: "Mensual", value: "Mensual" },
                  { label: "Trimestral", value: "Trimestral" },
                  { label: "Semestral", value: "Semestral" },
                  { label: "Anual", value: "Anual" },
                ]}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="tarifa"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Tarifa"
                name="tarifa"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                type="number"
                prefix="$"
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
                value={field.value}
                onChange={(value: string) => field.onChange(value)}
                options={[
                  { label: "Activo", value: "Activo" },
                  { label: "Inactivo", value: "Inactivo" },
                  { label: "Finalizado", value: "Finalizado" },
                  { label: "Cancelado", value: "Cancelado" },
                ]}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </FormDialog>

      {/* Modal para ver detalles de la condición contractual */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Detalles de Condición Contractual
            </DialogTitle>
            <DialogDescription>
              Información completa de la condición contractual
            </DialogDescription>
          </DialogHeader>

          {selectedCondicion && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Contrato #{selectedCondicion.condicionContractualId}
                  </h3>
                  {selectedCondicion.cliente && (
                    <p className="text-sm text-muted-foreground">
                      Cliente: {selectedCondicion.cliente.nombre}
                    </p>
                  )}
                </div>
                <Badge
                  variant={getStatusBadgeVariant(selectedCondicion.estado)}
                  className={getStatusBadgeClass(selectedCondicion.estado)}
                >
                  {selectedCondicion.estado}
                </Badge>
              </div>

              {/* Sección: Información General */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-md mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                  Información General
                </h4>{" "}
                <div className="grid grid-cols-2 gap-4">
                  {selectedCondicion.tipo_servicio && (
                    <div>
                      <h5 className="text-xs uppercase font-medium text-muted-foreground">
                        Tipo de Servicio
                      </h5>
                      <p className="text-sm font-medium mt-1">
                        {selectedCondicion.tipo_servicio}
                      </p>
                    </div>
                  )}

                  <div>
                    <h5 className="text-xs uppercase font-medium text-muted-foreground">
                      Fecha de Inicio
                    </h5>
                    <p className="text-sm font-medium mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(selectedCondicion.fecha_inicio)}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs uppercase font-medium text-muted-foreground">
                      Fecha de Fin
                    </h5>
                    <p className="text-sm font-medium mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDate(selectedCondicion.fecha_fin)}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs uppercase font-medium text-muted-foreground">
                      Periodicidad
                    </h5>
                    <p className="text-sm font-medium mt-1 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedCondicion.periodicidad}
                    </p>
                  </div>

                  {selectedCondicion.cantidad_banos !== undefined && (
                    <div>
                      <h5 className="text-xs uppercase font-medium text-muted-foreground">
                        Cantidad de Baños
                      </h5>
                      <p className="text-sm font-medium mt-1">
                        {selectedCondicion.cantidad_banos}
                      </p>
                    </div>
                  )}
                </div>{" "}
              </div>

              {/* Sección: Información Financiera - Solo para administradores */}
              {isAdmin && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-md mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-indigo-600" />
                    Información Financiera
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs uppercase font-medium text-muted-foreground">
                        Tarifa Total
                      </h5>
                      <p className="text-sm font-medium mt-1 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        ${selectedCondicion.tarifa}
                      </p>
                    </div>

                    {selectedCondicion.tarifa_alquiler !== undefined && (
                      <div>
                        <h5 className="text-xs uppercase font-medium text-muted-foreground">
                          Tarifa de Alquiler
                        </h5>
                        <p className="text-sm font-medium mt-1 flex items-center">
                          ${selectedCondicion.tarifa_alquiler}
                        </p>
                      </div>
                    )}

                    {selectedCondicion.tarifa_instalacion !== undefined && (
                      <div>
                        <h5 className="text-xs uppercase font-medium text-muted-foreground">
                          Tarifa de Instalación
                        </h5>
                        <p className="text-sm font-medium mt-1 flex items-center">
                          ${selectedCondicion.tarifa_instalacion}
                        </p>
                      </div>
                    )}

                    {selectedCondicion.tarifa_limpieza !== undefined && (
                      <div>
                        <h5 className="text-xs uppercase font-medium text-muted-foreground">
                          Tarifa de Limpieza
                        </h5>
                        <p className="text-sm font-medium mt-1 flex items-center">
                          ${selectedCondicion.tarifa_limpieza}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección: Datos del Cliente */}
              {selectedCondicion.cliente && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-md mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-indigo-600" />
                    Datos del Cliente
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h5 className="text-xs uppercase font-medium text-muted-foreground">
                        Nombre
                      </h5>
                      <p className="text-sm font-medium mt-1">
                        {selectedCondicion.cliente.nombre}
                      </p>
                    </div>

                    {selectedCondicion.cliente.telefono && (
                      <div>
                        <h5 className="text-xs uppercase font-medium text-muted-foreground">
                          Teléfono
                        </h5>
                        <p className="text-sm font-medium mt-1">
                          {selectedCondicion.cliente.telefono}
                        </p>
                      </div>
                    )}

                    {selectedCondicion.cliente.email && (
                      <div>
                        <h5 className="text-xs uppercase font-medium text-muted-foreground">
                          Email
                        </h5>
                        <p className="text-sm font-medium mt-1">
                          {selectedCondicion.cliente.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección: Condiciones Específicas */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-md mb-3 flex items-center">
                  <FileCheck className="h-4 w-4 mr-2 text-indigo-600" />
                  Condiciones Específicas
                </h4>
                <div className="bg-slate-50 rounded-md border p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedCondicion.condiciones_especificas}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex justify-between mt-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditClick(selectedCondicion);
                    }}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      if (selectedCondicion.condicionContractualId) {
                        handleDeleteClick(
                          selectedCondicion.condicionContractualId
                        );
                      }
                    }}
                    className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
