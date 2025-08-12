"use client";

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
import { createContractualCondition } from "@/app/actions/contractualConditions";
import Loader from "@/components/ui/local/Loader";
import { Cliente } from "@/types/types";
import { getClients } from "@/app/actions/clientes";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  Calendar,
  // Clock, // No se está utilizando
  DollarSign,
  Tag,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define el esquema de validación para cada paso
const clienteSchema = z.object({
  clientId: z.number().min(1, "Debe seleccionar un cliente"),
});

/* Este esquema se ha comentado por no estar en uso actualmente
const condicionesSchema = z
  .object({
    fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria"),
    fecha_fin: z.string().optional(),
    tipo_servicio: z
      .enum(["INSTALACION", "LIMPIEZA", "MANTENIMIENTO", "ALQUILER", "RETIRO"], {
        required_error: "El tipo de servicio es obligatorio",
      })
      .optional(),
    cantidad_banos: z
      .number()
      .min(0, "La cantidad de baños no puede ser negativa")
      .optional(),
  });
*/

const detallesSchema = z.object({
  condiciones_especificas: z.string().optional(),
  tarifa: z.number().min(0, "La tarifa no puede ser negativa"),
  tarifa_alquiler: z
    .number()
    .min(0, "La tarifa de alquiler no puede ser negativa")
    .optional(),
  tarifa_instalacion: z
    .number()
    .min(0, "La tarifa de instalación no puede ser negativa")
    .optional(),
  tarifa_limpieza: z
    .number()
    .min(0, "La tarifa de limpieza no puede ser negativa")
    .optional(),
  periodicidad: z
    .enum(
      [
        "Diaria",
        "Dos veces por semana",
        "Tres veces por semana",
        "Cuatro veces por semana",
        "Semanal",
        "Quincenal",
        "Mensual",
        "Anual",
      ],
      {
        required_error: "La periodicidad es obligatoria",
      }
    )
    .optional(),
  estado: z.string().min(1, "El estado es obligatorio"),
});

// Combina todos los esquemas para la validación final
const baseCondicionesSchema = z.object({
  fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria"),
  fecha_fin: z.string().optional(),
  tipo_servicio: z
    .enum(["INSTALACION", "LIMPIEZA", "MANTENIMIENTO", "ALQUILER", "RETIRO"], {
      required_error: "El tipo de servicio es obligatorio",
    })
    .optional(),
  cantidad_banos: z
    .number()
    .min(0, "La cantidad de baños no puede ser negativa")
    .optional(),
});

const formSchema = clienteSchema
  .merge(baseCondicionesSchema)
  .merge(detallesSchema);

type FormDataSchema = z.infer<typeof formSchema>;

export default function CrearCondicionContractualComponent() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setIsLoading(true);

        // Definimos una interfaz para la respuesta esperada
        interface ClientesResponse {
          items?: Cliente[];
          data?: Cliente[];
          total?: number;
          page?: number;
        }

        const clientesData = (await getClients()) as ClientesResponse;

        if (clientesData && typeof clientesData === "object") {
          // Si tiene la propiedad items, usarla
          if ("items" in clientesData && Array.isArray(clientesData.items)) {
            setClientes(clientesData.items);
            setFilteredClientes(clientesData.items);
          }
          // Si tiene la propiedad data, usarla como alternativa
          else if ("data" in clientesData && Array.isArray(clientesData.data)) {
            setClientes(clientesData.data);
            setFilteredClientes(clientesData.data);
          }
          // Si es directamente un array
          else if (Array.isArray(clientesData)) {
            setClientes(clientesData);
            setFilteredClientes(clientesData);
          }
          // Si no coincide con ninguno de los formatos esperados
          else {
            console.error("Formato de respuesta no reconocido:", clientesData);
            setClientes([]);
            setFilteredClientes([]);
          }
        } else {
          console.error(
            "La respuesta de getClients no es un objeto:",
            clientesData
          );
          setClientes([]);
          setFilteredClientes([]);
        }
      } catch (error) {
        console.error("Error al cargar los clientes:", error);
        toast.error("Error al cargar los clientes", {
          description:
            "No se pudieron cargar los clientes. Por favor, intente nuevamente.",
        });
        setClientes([]);
        setFilteredClientes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Buscar clientes en la API al presionar Enter
  useEffect(() => {
    setFilteredClientes(clientes);
  }, [clientes]);

  const handleClienteSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      const term = searchTerm.trim();
      setIsLoading(true);
      try {
        const clientesData = await getClients(1, 100, term);
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
  // Inicializar el formulario
  const form = useForm<FormDataSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: 0,
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString()
        .split("T")[0],
      condiciones_especificas: "",
      tarifa: 2500,
      tarifa_alquiler: 0,
      tarifa_instalacion: 0,
      tarifa_limpieza: 0,
      periodicidad: "Mensual",
      estado: "Activo",
      tipo_servicio: "INSTALACION",
      cantidad_banos: 1,
    },
  });
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: {
      /* errors */
    }, // No se está utilizando errors
  } = form;

  // Maneja el avance al siguiente paso
  const handleNext = async () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = await trigger(["clientId"]);
        break;
      case 2:
        isValid = await trigger(["fecha_inicio", "fecha_fin"]);
        break;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  // Maneja el retroceso al paso anterior
  const handleBack = () => {
    setStep(step - 1);
  };
  const onSubmit = async (data: FormDataSchema) => {
    setIsSubmitting(true);
    try {
      // Aquí garantizamos que los datos son del tipo correcto antes de enviar
      const conditionData = {
        clientId: data.clientId,
        fecha_inicio: data.fecha_inicio,
        // Aseguramos que fecha_fin siempre sea string (requerido por CreateContractualCondition)
        fecha_fin: data.fecha_fin || data.fecha_inicio, // Fallback a fecha_inicio si no hay fecha_fin
        tipo_servicio: data.tipo_servicio || "INSTALACION", // Valor por defecto
        cantidad_banos: data.cantidad_banos || 0,
        condiciones_especificas: data.condiciones_especificas || "",
        tarifa: data.tarifa,
        tarifa_alquiler: data.tarifa_alquiler || 0,
        tarifa_instalacion: data.tarifa_instalacion || 0,
        tarifa_limpieza: data.tarifa_limpieza || 0,
        // Solo incluir periodicidad si es tipo INSTALACION, sino usar valor por defecto
        periodicidad:
          data.tipo_servicio === "INSTALACION"
            ? data.periodicidad || "Mensual"
            : "Mensual",
        estado: data.estado,
      };

      // Enviamos los datos ya procesados y tipados correctamente
      await createContractualCondition(conditionData);

      toast.success("¡Contrato creado correctamente!", {
        description: "La condición contractual ha sido registrada con éxito.",
      });
      setTimeout(() => {
        router.push("/admin/dashboard/condiciones-contractuales/listado");
      }, 2000);
    } catch (error) {
      console.error("Error al crear la condición contractual:", error);
      toast.error("Error al crear la condición contractual", {
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Crear Condición Contractual
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {step === 1 && "Selecciona el cliente para el nuevo contrato"}
              {step === 2 && "Define el tipo y período del contrato"}
              {step === 3 && "Establece los detalles financieros y condiciones"}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 text-base px-3 py-1"
          >
            Paso {step} de 3
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Indicador de progreso */}
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
              <Calendar className="h-4 w-4" /> Período
            </span>
            <span
              className={`font-medium flex items-center gap-1 ${
                step >= 3 ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <DollarSign className="h-4 w-4" /> Detalles
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>
        {/* Paso 1: Selección de cliente */}
        {step === 1 && (
          <div className="space-y-6">
            <Controller
              name="clientId"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cliente
                  </label>
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Buscar clientes por nombre, CUIT o email..."
                      className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.trim() === "") {
                          // Si se borra el input, recargar todos los clientes
                          (async () => {
                            setIsLoading(true);
                            try {
                              const clientesData = await getClients(1, 100, "");
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
                    <div className="flex justify-center items-center py-8 border rounded-md bg-slate-50">
                      <Loader className="text-indigo-600" />
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto border rounded-md border-slate-200">
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
                                <Tag className="h-3.5 w-3.5 text-slate-400" />{" "}
                                {cliente.cuit}
                              </span>
                              <span className="flex items-center gap-1">
                                <Search className="h-3.5 w-3.5 text-slate-400" />{" "}
                                {cliente.email}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : searchTerm.length > 0 ? (
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

                  {fieldState.error?.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}{" "}
        {/* Paso 2: Tipo y período del contrato */}
        {step === 2 && (
          <div className="space-y-6">
            <Controller
              name="tipo_servicio"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Tipo de Servicio"
                  name="tipo_servicio"
                  fieldType="select"
                  value={field.value as string}
                  onChange={(value: string) => field.onChange(value)}
                  options={[
                    { label: "Instalación", value: "INSTALACION" },
                    { label: "Limpieza", value: "LIMPIEZA" },
                    { label: "Mantenimiento", value: "MANTENIMIENTO" },
                    { label: "Alquiler", value: "ALQUILER" },
                    { label: "Retiro", value: "RETIRO" },
                  ]}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="cantidad_banos"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Cantidad de Baños"
                  name="cantidad_banos"
                  value={field.value?.toString() || "1"}
                  onChange={(value) => field.onChange(parseInt(value))}
                  error={fieldState.error?.message}
                  type="number"
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="fecha_inicio"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Fecha de Inicio"
                    name="fecha_inicio"
                    value={field.value?.toString()}
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
                    value={field.value?.toString()}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    type="date"
                  />
                )}
              />
            </div>
          </div>
        )}
        {/* Paso 3: Detalles financieros y condiciones */}
        {step === 3 && (
          <div className="space-y-6">
            <Controller
              name="condiciones_especificas"
              control={control}
              render={({ field, fieldState }) => (
                <FormField
                  label="Condiciones Específicas"
                  name="condiciones_especificas"
                  value={field.value?.toString() || undefined}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  type="textarea"
                  placeholder="Detalla aquí cualquier acuerdo especial (descuentos, servicios adicionales, requisitos particulares, etc.)"
                />
              )}
            />

            <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">
              Tarifas
            </h3>
            <div className="text-sm text-slate-600 mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="font-medium mb-2">
                ℹ️ Información sobre las tarifas:
              </p>
              <ul className="space-y-1 text-xs">
                <li>
                  <strong>Tarifa Principal:</strong> Costo base del alquiler
                  según la periodicidad establecida (mensual, semanal, etc.)
                </li>
                <li>
                  <strong>Tarifa de Alquiler:</strong> Costo adicional
                  específico para el período de alquiler del equipo
                </li>
                <li>
                  <strong>Tarifa de Instalación:</strong> Costo único por el
                  servicio de instalación de los baños químicos
                </li>
                <li>
                  <strong>Tarifa de Limpieza:</strong> Costo por cada servicio
                  de limpieza y mantenimiento periódico
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="tarifa"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Tarifa Principal"
                    name="tarifa"
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value.toString()
                        : ""
                    }
                    onChange={(value) => field.onChange(parseFloat(value))}
                    error={fieldState.error?.message}
                    type="number"
                    prefix="$"
                    placeholder="Ej: 2500 (costo base según periodicidad)"
                  />
                )}
              />

              <Controller
                name="tarifa_alquiler"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Tarifa de Alquiler"
                    name="tarifa_alquiler"
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value.toString()
                        : ""
                    }
                    onChange={(value) => field.onChange(parseFloat(value))}
                    error={fieldState.error?.message}
                    type="number"
                    prefix="$"
                    placeholder="Ej: 500 (costo adicional de alquiler)"
                  />
                )}
              />

              <Controller
                name="tarifa_instalacion"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Tarifa de Instalación"
                    name="tarifa_instalacion"
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value.toString()
                        : ""
                    }
                    onChange={(value) => field.onChange(parseFloat(value))}
                    error={fieldState.error?.message}
                    type="number"
                    prefix="$"
                    placeholder="Ej: 800 (costo único de instalación)"
                  />
                )}
              />

              <Controller
                name="tarifa_limpieza"
                control={control}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Tarifa de Limpieza"
                    name="tarifa_limpieza"
                    value={
                      field.value !== undefined && field.value !== null
                        ? field.value.toString()
                        : ""
                    }
                    onChange={(value) => field.onChange(parseFloat(value))}
                    error={fieldState.error?.message}
                    type="number"
                    prefix="$"
                    placeholder="Ej: 300 (costo por servicio de limpieza)"
                  />
                )}
              />
            </div>

            {/* Periodicidad - Solo se muestra para tipo de servicio INSTALACION */}
            {watch("tipo_servicio") === "INSTALACION" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Controller
                  name="periodicidad"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormField
                      label="Periodicidad"
                      name="periodicidad"
                      fieldType="select"
                      value={field.value as string}
                      onChange={(value: string) => field.onChange(value)}
                      options={[
                        { label: "Diaria", value: "Diaria" },
                        {
                          label: "Dos veces por semana",
                          value: "Dos veces por semana",
                        },
                        {
                          label: "Tres veces por semana",
                          value: "Tres veces por semana",
                        },
                        {
                          label: "Cuatro veces por semana",
                          value: "Cuatro veces por semana",
                        },
                        { label: "Semanal", value: "Semanal" },
                        { label: "Quincenal", value: "Quincenal" },
                        { label: "Mensual", value: "Mensual" },
                        { label: "Anual", value: "Anual" },
                      ]}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            )}

            <Controller
              name="estado"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Estado
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`border rounded-md p-3 cursor-pointer flex items-center justify-center ${
                        field.value === "Activo"
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      onClick={() => field.onChange("Activo")}
                    >
                      Activo
                    </div>
                    <div
                      className={`border rounded-md p-3 cursor-pointer flex items-center justify-center ${
                        field.value === "Inactivo"
                          ? "bg-slate-200 border-slate-300 text-slate-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      onClick={() => field.onChange("Inactivo")}
                    >
                      Inactivo
                    </div>
                  </div>
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
        {/* Botones de navegación */}
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
            {step < 3 && (
              <Button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Guardar Contrato
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
