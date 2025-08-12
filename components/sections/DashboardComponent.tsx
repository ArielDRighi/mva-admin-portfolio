"use client";

import React, { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  TruckIcon,
  User2Icon,
  Toilet,
  Activity,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getTotalVehicles } from "@/app/actions/vehiculos";
import { getTotalEmployees } from "@/app/actions/empleados";
import { getTotalSanitarios } from "@/app/actions/sanitarios";
import {
  getProximosServices,
  getRecentActivity,
  getResumeServices,
  getServicesStats,
} from "@/app/actions/services";
import { Servicio } from "@/types/serviceTypes";
import {
  getFuturesCleanings,
  getUpcomingFutureCleanings,
} from "@/app/actions/services";
import { getLicenciasToExpire } from "@/app/actions/LicenciasConducir";
import { toast } from "sonner";

export type User = {
  id: number;
  nombre: string;
  email: string;
  empleadoId: number | null;
  estado: string;
  roles: string[];
};
export type totalVehicles = {
  total: number;
  totalDisponibles: number;
  totalMantenimiento: number;
  totalAsignado: number;
};
export type totalEmployees = {
  total: number;
  totalDisponibles: number;
  totalInactivos: number;
};
export type totalSanitarios = {
  total: number;
  totalAsignado: number;
  totalDisponibles: number;
  totalMantenimiento: number;
};

export type serviceStats = {
  total: number;
  totalInstalacion: number;
  totalLimpieza: number;
  totalRetiro: number;
};
export type resumeService = {
  pendientes: number;
  completados: number;
};

export type Cleaning = {
  id: number;
  numero_de_limpieza: number;
  fecha_de_limpieza: string;
  cliente?: {
    nombre: string;
    id: number;
  };
  servicio?: {
    id: number;
  };
};

export type CleaningsResponse = {
  items: Cleaning[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Interfaz principal para la actividad reciente
export interface ActivityRecent {
  timestamp?: string; // Fecha general de la actividad
  latestCompletedService?: Servicio; // Servicio completado más reciente
  latestScheduledService?: Servicio; // Servicio programado más reciente
  latestClient?: Cliente; // Cliente más reciente
  latestToilet?: Sanitario; // Sanitario más reciente
  latestMaintenance?: MantenimientoSanitario; // Mantenimiento más reciente
  latestVehicle?: Vehiculo; // Vehículo más reciente
}

// Importar LicenciaConducir y LicenciasConducirResponse desde el archivo de tipos centralizado
import { LicenciasConducirResponse } from "@/types/licenciasConducirTypes";
import {
  Cliente,
  MantenimientoSanitario,
  Sanitario,
  Vehiculo,
} from "@/types/types";

// Alias para mantener compatibilidad con código existente
export type LicenciasToExpireResponse = LicenciasConducirResponse;

const DashboardComponent = () => {
  const { user, isAdmin, isSupervisor, isOperario } = useCurrentUser();
  const [totalVehicles, setTotalVehicles] = useState<totalVehicles>();
  const [totalEmployees, setTotalEmployees] = useState<totalEmployees>();
  const [totalSanitarios, setTotalSanitarios] = useState<totalSanitarios>();
  const [proximosServicios, setProximosServicios] = useState<Servicio[]>([]);
  const [servicesStats, setServicesStats] = useState<serviceStats | null>(null);
  const [resumeService, setresumeService] = useState<resumeService>();
  const [futuresCleanings, setFuturesCleanings] = useState<CleaningsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [activityRecent, setRecentActivity] = useState<ActivityRecent | null>(
    null
  );
  const [licenciasToExpire, setLicenciasToExpire] =
    useState<LicenciasToExpireResponse>();

  const router = useRouter(); // Estado para tracking de errores de carga
  const [loadingErrors, setLoadingErrors] = useState<Record<string, string>>(
    {}
  );
  useEffect(() => {
    const fetchData = async () => {
      // Definimos las promesas básicas que todos pueden ver
      const basePromises = [
        { name: "totalVehicles", promise: getTotalVehicles() },
        { name: "totalEmployees", promise: getTotalEmployees() },
        { name: "totalSanitarios", promise: getTotalSanitarios() },
        { name: "proximosServicios", promise: getProximosServices() },
        { name: "serviceStats", promise: getServicesStats() },
        { name: "resumeService", promise: getResumeServices() },
        {
          name: "futuresCleanings",
          promise: getUpcomingFutureCleanings(30, 1, 10),
        },
        { name: "activity", promise: getRecentActivity() },
      ];

      // Agregamos promesas adicionales solo para administradores
      const adminOnlyPromises = [
        {
          name: "licenciasToExpire",
          promise: getLicenciasToExpire(
            30,
            1,
            10
          ) as Promise<LicenciasConducirResponse>,
        },
      ];

      // Combinamos las promesas según el rol
      const promises = isAdmin
        ? [...basePromises, ...adminOnlyPromises]
        : basePromises;

      // Ejecutamos todas las promesas y manejamos éxitos/errores individualmente
      const results = await Promise.allSettled(
        promises.map((item) => item.promise)
      );

      // Colectamos errores para mostrar/registrar
      const errorMessages: Record<string, string> = {};
      // Procesamos los resultados
      results.forEach((result, index) => {
        const { name } = promises[index];

        if (result.status === "fulfilled") {
          // Si la promesa se resolvió exitosamente, actualizamos el estado
          switch (name) {
            case "totalVehicles":
              setTotalVehicles(result.value as totalVehicles);
              break;
            case "totalEmployees":
              setTotalEmployees(result.value as totalEmployees);
              break;
            case "totalSanitarios":
              setTotalSanitarios(result.value as totalSanitarios);
              break;
            case "proximosServicios":
              setProximosServicios(result.value as Servicio[]);
              break;
            case "serviceStats":
              setServicesStats(result.value as serviceStats | null);
              break;
            case "resumeService":
              setresumeService(result.value as resumeService);
              break;
            case "futuresCleanings":
              setFuturesCleanings(result.value as CleaningsResponse);
              break;
            case "activity":
              setRecentActivity(result.value as ActivityRecent | null);
              break;
            case "licenciasToExpire":
              setLicenciasToExpire(result.value as LicenciasConducirResponse);
              break;
          }
        } else {
          // Si la promesa fue rechazada, registramos y mostramos el error
          const errorMessage =
            typeof result.reason === "string"
              ? result.reason
              : result.reason instanceof Error
              ? result.reason.message
              : `Error al cargar ${name}`;
          console.error(`Error fetching ${name}:`, result.reason);

          // Guardar en el estado de errores para mostrar en el componente
          errorMessages[name] = errorMessage;

          // Solo mostrar toast para errores críticos y que NO sean de permisos
          const criticalResources = [
            "totalVehicles",
            "totalEmployees",
            "totalSanitarios",
            "proximosServicios",
          ];

          // No mostrar toast si es error de permisos
          const isPermissionError =
            errorMessage.includes("permisos") ||
            errorMessage.includes("No tiene") ||
            errorMessage.includes("Unauthorized");

          if (criticalResources.includes(name) && !isPermissionError) {
            toast.error(`Error al cargar datos importantes`, {
              description: errorMessage,
              duration: 5000,
            });
          }
        }
      });

      // Solo mostrar errores que NO sean de permisos
      const nonPermissionErrors = Object.fromEntries(
        Object.entries(errorMessages).filter(
          ([_, message]) =>
            !message.includes("permisos") &&
            !message.includes("No tiene") &&
            !message.includes("Unauthorized")
        )
      );

      // Actualizamos el estado de errores solo con errores relevantes
      if (Object.keys(nonPermissionErrors).length > 0) {
        setLoadingErrors(nonPermissionErrors);
      }
    };

    fetchData();
  }, [isAdmin, isSupervisor]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROGRAMADO":
        return "bg-blue-100 text-blue-800";
      case "EN_PROGRESO":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETADO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  // Eliminada función getPriorityColor que no se utiliza

  const servicesByType = servicesStats
    ? [
        {
          type: "INSTALACIÓN",
          count: servicesStats.totalInstalacion,
          percentage:
            Math.round(
              (servicesStats.totalInstalacion / servicesStats.total) * 100
            ) || 0,
        },
        {
          type: "LIMPIEZA",
          count: servicesStats.totalLimpieza,
          percentage:
            Math.round(
              (servicesStats.totalLimpieza / servicesStats.total) * 100
            ) || 0,
        },
        {
          type: "RETIRO",
          count: servicesStats.totalRetiro,
          percentage:
            Math.round(
              (servicesStats.totalRetiro / servicesStats.total) * 100
            ) || 0,
        },
      ]
    : [];
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          {" "}
          <h1 className="text-3xl font-bold">
            Bienvenido, {user?.name || "Administrador"}
          </h1>
          <p className="text-gray-500 mt-1">
            Panel de control MVA - {new Date().toLocaleDateString()}
          </p>
        </div>{" "}
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            onClick={() => router.push("/admin/dashboard/servicios/listado")}
            className="bg-primary hover:bg-primary/90"
          >
            Ver Servicios
          </Button>
        </div>
      </div>
      {/* Mostrar errores de carga si los hay */}
      {Object.keys(loadingErrors).length > 0 && (
        <div className="mb-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                <CardTitle className="text-red-800">
                  Algunos datos no pudieron cargarse
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(loadingErrors).map(([key, message]) => (
                  <li key={key} className="text-sm text-red-700">
                    {message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Resource summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vehículos</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVehicles?.totalDisponibles}/{totalVehicles?.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Vehículos disponibles
            </p>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span>Disponibles</span>
                <span className="font-semibold">
                  {totalVehicles?.totalDisponibles} (
                  {Math.round(
                    ((totalVehicles?.totalDisponibles || 0) /
                      (totalVehicles?.total || 1)) *
                      100
                  )}
                  %)
                </span>
              </div>
              <Progress
                value={
                  ((totalVehicles?.totalDisponibles || 0) /
                    (totalVehicles?.total || 1)) *
                  100
                }
                className="h-1"
              />
              <div className="flex justify-between text-xs mt-2">
                <Badge variant="outline" className="bg-blue-50">
                  Asignados: {totalVehicles?.totalAsignado}
                </Badge>
                <Badge variant="outline" className="bg-amber-50">
                  En mant.: {totalVehicles?.totalMantenimiento}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <User2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEmployees?.totalDisponibles}/{totalEmployees?.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Empleados disponibles
            </p>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span>Disponibles</span>
                <span className="font-semibold">
                  {totalEmployees?.totalDisponibles} (
                  {Math.round(
                    ((totalEmployees?.totalDisponibles || 0) /
                      (totalEmployees?.total || 1)) *
                      100
                  )}
                  %)
                </span>
              </div>{" "}
              <Progress
                value={
                  ((totalEmployees?.totalDisponibles || 0) /
                    (totalEmployees?.total || 1)) *
                  100
                }
                className="h-1"
              />
              <div className="flex justify-between text-xs mt-2">
                <Badge variant="outline" className="bg-red-50">
                  Inactivos: {totalEmployees?.totalInactivos}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Baños</CardTitle>
            <Toilet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSanitarios?.totalDisponibles}/{totalSanitarios?.total}
            </div>
            <p className="text-xs text-muted-foreground">Baños disponibles</p>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span>Disponibles</span>
                <span className="font-semibold">
                  {totalSanitarios?.totalDisponibles} ({" "}
                  {Math.round(
                    ((totalSanitarios?.totalDisponibles || 0) /
                      (totalSanitarios?.total || 1)) *
                      100
                  )}
                  %)
                </span>
              </div>{" "}
              <Progress
                value={
                  ((totalSanitarios?.totalDisponibles || 0) /
                    (totalSanitarios?.total || 1)) *
                  100
                }
                className="h-1"
              />
              <div className="flex justify-between text-xs mt-2">
                <Badge variant="outline" className="bg-blue-50">
                  Asignados: {totalSanitarios?.totalAsignado}
                </Badge>
                <Badge variant="outline" className="bg-amber-50">
                  En mant.: {totalSanitarios?.totalMantenimiento}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Today's services and summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              {" "}
              <div className="flex items-center justify-between">
                <CardTitle>Servicios proximos</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push("/admin/dashboard/servicios/listado")
                  }
                >
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proximosServicios && proximosServicios.length > 0 ? (
                  proximosServicios.map((servicio) => (
                    <div
                      key={servicio.id}
                      className="flex items-center p-3 border rounded-md"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="font-semibold text-lg">
                          {new Date(servicio.fechaProgramada)
                            .getHours()
                            .toString()
                            .padStart(2, "0")}
                          :
                          {new Date(servicio.fechaProgramada)
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-medium">
                          {servicio.cliente?.nombre ||
                            `Cliente ID: ${servicio.clienteId}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {servicio.ubicacion}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="secondary">
                          {servicio.tipoServicio}
                        </Badge>
                        <span
                          className={`mt-1 text-xs px-2 py-1 rounded ${getStatusColor(
                            servicio.estado
                          )}`}
                        >
                          {servicio.estado.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay servicios programados para hoy
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Resumen de Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-bold text-xl text-blue-700">
                    {resumeService?.pendientes}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">
                    Servicios Pendientes
                  </div>
                  <div className="text-sm">Programados para esta semana</div>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="font-bold text-xl text-green-700">
                    {resumeService?.completados}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">
                    Servicios Completados
                  </div>
                  <div className="text-sm">En las últimas 24 horas</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Distribución de servicios
                </div>
                {servicesByType.map((service, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{service.type}</span>
                      <span>
                        {service.count} ({service.percentage}%)
                      </span>
                    </div>
                    <Progress value={service.percentage} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Tabs with upcoming maintenance and recent activity */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Tabs defaultValue="maintenance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="maintenance">
              <Clock className="mr-2 h-4 w-4" />
              Mantenimientos Programados
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="mr-2 h-4 w-4" />
              Actividad Reciente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Próximas Limpiezas</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push("/admin/dashboard/servicios/limpiezas")
                    }
                  >
                    Ver todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {futuresCleanings &&
                futuresCleanings.items &&
                futuresCleanings.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {futuresCleanings.items
                      .slice(0, 4)
                      .map((item: Cleaning) => (
                        <div
                          key={item.id}
                          className="border rounded-md p-4 relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="bg-gray-50">
                              Limpieza
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              #{item.numero_de_limpieza}
                            </Badge>
                          </div>
                          <h3 className="font-medium">
                            {item.cliente?.nombre}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Servicio ID: {item.servicio?.id}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {new Date(
                              item.fecha_de_limpieza
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay limpiezas programadas próximamente
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityRecent && (
                    <>
                      {" "}
                      {/* Servicio completado */}
                      {activityRecent.latestCompletedService && (
                        <div className="flex items-start pb-4 border-b">
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <TruckIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <span className="font-medium">COMPLETADO</span>
                              <span className="ml-2 text-xs text-gray-500">
                                {activityRecent?.timestamp
                                  ? new Date(
                                      activityRecent.timestamp
                                    ).toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                            <p className="text-sm">
                              {
                                activityRecent.latestCompletedService
                                  .tipoServicio
                              }{" "}
                              para{" "}
                              {
                                activityRecent.latestCompletedService.cliente
                                  ?.nombre
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ubicación:{" "}
                              {activityRecent.latestCompletedService.ubicacion}
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Servicio programado */}
                      {activityRecent.latestScheduledService &&
                        activityRecent.timestamp && (
                          <div className="flex items-start pb-4 border-b">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <TruckIcon className="h-5 w-5" />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">PROGRAMADO</span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {activityRecent.timestamp
                                    ? new Date(
                                        activityRecent.timestamp
                                      ).toLocaleString()
                                    : "-"}
                                </span>
                              </div>
                              <p className="text-sm">
                                {
                                  activityRecent.latestScheduledService
                                    .tipoServicio
                                }{" "}
                                para{" "}
                                {
                                  activityRecent.latestScheduledService.cliente
                                    ?.nombre
                                }
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Ubicación:{" "}
                                {
                                  activityRecent.latestScheduledService
                                    .ubicacion
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      {/* Cliente nuevo */}
                      {activityRecent.latestClient &&
                        activityRecent.timestamp && (
                          <div className="flex items-start pb-4 border-b">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <User2Icon className="h-5 w-5" />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  NUEVO CLIENTE
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {new Date(
                                    activityRecent.timestamp
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">
                                {activityRecent.latestClient.nombre}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Contacto:{" "}
                                {activityRecent.latestClient
                                  .contacto_principal || "-"}
                              </p>
                            </div>
                          </div>
                        )}
                      {/* Baño nuevo/actualizado */}
                      {activityRecent.latestToilet &&
                        activityRecent.timestamp && (
                          <div className="flex items-start pb-4 border-b">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Toilet className="h-5 w-5" />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  BAÑO REGISTRADO
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {new Date(
                                    activityRecent.timestamp
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">
                                Baño{" "}
                                {activityRecent.latestToilet.codigo_interno} -{" "}
                                {activityRecent.latestToilet.modelo}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Estado: {activityRecent.latestToilet.estado}
                              </p>
                            </div>
                          </div>
                        )}
                      {/* Mantenimiento */}
                      {activityRecent.latestMaintenance && (
                        <div className="flex items-start pb-4 border-b">
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <span className="font-medium">
                                MANTENIMIENTO{" "}
                                {activityRecent.latestMaintenance.completado
                                  ? "COMPLETADO"
                                  : "PROGRAMADO"}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {activityRecent.latestMaintenance.completado &&
                                activityRecent.latestMaintenance.fechaCompletado
                                  ? new Date(
                                      activityRecent.latestMaintenance.fechaCompletado
                                    ).toLocaleString()
                                  : activityRecent.timestamp
                                  ? new Date(
                                      activityRecent.timestamp
                                    ).toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                            <p className="text-sm">
                              {
                                activityRecent.latestMaintenance
                                  .tipo_mantenimiento
                              }{" "}
                              - {activityRecent.latestMaintenance.descripcion}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Baño:{" "}
                              {activityRecent.latestMaintenance.toilet
                                ?.codigo_interno || "-"}{" "}
                              | Técnico:{" "}
                              {activityRecent.latestMaintenance.empleado_id ||
                                "-"}
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Vehículo nuevo */}
                      {activityRecent.latestVehicle &&
                        activityRecent.timestamp && (
                          <div className="flex items-start pb-4 border-b last:border-0">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <TruckIcon className="h-5 w-5" />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  VEHÍCULO REGISTRADO
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {new Date(
                                    activityRecent.timestamp
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">
                                {activityRecent.latestVehicle.marca}{" "}
                                {activityRecent.latestVehicle.modelo} (
                                {activityRecent.latestVehicle.placa})
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Estado: {activityRecent.latestVehicle.estado}
                              </p>
                            </div>
                          </div>
                        )}
                    </>
                  )}

                  {(!activityRecent ||
                    Object.keys(activityRecent).length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No hay actividad reciente para mostrar
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>{" "}
      {/* Alerts and notifications - Solo para administradores */}
      {isAdmin &&
        licenciasToExpire &&
        licenciasToExpire.data &&
        licenciasToExpire.data.length > 0 && (
          <div className="mb-8">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                  <CardTitle className="text-amber-800">
                    Licencias por vencer
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {licenciasToExpire.data.map((licencia) => (
                    <div
                      key={licencia.licencia_id}
                      className="flex items-center justify-between bg-white p-3 rounded-md border border-amber-100"
                    >
                      <div>
                        {" "}
                        <p className="font-medium">
                          {licencia.empleado?.nombre || "Sin nombre"}{" "}
                          {licencia.empleado?.apellido || ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          Licencia categoría{" "}
                          <strong>{licencia.categoria}</strong> vence el{" "}
                          {new Date(
                            licencia.fecha_vencimiento
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800">
                        {Math.ceil(
                          (new Date(licencia.fecha_vencimiento).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        días
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="px-6 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-200 hover:bg-amber-100"
                  onClick={() =>
                    router.push("/admin/dashboard/empleados/licencias")
                  }
                >
                  Ver todas las licencias
                </Button>
              </div>
            </Card>
          </div>
        )}
    </div>
  );
};

export default DashboardComponent;
