"use client";

import {
  getLicenciasConducir,
  getLicenciasToExpire,
} from "@/app/actions/LicenciasConducir";
import {
  LicenciasConducirResponse,
  LicenciaConducir,
} from "@/types/licenciasConducirTypes";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Loader from "../ui/local/Loader";
import { ListadoTabla } from "../ui/local/ListadoTabla";
import { TableCell } from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Calendar,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Car,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

type SearchableKey =
  | "nombre_empleado"
  | "apellido_empleado"
  | "numero_licencia"
  | "categoria"
  | "estado_vencimiento"
  | "empleado"
  | "documento_empleado"
  | "cargo_empleado"
  | "licencia_id"
  | "fecha_expedicion"
  | "fecha_vencimiento";

export default function ListadoLicenciasConducirComponent({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: LicenciaConducir[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [licencias, setLicencias] = useState<LicenciaConducir[]>(data || []);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(totalItems || 0);
  const [page, setPage] = useState(currentPage || 1);
  const [activeTab, setActiveTab] = useState("todos");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const matchesStatusTerm = (
    licencia: LicenciaConducir,
    searchTerm: string
  ): boolean => {
    try {
      if (!licencia.fecha_vencimiento) return false;

      const fechaVencimiento = new Date(licencia.fecha_vencimiento);
      // Verificar que la fecha sea válida
      if (isNaN(fechaVencimiento.getTime())) {
        console.warn(
          `Fecha de vencimiento inválida: ${licencia.fecha_vencimiento}`
        );
        return false;
      }

      const hoy = new Date();
      const diasRestantes = differenceInDays(fechaVencimiento, hoy);

      switch (searchTerm.toLowerCase()) {
        case "vencida":
          return diasRestantes < 0;
        case "por vencer":
        case "próxima":
          return diasRestantes >= 0 && diasRestantes < 30;
        case "advertencia":
          return diasRestantes >= 30 && diasRestantes < 60;
        case "vigente":
          return diasRestantes >= 60;
        default:
          // Para otros términos que no son estados, retornar false
          return false;
      }
    } catch (error) {
      console.error("Error al comparar estado de vencimiento:", error);
      return false;
    }
  };
  const fetchLicencias = useCallback(async () => {
    const currentPage = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    setLoading(true);

    try {
      // Determinar si estamos buscando por estado de vencimiento
      const isStatusSearch = [
        "vencida",
        "por vencer",
        "próxima",
        "vigente",
        "advertencia",
      ].includes(search.trim().toLowerCase());

      let fetchedLicencias: LicenciasConducirResponse;

      // Si estamos en la pestaña "por-vencer" o buscando por estado, debemos hacer una lógica especial
      if (activeTab === "por-vencer") {
        // Para la pestaña "por vencer", siempre usamos getLicenciasToExpire con filtrado de 60 días
        fetchedLicencias = (await getLicenciasToExpire(
          60,
          currentPage,
          itemsPerPage,
          isStatusSearch ? search : "" // Solo enviar término si es búsqueda por estado
        )) as LicenciasConducirResponse;
      } else {
        // Para la pestaña "todos", usamos la API normal
        fetchedLicencias = (await getLicenciasConducir(
          currentPage,
          itemsPerPage,
          search // Enviar el término completo al backend
        )) as LicenciasConducirResponse;
      }

      if (fetchedLicencias.data && Array.isArray(fetchedLicencias.data)) {
        // Filtrar licencias que tengan datos de empleado válidos
        let licenciasConEmpleados = fetchedLicencias.data.filter(
          (licencia) => licencia.empleado
        );

        // Aplicar filtrado local adicional solo para búsquedas por estado
        const searchTerm = search.trim().toLowerCase();

        if (isStatusSearch && !activeTab.includes("por-vencer")) {
          // Si estamos buscando por estado fuera de la pestaña "por-vencer",
          // aplicamos el filtro localmente
          licenciasConEmpleados = licenciasConEmpleados.filter((licencia) =>
            matchesStatusTerm(licencia, searchTerm)
          );
        }

        setLicencias(licenciasConEmpleados);
        setTotal(
          isStatusSearch && !activeTab.includes("por-vencer")
            ? licenciasConEmpleados.length // Si filtramos localmente, el total es el conteo de los filtrados
            : fetchedLicencias.totalItems // De lo contrario, usamos el total proporcionado por la API
        );
        setPage(currentPage);
      } else {
        console.error("Formato de respuesta no reconocido:", fetchedLicencias);
        toast.error("Error de formato", {
          description: "El formato de la respuesta del servidor no es válido.",
          duration: 5000,
        });
        setLicencias([]);
        setTotal(0);
        setPage(1);
      }
    } catch (error) {
      console.error("Error al cargar las licencias de conducir:", error);

      // Extraer el mensaje de error específico
      let errorMessage = "No se pudieron cargar las licencias de conducir.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error al cargar licencias", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });

      // Establecemos valores predeterminados seguros
      setLicencias([]);
      setTotal(0);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, itemsPerPage, activeTab]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };
  const handleSearchChange = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const searchTerm = search.trim();

      // Si el término está vacío, eliminar el parámetro en lugar de enviarlo vacío
      if (!searchTerm) {
        params.delete("search");
      } else {
        // Verificar si es un término de búsqueda especial para estado
        const estadosEspeciales = [
          "vencida",
          "por vencer",
          "próxima",
          "vigente",
          "advertencia",
        ];

        if (estadosEspeciales.includes(searchTerm.toLowerCase())) {
          // Para términos de estado, enviamos el término tal cual al backend
          params.set("search", searchTerm.toLowerCase());
        } else {
          // Para otros términos de búsqueda (nombre, apellido, etc.)
          params.set("search", searchTerm);
        }
      }

      // Siempre volver a la primera página cuando se realiza una búsqueda
      params.set("page", "1");
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router]
  );
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // Al cambiar de pestaña, reiniciar los parámetros de búsqueda para evitar conflictos
      const params = new URLSearchParams();
      params.set("page", "1"); // Reiniciar a la página 1

      // Eliminar cualquier búsqueda previa para evitar conflictos entre pestañas
      router.replace(`?${params.toString()}`);
    },
    [router]
  );
  // Efecto para manejar la carga inicial
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }
  }, [isFirstLoad]);

  // Efecto separado para reaccionar a cambios en searchParams o activeTab
  useEffect(() => {
    if (!isFirstLoad) {
      fetchLicencias();
    }
  }, [fetchLicencias, isFirstLoad, searchParams, activeTab]);

  const getStatusInfo = (fechaVencimiento: Date | string) => {
    try {
      const hoy = new Date();
      let vencimientoDate: Date;

      if (typeof fechaVencimiento === "string") {
        vencimientoDate = new Date(fechaVencimiento);
      } else {
        vencimientoDate = fechaVencimiento;
      }

      // Verificar si la fecha es válida
      if (isNaN(vencimientoDate.getTime())) {
        console.warn(`Fecha de vencimiento inválida: ${fechaVencimiento}`);
        return {
          text: "Error en fecha",
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          variant: "destructive" as const,
          color: "text-red-600",
        };
      }

      const diasRestantes = differenceInDays(vencimientoDate, hoy);

      if (diasRestantes < 0) {
        return {
          text: "Vencida",
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          variant: "destructive" as const,
          color: "text-red-600",
        };
      } else if (diasRestantes < 30) {
        return {
          text: "Por vencer",
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          variant: "outline" as const,
          color: "text-amber-600",
        };
      } else if (diasRestantes < 60) {
        return {
          text: "Advertencia",
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          variant: "outline" as const,
          color: "text-amber-600",
        };
      } else {
        return {
          text: "Vigente",
          icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
          variant: "default" as const,
          color: "text-green-600",
        };
      }
    } catch (error) {
      console.error("Error al determinar el estado de la licencia:", error);
      return {
        text: "Error",
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        variant: "destructive" as const,
        color: "text-red-600",
      };
    }
  };
  const formatDate = (date: string | Date) => {
    if (!date) return "-";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.warn(`Fecha inválida: ${date}`);
        return "-";
      }
      return format(dateObj, "dd/MM/yyyy");
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "-";
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const categorias: Record<string, string> = {
      A1: "A1 - Ciclomotores, motocicletas hasta 150cc",
      A2: "A2 - Motocicletas hasta 300cc",
      A3: "A3 - Motocicletas de más de 300cc",
      B1: "B1 - Automóviles, camionetas hasta 3500kg",
      B2: "B2 - Automóviles con acoplado",
      C: "C - Camiones sin acoplado",
      D1: "D1 - Transporte de pasajeros hasta 8 plazas",
      D2: "D2 - Transporte de pasajeros más de 8 plazas",
      E1: "E1 - Camiones con acoplado",
      E2: "E2 - Maquinaria especial no agrícola",
      F: "F - Vehículos para personas con discapacidad",
      G: "G - Tractores agrícolas",
    };

    return categorias[categoria] || categoria;
  };

  const filteredLicencias = useMemo(
    () =>
      activeTab === "todos"
        ? licencias
        : licencias.filter((licencia) => {
            try {
              const diasRestantes = differenceInDays(
                new Date(licencia.fecha_vencimiento),
                new Date()
              );
              return diasRestantes < 60 && diasRestantes > -30;
            } catch (error) {
              console.error("Error al filtrar licencias:", error);
              return false;
            }
          }),
    [licencias, activeTab]
  );

  // Añadir esta función antes del return para crear una versión "plana" de los datos
  const enhancedLicencias = useMemo(() => {
    return filteredLicencias.map((licencia) => {
      // Calcular el estado de vencimiento
      let estadoVencimiento = "";
      try {
        if (licencia.fecha_vencimiento) {
          const diasRestantes = differenceInDays(
            new Date(licencia.fecha_vencimiento),
            new Date()
          );

          if (diasRestantes < 0) {
            estadoVencimiento = "vencida";
          } else if (diasRestantes < 30) {
            estadoVencimiento = "por vencer";
          } else if (diasRestantes < 60) {
            estadoVencimiento = "advertencia";
          } else {
            estadoVencimiento = "vigente";
          }
        }
      } catch (error) {
        console.error("Error al calcular el estado de vencimiento:", error);
        estadoVencimiento = "error";
      }

      // Crear objeto plano con todas las propiedades accesibles en el primer nivel
      return {
        ...licencia,
        // Añadir propiedades planas
        nombre_empleado: licencia.empleado?.nombre || "",
        apellido_empleado: licencia.empleado?.apellido || "",
        documento_empleado: licencia.empleado?.documento || "",
        cargo_empleado: licencia.empleado?.cargo || "",
        // Añadir propiedades calculadas
        estado_vencimiento: estadoVencimiento,
        numero_licencia: licencia.licencia_id?.toString() || "",
        // Mantener las propiedades anidadas para el resto de la UI
        empleado: licencia.empleado,
      };
    });
  }, [filteredLicencias]); // Define las claves buscables para optimizar la búsqueda
  const searchableKeys = useMemo<SearchableKey[]>(
    () => [
      "nombre_empleado", // Nombre del empleado
      "apellido_empleado", // Apellido del empleado
      "documento_empleado", // Documento del empleado (DNI)
    ],
    []
  );

  if (loading && licencias.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contenido principal */}
      <Card className="w-full shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                <div className="flex items-center">
                  <Car className="mr-2 h-6 w-6" />
                  Licencias de Conducir
                </div>
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Listado completo de licencias de conducir registradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs
            defaultValue="todos"
            value={activeTab}
            onValueChange={handleTabChange}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="todos">Todas</TabsTrigger>
              <TabsTrigger value="por-vencer">Por vencer</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="rounded-md border">
            <ListadoTabla
              title=""
              data={enhancedLicencias}
              itemsPerPage={itemsPerPage}
              searchableKeys={searchableKeys}
              searchPlaceholder="Buscar por nombre, apellido o DNI... (presiona Enter)"
              remotePagination
              totalItems={total}
              currentPage={page}
              onPageChange={handlePageChange}
              onSearchChange={handleSearchChange}
              columns={[
                { title: "Empleado", key: "empleado" },
                { title: "Categoría", key: "categoria" },
                { title: "Fechas", key: "fechas" },
                { title: "Estado", key: "estado" },
              ]}
              renderRow={(licencia) => (
                <>
                  <TableCell className="min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <div className="font-medium">
                          {licencia.empleado?.nombre}{" "}
                          {licencia.empleado?.apellido}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {licencia.empleado?.documento}
                        </div>
                        {licencia.empleado?.cargo && (
                          <div className="text-xs text-muted-foreground">
                            {licencia.empleado?.cargo}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="min-w-[180px]">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium">
                        <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        {getCategoriaLabel(licencia.categoria)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="min-w-[180px]">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <span>
                          Expedición: {formatDate(licencia.fecha_expedicion)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                        <span>
                          Vencimiento: {formatDate(licencia.fecha_vencimiento)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {licencia.fecha_vencimiento && (
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={
                            getStatusInfo(new Date(licencia.fecha_vencimiento))
                              .variant
                          }
                        >
                          <div className="flex items-center gap-1">
                            {
                              getStatusInfo(
                                new Date(licencia.fecha_vencimiento)
                              ).icon
                            }
                            {
                              getStatusInfo(
                                new Date(licencia.fecha_vencimiento)
                              ).text
                            }
                          </div>
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {differenceInDays(
                            new Date(licencia.fecha_vencimiento),
                            new Date()
                          ) < 0
                            ? `Vencida hace ${Math.abs(
                                differenceInDays(
                                  new Date(licencia.fecha_vencimiento),
                                  new Date()
                                )
                              )} días`
                            : `Vence en ${differenceInDays(
                                new Date(licencia.fecha_vencimiento),
                                new Date()
                              )} días`}
                        </div>
                      </div>
                    )}
                  </TableCell>
                </>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
