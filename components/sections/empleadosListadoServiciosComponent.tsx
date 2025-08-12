"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleCalendar } from "@/components/ui/simple-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Search, ArrowUpDown, Loader } from "lucide-react";
import { User } from "./DashboardComponent";
import { getCookie } from "cookies-next";
import { getUserById } from "@/app/actions/users";
import { getCompletedServicesByEmployee } from "@/app/actions/empleados";
import { PaginationLocal } from "@/components/ui/local/PaginationLocal";
import { Servicio } from "@/types/serviceTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ServicioFormateado {
  id: string;
  cliente: string;
  tipo: string;
  fecha: Date;
  ubicacion: string;
  estado: "completado" | "cancelado" | "en proceso";
}

// Datos de ejemplo para desarrollo
const serviciosMock: ServicioFormateado[] = [
  // Estos datos se utilizarán solo si la API falla
];

const EmpleadosHistorialServiciosComponent = () => {
  // Estados
  const [servicios, setServicios] = useState<ServicioFormateado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState<Date | undefined>(undefined);
  const [ordenarPor, setOrdenarPor] = useState("fecha");
  const [ordenAscendente, setOrdenAscendente] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [empleadoId, setEmpleadoId] = useState(0);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Estado para el modal de detalles
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<ServicioFormateado | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false); // Obtener usuario desde cookie
  useEffect(() => {
    const userCookie = getCookie("user");

    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie as string);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error al parsear la cookie de usuario:", error);
        toast.error("Error de autenticación", {
          description: "No se pudo cargar la información del usuario",
        });
      }
    }
  }, []);
  // Obtener ID del empleado
  useEffect(() => {
    const obtenerEmpleado = async () => {
      try {
        const userId = user?.id || 0;
        if (userId === 0) return;

        setLoading(true);

        // Usar type assertion para tipar correctamente la respuesta
        const datosEmpleado = (await getUserById(userId)) as {
          empleadoId?: number;
        };

        if (datosEmpleado && typeof datosEmpleado.empleadoId === "number") {
          setEmpleadoId(datosEmpleado.empleadoId);
        } else {
          console.error(
            "No se encontró el ID del empleado o no es válido:",
            datosEmpleado
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

    obtenerEmpleado();
  }, [user?.id]);
  // Cargar servicios completados
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        if (empleadoId === 0) return;

        setLoading(true);
        // Definir la interface para la respuesta de la API
        interface ServicioResponse {
          data?: Servicio[];
          items?: Servicio[];
          totalItems?: number;
          total?: number;
        }

        // Tipar correctamente la respuesta
        const respuesta = (await getCompletedServicesByEmployee(
          empleadoId,
          paginaActual,
          itemsPorPagina
        )) as ServicioResponse;

        // Verificar que respuesta tenga la estructura adecuada
        if (respuesta && typeof respuesta === "object") {
          // Determinar qué propiedad contiene los datos (data o items)
          const serviciosData = respuesta.data || [];

          if (serviciosData.length > 0) {
            // Transformar datos al formato requerido
            const serviciosFormateados: ServicioFormateado[] =
              serviciosData.map((servicio: Servicio) => ({
                id: servicio.id ? servicio.id.toString() : "0",
                cliente: servicio.cliente?.nombre || "Cliente sin nombre",
                tipo: servicio.tipoServicio || "No especificado",
                fecha: new Date(
                  servicio.fechaProgramada ||
                    servicio.fechaCreacion ||
                    new Date()
                ),
                ubicacion: servicio.ubicacion || "No especificada",
                estado:
                  servicio.estado?.toLowerCase() === "completado"
                    ? "completado"
                    : servicio.estado?.toLowerCase() === "cancelado"
                    ? "cancelado"
                    : "en proceso",
              }));

            setServicios(serviciosFormateados);
            setTotalItems(respuesta.totalItems || serviciosFormateados.length);
          } else {
            console.warn("No se encontraron servicios para el empleado");
            // Fallback a datos de ejemplo
            setServicios(serviciosMock);
            setTotalItems(serviciosMock.length);
          }
        } else {
          console.error("Formato de respuesta no reconocido:", respuesta);
          toast.error("Error de formato", {
            description: "El formato de los datos recibidos no es válido",
          });
          setServicios(serviciosMock);
          setTotalItems(serviciosMock.length);
        }
      } catch (error) {
        console.error("Error al cargar los servicios del empleado:", error);
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los servicios del empleado",
        });
        // Usar datos de ejemplo en caso de error
        setServicios(serviciosMock);
        setTotalItems(serviciosMock.length);
      } finally {
        setLoading(false);
      }
    };

    cargarServicios();
  }, [empleadoId, paginaActual, itemsPorPagina]);

  // Filtrar y ordenar servicios
  const serviciosFiltrados = servicios
    .filter(
      (servicio) =>
        // Filtro de búsqueda
        (busqueda === "" ||
          servicio.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
          servicio.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
          servicio.id.toLowerCase().includes(busqueda.toLowerCase())) &&
        // Filtro por tipo
        (filtroTipo === "todos" || servicio.tipo === filtroTipo) &&
        // Filtro por fecha
        (!filtroFecha ||
          (servicio.fecha.getDate() === filtroFecha.getDate() &&
            servicio.fecha.getMonth() === filtroFecha.getMonth() &&
            servicio.fecha.getFullYear() === filtroFecha.getFullYear()))
    )
    .sort((a, b) => {
      const factorOrden = ordenAscendente ? 1 : -1;

      switch (ordenarPor) {
        case "fecha":
          return factorOrden * (a.fecha.getTime() - b.fecha.getTime());
        case "cliente":
          return factorOrden * a.cliente.localeCompare(b.cliente);
        default:
          return 0;
      }
    });

  // Cambiar página
  const cambiarPagina = (pagina: number) => {
    setPaginaActual(pagina);
  };

  // Función para abrir el modal con el servicio seleccionado
  const abrirDetallesServicio = (servicio: ServicioFormateado) => {
    setServicioSeleccionado(servicio);
    setModalAbierto(true);
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="w-full h-64 flex justify-center items-center">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 m-4">
      {/* Cabecera de bienvenida */}
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
            Volver
          </Button>
        </div>
      </div>

      {/* Tarjeta principal */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historial de Servicios</CardTitle>
          <CardDescription>
            Todos los servicios completados por el empleado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, tipo o ID... (filtro en tiempo real)"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los servicios</SelectItem>
                    <SelectItem value="INSTALACION">Instalación</SelectItem>
                    <SelectItem value="RETIRO">Retiro</SelectItem>
                    <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                    <SelectItem value="REPARACION">Reparación</SelectItem>
                    <SelectItem value="LIMPIEZA">Limpieza</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[180px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtroFecha ? (
                        format(filtroFecha, "PPP", { locale: es })
                      ) : (
                        <span>Filtrar por fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <SimpleCalendar
                      mode="single"
                      selected={filtroFecha}
                      onSelect={setFiltroFecha}
                    />
                    {filtroFecha && (
                      <div className="p-2 border-t flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiltroFecha(undefined)}
                        >
                          Limpiar fecha
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tabla de servicios */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (ordenarPor === "cliente") {
                            setOrdenAscendente(!ordenAscendente);
                          } else {
                            setOrdenarPor("cliente");
                            setOrdenAscendente(true);
                          }
                        }}
                        className="flex items-center hover:bg-transparent px-0"
                      >
                        Cliente
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (ordenarPor === "fecha") {
                            setOrdenAscendente(!ordenAscendente);
                          } else {
                            setOrdenarPor("fecha");
                            setOrdenAscendente(true);
                          }
                        }}
                        className="flex items-center hover:bg-transparent px-0"
                      >
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviciosFiltrados.length > 0 ? (
                    serviciosFiltrados.map((servicio) => (
                      <TableRow
                        key={servicio.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => abrirDetallesServicio(servicio)}
                      >
                        <TableCell className="font-medium">
                          {servicio.id}
                        </TableCell>
                        <TableCell>{servicio.cliente}</TableCell>
                        <TableCell>{servicio.tipo}</TableCell>
                        <TableCell>
                          {format(servicio.fecha, "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{servicio.ubicacion}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              servicio.estado === "completado"
                                ? "bg-green-100 text-green-800"
                                : servicio.estado === "cancelado"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            } hover:bg-opacity-90`}
                          >
                            {servicio.estado === "completado"
                              ? "Completado"
                              : servicio.estado === "cancelado"
                              ? "Cancelado"
                              : "En proceso"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No se encontraron servicios que coincidan con los
                        filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalItems > itemsPorPagina && (
              <div className="mt-4 flex justify-center">
                <PaginationLocal
                  total={Math.ceil(totalItems / itemsPorPagina)}
                  currentPage={paginaActual}
                  onChangePage={cambiarPagina}
                />
              </div>
            )}

            {/* Resumen */}
            <div className="mt-4 flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de servicios:{" "}
                  <span className="font-medium">
                    {serviciosFiltrados.length}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del servicio */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Servicio</DialogTitle>
            <DialogDescription>
              Información completa del servicio seleccionado
            </DialogDescription>
          </DialogHeader>

          {servicioSeleccionado && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    ID de Servicio
                  </h4>
                  <p className="text-base font-semibold">
                    {servicioSeleccionado.id}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Estado
                  </h4>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      servicioSeleccionado.estado === "completado"
                        ? "bg-green-100 text-green-800"
                        : servicioSeleccionado.estado === "cancelado"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {servicioSeleccionado.estado === "completado"
                      ? "Completado"
                      : servicioSeleccionado.estado === "cancelado"
                      ? "Cancelado"
                      : "En proceso"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Cliente
                </h4>
                <p className="text-base">{servicioSeleccionado.cliente}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Tipo de Servicio
                  </h4>
                  <p className="text-base">{servicioSeleccionado.tipo}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Fecha
                  </h4>
                  <p className="text-base">
                    {format(servicioSeleccionado.fecha, "PPP', a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Ubicación
                </h4>
                <p className="text-base">{servicioSeleccionado.ubicacion}</p>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setModalAbierto(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpleadosHistorialServiciosComponent;
