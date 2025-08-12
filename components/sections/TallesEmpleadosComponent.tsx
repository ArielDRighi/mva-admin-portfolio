"use client";
import {
  CreateTallesDto,
  UpdateTallesDto,
  createTallesEmpleado,
  deleteTallesEmpleado,
  exportTallesToExcel,
  getTallesEmpleados,
  updateTallesEmpleado,
} from "@/app/actions/clothing";
import { RopaTalles } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Loader from "../ui/local/Loader";
import { ListadoTabla } from "../ui/local/ListadoTabla";
import { TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { FormDialog } from "../ui/local/FormDialog";
import { FormField } from "../ui/local/FormField";
import { Trash2, Edit2, PlusCircle, FileDown, Shirt, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmpleadoSelector } from "../ui/local/SearchSelector/Selectors/EmpleadoSelector";

const TallesEmpleadosComponent = ({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: RopaTalles[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tallesEmpleados, setTallesEmpleados] = useState<RopaTalles[]>(data);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTalles, setSelectedTalles] = useState<RopaTalles | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [talleToDelete, setTalleToDelete] = useState<number | null>(null);

  const tallesSchema = z.object({
    empleadoId: z.number({
      required_error: "El empleado es obligatorio",
      invalid_type_error: "El ID del empleado debe ser un número",
    }),
    calzado_talle: z.string().min(1, "El talle de calzado es obligatorio"),
    pantalon_talle: z.string().min(1, "El talle de pantalón es obligatorio"),
    camisa_talle: z.string().min(1, "El talle de camisa es obligatorio"),
    campera_bigNort_talle: z
      .string()
      .min(1, "El talle de campera BigNort es obligatorio"),
    pielBigNort_talle: z
      .string()
      .min(1, "El talle de piel BigNort es obligatorio"),
    medias_talle: z.string().min(1, "El talle de medias es obligatorio"),
    pantalon_termico_bigNort_talle: z
      .string()
      .min(1, "El talle de pantalón térmico es obligatorio"),
    campera_polar_bigNort_talle: z
      .string()
      .min(1, "El talle de campera polar es obligatorio"),
    mameluco_talle: z.string().min(1, "El talle de mameluco es obligatorio"),
  });

  const form = useForm<z.infer<typeof tallesSchema>>({
    resolver: zodResolver(tallesSchema),
    defaultValues: {
      empleadoId: 0,
      calzado_talle: "",
      pantalon_talle: "",
      camisa_talle: "",
      campera_bigNort_talle: "",
      pielBigNort_talle: "",
      medias_talle: "",
      pantalon_termico_bigNort_talle: "",
      campera_polar_bigNort_talle: "",
      mameluco_talle: "",
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

  const handleEditClick = (talles: RopaTalles) => {
    setSelectedTalles(talles);
    setIsCreating(false);
    setValue("empleadoId", talles.empleado.id);
    setValue("calzado_talle", talles.calzado_talle);
    setValue("pantalon_talle", talles.pantalon_talle);
    setValue("camisa_talle", talles.camisa_talle);
    setValue("campera_bigNort_talle", talles.campera_bigNort_talle);
    setValue("pielBigNort_talle", talles.pielBigNort_talle);
    setValue("medias_talle", talles.medias_talle);
    setValue(
      "pantalon_termico_bigNort_talle",
      talles.pantalon_termico_bigNort_talle
    );
    setValue("campera_polar_bigNort_talle", talles.campera_polar_bigNort_talle);
    setValue("mameluco_talle", talles.mameluco_talle);
  };
  const handleCreateClick = () => {
    reset({
      empleadoId: 0,
      calzado_talle: "",
      pantalon_talle: "",
      camisa_talle: "",
      campera_bigNort_talle: "",
      pielBigNort_talle: "",
      medias_talle: "",
      pantalon_termico_bigNort_talle: "",
      campera_polar_bigNort_talle: "",
      mameluco_talle: "",
    });
    setSelectedTalles(null);
    setIsCreating(true);
  };

  const handleDeleteClick = async (id: number) => {
    setTalleToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!talleToDelete) return;

    try {
      await deleteTallesEmpleado(talleToDelete);
      toast.success("Talles eliminados", {
        description: "Los talles del empleado se han eliminado correctamente.",
      });
      await fetchTallesEmpleados();
    } catch (error) {
      console.error("Error al eliminar los talles:", error);
      toast.error("Error", {
        description: "No se pudieron eliminar los talles del empleado.",
      });
    } finally {
      setConfirmDialogOpen(false);
      setTalleToDelete(null);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      const blob = await exportTallesToExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `talles-empleados-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Exportación completada", {
        description: "Los datos se han exportado correctamente a Excel.",
      });
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error", {
        description: "No se pudieron exportar los datos a Excel.",
      });
    } finally {
      setExporting(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof tallesSchema>) => {
    try {
      const { empleadoId, ...tallesData } = data;

      if (selectedTalles) {
        await updateTallesEmpleado(empleadoId, tallesData as UpdateTallesDto);
        toast.success("Talles actualizados", {
          description: "Los cambios se han guardado correctamente.",
        });
      } else {
        await createTallesEmpleado(empleadoId, tallesData as CreateTallesDto);
        toast.success("Talles registrados", {
          description:
            "Los talles del empleado se han registrado correctamente.",
        });
      }

      await fetchTallesEmpleados();
      setIsCreating(false);
      setSelectedTalles(null);
    } catch (error) {
      console.error("Error en el envío del formulario:", error);
      toast.error("Error", {
        description: selectedTalles
          ? "No se pudieron actualizar los talles."
          : "No se pudieron crear los talles.",
      });
    }
  };
  const fetchTallesEmpleados = useCallback(async () => {
    try {
      const currentPage = Number(searchParams.get("page")) || 1;
      const searchTerm = searchParams.get("search") || "";

      setLoading(true);

      // Now passing the search term to getTallesEmpleados
      const fetchedTalles = await getTallesEmpleados(
        currentPage,
        itemsPerPage,
        searchTerm
      );

      if (fetchedTalles.data && Array.isArray(fetchedTalles.data)) {
        setTallesEmpleados(fetchedTalles.data);
        setTotal(fetchedTalles.total || fetchedTalles.data.length);
        setPage(fetchedTalles.page || 1);
      } else {
        console.error("No se recibieron datos válidos del servidor");
        setTallesEmpleados([]);
        setTotal(0);
        setPage(1);
        toast.error("Error", {
          description: "No se pudieron cargar los talles de empleados",
        });
      }
    } catch (error) {
      console.error("Error al cargar los talles:", error);
      setTallesEmpleados([]);
      setTotal(0);
      setPage(1);
      toast.error("Error", {
        description:
          "Ocurrió un error al cargar los talles. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, itemsPerPage]);
  useEffect(() => {
    console.log("Datos iniciales recibidos:", data);
    fetchTallesEmpleados();
  }, [fetchTallesEmpleados, data]);
  // Estado de depuración para mostrar cuando no hay datos
  useEffect(() => {
    if (tallesEmpleados.length === 0) {
      console.log("No hay talles de empleados para mostrar");
    } else {
      console.log("Talles de empleados cargados:", tallesEmpleados);
    }
  }, [tallesEmpleados]);
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
              Gestión de Talles de Empleados
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra los talles de ropa y calzado de los empleados de la
              empresa
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              disabled={exporting}
              className="cursor-pointer"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
            <Button
              onClick={handleCreateClick}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Registro
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="rounded-md border">
          <ListadoTabla
            title=""
            data={tallesEmpleados}
            itemsPerPage={itemsPerPage}
            searchableKeys={[
              "calzado_talle",
              "pantalon_talle",
              "camisa_talle",
              "campera_bigNort_talle",
              "pielBigNort_talle",
              "medias_talle",
              "pantalon_termico_bigNort_talle",
              "campera_polar_bigNort_talle",
              "mameluco_talle",
            ]}
            remotePagination
            totalItems={total}
            currentPage={page}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            columns={[
              { title: "Empleado", key: "empleado" },
              { title: "Calzado", key: "calzado_talle" },
              { title: "Pantalón", key: "pantalon_talle" },
              { title: "Camisa", key: "camisa_talle" },
              { title: "Campera BigNort", key: "campera_bigNort_talle" },
              { title: "Piel BigNort", key: "pielBigNort_talle" },
              { title: "Medias", key: "medias_talle" },
              {
                title: "Pantalón Térmico",
                key: "pantalon_termico_bigNort_talle",
              },
              { title: "Campera Polar", key: "campera_polar_bigNort_talle" },
              { title: "Mameluco", key: "mameluco_talle" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(talles) => (
              <>
                <TableCell className="min-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {talles.empleado?.nombre || "Sin nombre"}{" "}
                        {talles.empleado?.apellido || ""}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.calzado_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.pantalon_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.camisa_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.campera_bigNort_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.pielBigNort_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.medias_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.pantalon_termico_bigNort_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.campera_polar_bigNort_talle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-slate-500" />
                    {talles.mameluco_talle}
                  </div>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(talles)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>{" "}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      talles.empleado?.id &&
                      handleDeleteClick(talles.empleado.id)
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
        open={isCreating || selectedTalles !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setSelectedTalles(null);
          }
        }}
        title={
          selectedTalles
            ? "Editar Talles de Empleado"
            : "Registrar Talles de Empleado"
        }
        description={
          selectedTalles
            ? "Modificar información de talles del empleado en el sistema."
            : "Completa el formulario para registrar los talles de un empleado."
        }
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4">
          <Controller
            name="empleadoId"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label htmlFor="empleadoId" className="text-sm font-medium">
                  Empleado
                </label>
                <EmpleadoSelector
                  value={field.value || 0}
                  onChange={(id) => field.onChange(id)}
                  name="empleadoId"
                  label=""
                  error={fieldState.error?.message}
                  disabled={selectedTalles !== null}
                />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="calzado_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Calzado"
                  name="calzado_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: 42"
                />
              )}
            />

            <Controller
              name="pantalon_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Pantalón"
                  name="pantalon_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: 44"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="camisa_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Camisa"
                  name="camisa_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: L"
                />
              )}
            />

            <Controller
              name="campera_bigNort_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Campera BigNort"
                  name="campera_bigNort_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: XL"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="pielBigNort_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Piel BigNort"
                  name="pielBigNort_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: M"
                />
              )}
            />

            <Controller
              name="medias_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Medias"
                  name="medias_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: 42"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="pantalon_termico_bigNort_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Pantalón Térmico BigNort"
                  name="pantalon_termico_bigNort_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: 44"
                />
              )}
            />

            <Controller
              name="campera_polar_bigNort_talle"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Talle de Campera Polar BigNort"
                  name="campera_polar_bigNort_talle"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Ej: L"
                />
              )}
            />
          </div>

          <Controller
            name="mameluco_talle"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Talle de Mameluco"
                name="mameluco_talle"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ej: XL"
              />
            )}
          />
        </div>
      </FormDialog>

      <FormDialog
        open={confirmDialogOpen}
        submitButtonText="Confirmar"
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogOpen(false);
            setTalleToDelete(null);
          }
        }}
        title="Confirmar eliminación de talles"
        onSubmit={(e) => {
          e.preventDefault();
          confirmDelete();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">¡Atención!</p>
          <p>
            Esta acción eliminará permanentemente los talles del empleado.
            ¿Estás seguro de que deseas continuar?
          </p>
        </div>
      </FormDialog>
    </Card>
  );
};

export default TallesEmpleadosComponent;
