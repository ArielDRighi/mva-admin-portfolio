"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, isAfter, isValid, differenceInDays } from "date-fns";
import { User } from "./DashboardComponent";
import { getCookie } from "cookies-next";
import { getUserById } from "@/app/actions/users";
import {
  getLicenciaByEmpleadoId,
  updateLicenciaConducir,
  createLicenciaConducir,
} from "@/app/actions/LicenciasConducir";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  CarFront,
  FileText,
} from "lucide-react";
import Loader from "../ui/local/Loader";
import { LicenciaConducir } from "@/types/licenciasConducirTypes";
import { CustomDatePicker } from "../ui/local/CustomDatePicker";
import { toast } from "sonner";

// Categorías de licencia de conducir
const CATEGORIAS_LICENCIA = [
  { value: "A1", label: "A1 - Ciclomotores, motocicletas hasta 150cc" },
  { value: "A2", label: "A2 - Motocicletas hasta 300cc" },
  { value: "A3", label: "A3 - Motocicletas de más de 300cc" },
  { value: "B1", label: "B1 - Automóviles, camionetas hasta 3500kg" },
  { value: "B2", label: "B2 - Automóviles con acoplado" },
  { value: "C", label: "C - Camiones sin acoplado" },
  { value: "D1", label: "D1 - Transporte de pasajeros hasta 8 plazas" },
  { value: "D2", label: "D2 - Transporte de pasajeros más de 8 plazas" },
  { value: "E1", label: "E1 - Camiones con acoplado" },
  { value: "E2", label: "E2 - Maquinaria especial no agrícola" },
  { value: "F", label: "F - Vehículos para personas con discapacidad" },
  { value: "G", label: "G - Tractores agrícolas" },
];

interface StatusInfo {
  color: string;
  text: string;
  icon: React.ReactNode;
  bgColor: string;
  badgeColor: string;
}

const LicenciaDeConducirComponent = () => {
  // Estado inicial
  const [licencia, setLicencia] = useState({
    categoria: "",
    fecha_expedicion: null as Date | null,
    fecha_vencimiento: null as Date | null,
  });

  // Estados para control de UI
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({
    categoria: false,
    fecha_expedicion: false,
    fecha_vencimiento: false,
  });
  // Estados de datos
  const [user, setUser] = useState<User | null>(null);
  const [employeeId, setEmployeeId] = useState(0);
  const [originalLicencia, setOriginalLicencia] =
    useState<LicenciaConducir | null>(null);

  // Cargar usuario
  useEffect(() => {
    const userCookie = getCookie("user");
    if (userCookie) {
      try {
        setUser(JSON.parse(userCookie as string));
      } catch (error) {
        console.error("Error al parsear la cookie de usuario:", error);
        toast.error("Error de autenticación", {
          description: "No se pudo cargar la información del usuario",
        });
      }
    }
  }, []);

  // Cargar ID del empleado
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Usar type assertion para tipar correctamente la respuesta
        const fetchedUser = (await getUserById(user.id)) as {
          empleadoId?: number;
        };

        if (fetchedUser && typeof fetchedUser.empleadoId === "number") {
          setEmployeeId(fetchedUser.empleadoId);
        } else {
          console.error(
            "No se encontró el ID del empleado o no es válido:",
            fetchedUser
          );
          toast.error("Error", {
            description: "No se pudo obtener la información del empleado",
          });
        }
      } catch (error) {
        console.error("Error al obtener datos del empleado:", error);
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudo obtener la información del empleado",
        });
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchEmployee();
  }, [user?.id]);

  // Cargar licencia de conducir
  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) return;

      try {
        setLoading(true);
        const response = await getLicenciaByEmpleadoId(employeeId);

        // Verificar si hay respuesta y tiene la estructura correcta
        if (response && typeof response === "object") {
          // Verificar si tiene las propiedades esperadas de una licencia
          if (
            "categoria" in response ||
            "fecha_expedicion" in response ||
            "fecha_vencimiento" in response
          ) {
            const fetchedLicencia = response as LicenciaConducir;

            setOriginalLicencia(fetchedLicencia);
            setLicencia({
              categoria: fetchedLicencia.categoria || "",
              fecha_expedicion: fetchedLicencia.fecha_expedicion
                ? new Date(fetchedLicencia.fecha_expedicion)
                : null,
              fecha_vencimiento: fetchedLicencia.fecha_vencimiento
                ? new Date(fetchedLicencia.fecha_vencimiento)
                : null,
            });
          } else if (
            "message" in response &&
            typeof response.message === "string"
          ) {
            // Si es una respuesta de "no hay licencia" pero es normal (no un error)
            console.log("No hay licencia registrada:", response.message);
            setOriginalLicencia(null);
          } else {
            console.error("Formato de respuesta no reconocido:", response);
          }
        } else if (response === null || response === undefined) {
          // Es normal que no haya licencia registrada
          console.log("No hay licencia registrada para el empleado");
          setOriginalLicencia(null);
        } else {
          console.error("Respuesta no válida:", response);
          toast.error("Error", {
            description: "Formato de datos no válido",
          });
        }
      } catch (error) {
        console.error("Error al cargar licencia de conducir:", error);
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Error al cargar la licencia de conducir",
        });
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetchData();
  }, [employeeId]);

  // Manejadores de eventos
  const handleChange = (value: string) => {
    setLicencia((prev) => ({ ...prev, categoria: value }));
    setErrors((prev) => ({ ...prev, categoria: false }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setLicencia((prev) => ({ ...prev, [name]: date }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateForm = () => {
    const newErrors = {
      categoria: !licencia.categoria,
      fecha_expedicion:
        !licencia.fecha_expedicion ||
        !isValid(licencia.fecha_expedicion || new Date()),
      fecha_vencimiento:
        !licencia.fecha_vencimiento ||
        !isValid(licencia.fecha_vencimiento || new Date()) ||
        !(
          licencia.fecha_vencimiento &&
          licencia.fecha_expedicion &&
          isAfter(licencia.fecha_vencimiento, licencia.fecha_expedicion)
        ),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Preparar datos para enviar a la API
      const licenciaData = {
        categoria: licencia.categoria,
        fecha_expedicion: licencia.fecha_expedicion || new Date(),
        fecha_vencimiento: licencia.fecha_vencimiento || new Date(),
      };

      let response;
      if (!originalLicencia) {
        // Crear nueva licencia
        response = await createLicenciaConducir(employeeId, licenciaData);

        // Verificar respuesta
        if (response && typeof response === "object") {
          // Intentar extraer mensaje personalizado si existe
          let successMessage = "Licencia de conducir creada con éxito";
          if ("message" in response && typeof response.message === "string") {
            successMessage = response.message;
          }

          toast.success("Éxito", {
            description: successMessage,
          });
        } else {
          toast.success("Éxito", {
            description: "Licencia de conducir creada con éxito",
          });
        }
      } else {
        // Actualizar licencia existente
        response = await updateLicenciaConducir(employeeId, licenciaData);

        // Verificar respuesta
        if (response && typeof response === "object") {
          // Intentar extraer mensaje personalizado si existe
          let successMessage = "Licencia de conducir actualizada con éxito";
          if ("message" in response && typeof response.message === "string") {
            successMessage = response.message;
          }

          toast.success("Éxito", {
            description: successMessage,
          });
        } else {
          toast.success("Éxito", {
            description: "Licencia de conducir actualizada con éxito",
          });
        }
      }

      // Desactivar modo edición
      setEditMode(false);

      // Refrescar datos de la licencia
      if (employeeId) {
        try {
          const updatedResponse = await getLicenciaByEmpleadoId(employeeId);

          if (updatedResponse && typeof updatedResponse === "object") {
            // Verificar si tiene las propiedades esperadas de una licencia
            if (
              "categoria" in updatedResponse ||
              "fecha_expedicion" in updatedResponse ||
              "fecha_vencimiento" in updatedResponse
            ) {
              const updatedLicense = updatedResponse as LicenciaConducir;

              setOriginalLicencia(updatedLicense);
              setLicencia({
                categoria: updatedLicense.categoria || "",
                fecha_expedicion: updatedLicense.fecha_expedicion
                  ? new Date(updatedLicense.fecha_expedicion)
                  : null,
                fecha_vencimiento: updatedLicense.fecha_vencimiento
                  ? new Date(updatedLicense.fecha_vencimiento)
                  : null,
              });
            } else {
              console.error(
                "Formato de licencia actualizada no reconocido:",
                updatedResponse
              );
            }
          } else {
            console.error("No se pudo refrescar la información de la licencia");
          }
        } catch (refreshError) {
          console.error("Error al refrescar datos de licencia:", refreshError);
          // No mostramos error al usuario porque ya se completó la operación principal
        }
      }
    } catch (error) {
      console.error("Error al procesar la licencia:", error);

      // Determinar mensaje de error específico
      let errorMessage = originalLicencia
        ? "Error al actualizar la licencia"
        : "Error al crear la licencia";

      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      } else if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        } else if ("error" in error && typeof error.error === "string") {
          errorMessage = error.error;
        }
      }

      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (originalLicencia) {
      setLicencia({
        categoria: originalLicencia.categoria || "",
        fecha_expedicion: originalLicencia.fecha_expedicion
          ? new Date(originalLicencia.fecha_expedicion)
          : null,
        fecha_vencimiento: originalLicencia.fecha_vencimiento
          ? new Date(originalLicencia.fecha_vencimiento)
          : null,
      });
    }
    setEditMode(false);
    setErrors({
      categoria: false,
      fecha_expedicion: false,
      fecha_vencimiento: false,
    });
  };

  // Cálculo de días restantes para vencimiento
  const calcularDiasRestantes = () => {
    if (!licencia.fecha_vencimiento) return null;
    const hoy = new Date();
    const vencimiento = new Date(licencia.fecha_vencimiento);
    return differenceInDays(vencimiento, hoy);
  };

  const diasRestantes = calcularDiasRestantes();

  // Obtener el color y mensaje según días restantes
  const getStatusInfo = (): StatusInfo => {
    if (diasRestantes === null)
      return {
        color: "text-blue-500",
        text: "No disponible",
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        bgColor: "bg-blue-50",
        badgeColor: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      };
    if (diasRestantes < 0)
      return {
        color: "text-red-600",
        text: "Vencida",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        bgColor: "bg-red-50",
        badgeColor: "bg-red-100 text-red-800 hover:bg-red-100",
      };
    if (diasRestantes < 30)
      return {
        color: "text-red-600",
        text: "Por vencer (menos de 30 días)",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        bgColor: "bg-red-50",
        badgeColor: "bg-red-100 text-red-800 hover:bg-red-100",
      };
    if (diasRestantes < 60)
      return {
        color: "text-amber-600",
        text: "Advertencia (menos de 60 días)",
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        bgColor: "bg-amber-50",
        badgeColor: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      };
    return {
      color: "text-green-600",
      text: "Vigente",
      icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
      bgColor: "bg-green-50",
      badgeColor: "bg-green-100 text-green-800 hover:bg-green-100",
    };
  };

  const statusInfo = getStatusInfo();

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(date, "dd/MM/yyyy");
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 m-4">
      {/* Header con info del empleado */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ¡Bienvenido, {user?.nombre.toUpperCase()}!
            </h1>
            <p className="mt-1 text-blue-100">
              {user?.roles} •{" "}
              <Badge className="bg-white/20 text-white hover:bg-white/30 ml-1">
                {user?.estado}
              </Badge>
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-white hover:bg-white/90 text-blue-700"
            onClick={() => (window.location.href = "/empleado/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <Card className="w-full shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                <div className="flex items-center">
                  <CarFront className="mr-2 h-5 w-5" />
                  Licencia de Conducir
                </div>
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Administra la información de tu licencia de conducir
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!originalLicencia ? (
            <div className="space-y-5">
              <div className="p-4 border rounded-lg bg-blue-50/50">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-lg font-medium text-blue-800">
                    No tienes licencia de conducir registrada
                  </span>
                </div>
                <p className="text-muted-foreground ml-7">
                  Registra tu licencia para que podamos asignarte vehículos
                  adecuados a tu habilitación
                </p>
              </div>

              {editMode ? (
                <div className="bg-white rounded-lg border p-6 shadow-sm">
                  {" "}
                  <h3 className="text-lg font-medium mb-4">
                    Registro de Licencia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select
                        value={licencia.categoria}
                        onValueChange={handleChange}
                      >
                        <SelectTrigger
                          id="categoria"
                          className={errors.categoria ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS_LICENCIA.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.categoria && (
                        <p className="text-red-500 text-sm">
                          La categoría es obligatoria
                        </p>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="fecha_expedicion">
                          Fecha de expedición
                        </Label>
                        <CustomDatePicker
                          date={licencia.fecha_expedicion}
                          onChange={(date) =>
                            handleDateChange("fecha_expedicion", date)
                          }
                          placeholder="Selecciona fecha de expedición"
                          className={
                            errors.fecha_expedicion ? "border-red-500" : ""
                          }
                        />
                        {errors.fecha_expedicion && (
                          <p className="text-red-500 text-sm">
                            Fecha de expedición inválida
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fecha_vencimiento">
                          Fecha de vencimiento
                        </Label>
                        <CustomDatePicker
                          date={licencia.fecha_vencimiento}
                          onChange={(date) =>
                            handleDateChange("fecha_vencimiento", date)
                          }
                          placeholder="Selecciona fecha de vencimiento"
                          className={
                            errors.fecha_vencimiento ? "border-red-500" : ""
                          }
                          minDate={licencia.fecha_expedicion || undefined}
                        />
                        {errors.fecha_vencimiento && (
                          <p className="text-red-500 text-sm">
                            Fecha inválida o anterior a la expedición
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setErrors({
                          categoria: false,
                          fecha_expedicion: false,
                          fecha_vencimiento: false,
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Registrar licencia"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mt-4">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setEditMode(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Cargar mi licencia de conducir
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {diasRestantes !== null && diasRestantes < 60 && (
                <div
                  className={`p-4 border rounded-lg ${statusInfo.bgColor} flex items-start`}
                >
                  {statusInfo.icon}
                  <div className="ml-2">
                    <p className={`font-medium ${statusInfo.color}`}>
                      {diasRestantes < 0
                        ? "¡Atención! Tu licencia ha vencido"
                        : `Tu licencia vence en ${diasRestantes} días`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {diasRestantes < 0
                        ? "Debes renovarla lo antes posible para continuar operando vehículos."
                        : "Es recomendable que planifiques su renovación con anticipación."}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border shadow-sm">
                <div className="border-b p-4">
                  <h3 className="text-lg font-medium">
                    Información de la Licencia
                  </h3>
                </div>

                <div className="p-5">
                  {editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Select
                          value={licencia.categoria}
                          onValueChange={handleChange}
                        >
                          <SelectTrigger
                            id="categoria"
                            className={errors.categoria ? "border-red-500" : ""}
                          >
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIAS_LICENCIA.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.categoria && (
                          <p className="text-red-500 text-sm">
                            La categoría es obligatoria
                          </p>
                        )}
                      </div>

                      <div className="space-y-6">
                        {" "}
                        <div className="space-y-2">
                          <Label htmlFor="fecha_expedicion">
                            Fecha de expedición
                          </Label>
                          <CustomDatePicker
                            date={licencia.fecha_expedicion}
                            onChange={(date) =>
                              handleDateChange("fecha_expedicion", date)
                            }
                            placeholder="Selecciona fecha de expedición"
                            className={
                              errors.fecha_expedicion ? "border-red-500" : ""
                            }
                          />
                          {errors.fecha_expedicion && (
                            <p className="text-red-500 text-sm">
                              Fecha de expedición inválida
                            </p>
                          )}
                        </div>{" "}
                        <div className="space-y-2">
                          <Label htmlFor="fecha_vencimiento">
                            Fecha de vencimiento
                          </Label>
                          <CustomDatePicker
                            date={licencia.fecha_vencimiento}
                            onChange={(date) =>
                              handleDateChange("fecha_vencimiento", date)
                            }
                            placeholder="Selecciona fecha de vencimiento"
                            className={
                              errors.fecha_vencimiento ? "border-red-500" : ""
                            }
                            minDate={licencia.fecha_expedicion || undefined}
                          />
                          {errors.fecha_vencimiento && (
                            <p className="text-red-500 text-sm">
                              Fecha inválida o anterior a la expedición
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Categoría
                            </h4>
                            <p className="text-base font-medium mt-1">
                              {CATEGORIAS_LICENCIA.find(
                                (cat) => cat.value === licencia.categoria
                              )?.label || licencia.categoria}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Fecha de expedición
                            </h4>
                            <div className="flex items-center text-sm mt-1">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>
                                {formatDate(licencia.fecha_expedicion)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Fecha de vencimiento
                            </h4>
                            <div className="flex items-center text-sm mt-1">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>
                                {formatDate(licencia.fecha_vencimiento)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center mb-3">
                          {statusInfo.icon}
                          <span className="ml-2 font-medium text-blue-800">
                            Estado de la Licencia
                          </span>
                        </div>

                        <div className="space-y-3">
                          <Badge className={statusInfo.badgeColor}>
                            {statusInfo.text}
                          </Badge>

                          {diasRestantes !== null && diasRestantes < 60 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {diasRestantes < 0
                                ? "Tu licencia ha vencido. Por favor, renuévala lo antes posible."
                                : `Tu licencia vence en ${diasRestantes} días. Te recomendamos renovarla pronto.`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-6">
                    {editMode ? (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          Cancelar
                        </Button>
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => setEditMode(true)}
                      >
                        Editar licencia
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenciaDeConducirComponent;
