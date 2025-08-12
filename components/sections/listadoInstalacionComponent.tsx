"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import { deleteService, getServices } from "@/app/actions/services";
import { getSanitarios } from "@/app/actions/sanitarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  FileText,
  MapPin,
  Trash2,
  Truck,
  User,
  Users,
  Bath,
} from "lucide-react";

// Define interfaces for type safety
interface Cliente {
  clienteId: number;
  nombre: string;
  email: string;
  cuit: string;
  direccion: string;
  telefono: string;
  contacto_principal: string;
  estado: string;
}

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  estado: string;
}

interface Vehiculo {
  id: number;
  numeroInterno: string;
  placa: string;
  marca: string;
  modelo: string;
  estado: string;
}

interface Bano {
  baño_id: number;
  codigo_interno: string;
  modelo: string;
  estado: string;
}

interface Asignacion {
  id: number;
  servicioId: number;
  empleadoId?: number;
  empleado?: Empleado;
  vehiculoId?: number;
  vehiculo?: Vehiculo;
  banoId?: number;
  bano?: Bano;
  rolEmpleado?: string | null;
  fechaAsignacion: string;
}

interface Servicio {
  id: number;
  clienteId: number | null;
  cliente: Cliente | null;
  fechaProgramada: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  tipoServicio: string;
  estado: string;
  cantidadBanos: number;
  cantidadEmpleados: number;
  cantidadVehiculos: number;
  ubicacion: string;
  notas: string;
  asignacionAutomatica: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  banosInstalados: any[];
  condicionContractualId: number | null;
  fechaFinAsignacion: string | null;
  fechaCreacion: string;
  comentarioIncompleto: string | null;
  asignaciones: Asignacion[];
}

interface ServiciosResponse {
  data?: Servicio[];
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
}

export function ListadoServiciosComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // States
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [tipoServicioFilter, setTipoServicioFilter] = useState<string>("todos");
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [banosCompletos, setBanosCompletos] = useState<any[]>([]);
  console.log("Servicios:", servicios); // Load data
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setLoading(true);
        const search = searchParams.get("search") || "";
        const tipoServicio = searchParams.get("tipo") || "";

        // Determinar qué valor enviar como search basado en el filtro de tipo
        let searchParam = search;
        if (tipoServicio && tipoServicio !== "todos") {
          searchParam = tipoServicio.toUpperCase();
        }
        const response: any = await getServices(1, 10, searchParam);

        // Si la respuesta es un array directamente (sin paginación del backend)
        if (Array.isArray(response)) {
          setServicios(response);
          setTotalItems(response.length);
          setCurrentPage(Number(searchParams.get("page")) || 1);
        }
        // Si la respuesta tiene estructura de paginación
        else if (response && response.data && Array.isArray(response.data)) {
          setServicios(response.data);
          setTotalItems(response.totalItems || response.data.length);
          setCurrentPage(
            response.currentPage || Number(searchParams.get("page")) || 1
          );
        }
        // Si la respuesta es un objeto plano con los servicios
        else if (response && typeof response === "object") {
          // Intentar extraer servicios del objeto
          const serviciosArray =
            Object.values(response).find((val: any) => Array.isArray(val)) ||
            [];
          setServicios(serviciosArray as Servicio[]);
          setTotalItems(serviciosArray.length);
          setCurrentPage(Number(searchParams.get("page")) || 1);
        } else {
          console.error("Unexpected response format:", response);
          setServicios([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching servicios:", error);
        setServicios([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchServicios();
  }, [searchParams]); // Handle search
  const handleSearch = (value: string) => {
    setCurrentPage(1); // Reset to first page
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  // Handle service type filter
  const handleTipoServicioChange = (tipo: string) => {
    setTipoServicioFilter(tipo);
    setCurrentPage(1); // Reset to first page
    const params = new URLSearchParams(searchParams);
    if (tipo && tipo !== "todos") {
      params.set("tipo", tipo);
    } else {
      params.delete("tipo");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to first page
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    return format(new Date(dateString), "HH:mm", { locale: es });
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "PROGRAMADO":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "EN_PROGRESO":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "COMPLETADO":
        return "bg-green-100 text-green-800 border-green-300";
      case "CANCELADO":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }; // Filter services based on the active tab
  const filteredServicios = servicios.filter(
    (servicio) =>
      activeTab === "todos" ||
      servicio.estado.toUpperCase() === activeTab.toUpperCase()
  );

  // Client-side pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServicios = filteredServicios.slice(startIndex, endIndex);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <h1 className="text-2xl font-bold">Listado de Servicios</h1>
        <p className="text-gray-500">
          Consulta y gestiona todos los servicios de instalación y limpieza.
        </p>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Servicios</CardTitle>{" "}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
                <Input
                  placeholder="Buscar por cliente, ubicación... (presiona Enter)"
                  value={searchTerm}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="flex-1 min-w-0"
                />
                <Button type="submit" className="shrink-0">Buscar</Button>
              </form>
            </div>
            <div className="mt-4 space-y-3">
              {/* Filtros en contenedor responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Filtro por tipo de servicio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Servicio:</label>
                  <Tabs
                    value={tipoServicioFilter}
                    onValueChange={handleTipoServicioChange}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full h-auto p-1 bg-gray-100 rounded-lg gap-1">
                      <TabsTrigger 
                        value="todos" 
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Todos
                      </TabsTrigger>
                      <TabsTrigger 
                        value="instalacion" 
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Instalación
                      </TabsTrigger>
                      <TabsTrigger 
                        value="limpieza" 
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Limpieza
                      </TabsTrigger>
                      <TabsTrigger 
                        value="retiro" 
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Retiro
                      </TabsTrigger>
                      <TabsTrigger 
                        value="capacitacion" 
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm col-span-2 sm:col-span-1"
                      >
                        Capacitación
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {/* Filtro por estado */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Estado:</label>
                  <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-gray-100 rounded-lg">
                      <TabsTrigger 
                        value="todos" 
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Todos
                      </TabsTrigger>
                      <TabsTrigger
                        value="programado"
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Programados
                      </TabsTrigger>
                      <TabsTrigger
                        value="en_progreso"
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        En Progreso
                      </TabsTrigger>
                      <TabsTrigger
                        value="completado"
                        className="text-xs py-1.5 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Completados
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                Cargando servicios...
              </div>
            ) : paginatedServicios.length === 0 ? (
              <div className="flex justify-center p-4">
                No hay servicios disponibles
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 min-w-[60px]">ID</TableHead>
                        <TableHead className="w-24 min-w-[100px]">Tipo</TableHead>
                        <TableHead className="w-32 min-w-[150px]">Cliente</TableHead>
                        <TableHead className="w-32 min-w-[150px]">Fecha Programada</TableHead>
                        <TableHead className="w-24 min-w-[100px]">Estado</TableHead>
                        <TableHead className="w-32 min-w-[150px] hidden sm:table-cell">Ubicación</TableHead>
                        <TableHead className="w-24 min-w-[100px] hidden md:table-cell">Recursos</TableHead>
                        <TableHead className="w-32 min-w-[120px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {paginatedServicios.map((servicio: Servicio) => (
                      <TableRow key={servicio.id}>
                        <TableCell className="font-medium">
                          {servicio.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {servicio.tipoServicio}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span>
                              {servicio.cliente?.nombre ||
                                "Cliente no especificado"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{formatDate(servicio.fechaProgramada)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeStyle(servicio.estado)}
                          >
                            {servicio.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">
                              {servicio.ubicacion}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{servicio.cantidadBanos} baños</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setSelectedServicio(servicio);
                                setIsDetailsModalOpen(true);
                                
                                // Cargar datos completos de los baños si hay banosInstalados
                                if (servicio.banosInstalados && servicio.banosInstalados.length > 0) {
                                  try {
                                    console.log('Cargando datos completos para los baños:', servicio.banosInstalados);
                                    console.log('Tipo de servicio:', servicio.tipoServicio);
                                    
                                    // Para servicios de LIMPIEZA, los banosInstalados contienen códigos internos (strings)
                                    // Para otros servicios, pueden contener IDs (números)
                                    const containsOnlyNumbers = servicio.banosInstalados.every(
                                      (bano: any) => typeof bano === 'number'
                                    );
                                    
                                    const containsOnlyStrings = servicio.banosInstalados.every(
                                      (bano: any) => typeof bano === 'string'
                                    );
                                    
                                    if (containsOnlyNumbers || containsOnlyStrings) {
                                      // Obtener todos los sanitarios
                                      const sanitariosResponse = await getSanitarios() as any;
                                      let allSanitarios: any[] = [];
                                      
                                      // Manejar diferentes formatos de respuesta
                                      if (Array.isArray(sanitariosResponse)) {
                                        allSanitarios = sanitariosResponse;
                                      } else if (sanitariosResponse?.items) {
                                        allSanitarios = sanitariosResponse.items;
                                      } else if (sanitariosResponse?.data) {
                                        allSanitarios = sanitariosResponse.data;
                                      }
                                      
                                      console.log('Todos los sanitarios obtenidos:', allSanitarios);
                                      console.log('Primer sanitario estructura:', allSanitarios[0]);
                                      console.log('Total sanitarios encontrados:', allSanitarios.length);
                                      console.log('ContainsOnlyStrings:', containsOnlyStrings);
                                      console.log('Es servicio de LIMPIEZA:', servicio.tipoServicio === 'LIMPIEZA');
                                      
                                      // Filtrar solo los baños que están en banosInstalados
                                      const banosDelServicio = allSanitarios.filter((sanitario: any) => {
                                        // Obtener ID y código interno del sanitario
                                        const sanitarioId = sanitario.baño_id || sanitario.id || sanitario.banoId;
                                        const sanitarioCodigoInterno = sanitario.codigo_interno;
                                        
                                        console.log(`Procesando sanitario: ID=${sanitarioId}, codigo_interno="${sanitarioCodigoInterno}", modelo="${sanitario.modelo}"`);
                                        
                                        // Verificar si coincide con algún elemento en banosInstalados
                                        const isMatch = servicio.banosInstalados.some((banoItem: any) => {
                                          console.log(`  Comparando banoItem="${banoItem}" (tipo: ${typeof banoItem})`);
                                          
                                          if (containsOnlyStrings && servicio.tipoServicio === 'LIMPIEZA') {
                                            // Para servicios de LIMPIEZA, aunque sean strings, parecen ser IDs convertidos a string
                                            // Intentemos comparar tanto por código interno como por ID
                                            const matchPorCodigo = String(banoItem) === String(sanitarioCodigoInterno);
                                            const matchPorId = String(banoItem) === String(sanitarioId);
                                            const match = matchPorCodigo || matchPorId;
                                            
                                            console.log(`    Comparación por código interno: "${banoItem}" === "${sanitarioCodigoInterno}" = ${matchPorCodigo}`);
                                            console.log(`    Comparación por ID: "${banoItem}" === "${sanitarioId}" = ${matchPorId}`);
                                            console.log(`    Match final: ${match}`);
                                            
                                            return match;
                                          } else {
                                            // Para otros servicios, comparar por ID
                                            const match = String(banoItem) === String(sanitarioId);
                                            console.log(`    Comparación por ID: "${banoItem}" === "${sanitarioId}" = ${match}`);
                                            return match;
                                          }
                                        });
                                        
                                        console.log(`  Resultado final para sanitario ${sanitarioId}: ${isMatch}`);
                                        return isMatch;
                                      });
                                      
                                      console.log('Baños encontrados:', banosDelServicio);
                                      setBanosCompletos(banosDelServicio);
                                    } else {
                                      // Si ya son objetos completos, usarlos directamente
                                      setBanosCompletos(servicio.banosInstalados);
                                    }
                                  } catch (error) {
                                    console.error('Error al cargar datos de baños:', error);
                                    setBanosCompletos([]);
                                  }
                                } else {
                                  setBanosCompletos([]);
                                }
                              }}
                            >
                              Ver
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedServicio(servicio);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {filteredServicios.length > itemsPerPage && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Details Modal */}
      {selectedServicio && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalles del Servicio</DialogTitle>
              <DialogDescription>
                ID: {selectedServicio.id} | Tipo:{" "}
                {selectedServicio.tipoServicio} | Creado:{" "}
                {formatDate(selectedServicio.fechaCreacion)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Cliente
                  </h3>
                  <p className="text-lg font-semibold">
                    {selectedServicio.cliente?.nombre || "No especificado"}
                  </p>
                  {selectedServicio.cliente && (
                    <div className="mt-1 text-sm">
                      <p className="flex items-center gap-1">
                        <span>CUIT:</span>
                        <span className="text-muted-foreground">
                          {selectedServicio.cliente.cuit}
                        </span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span>Contacto:</span>
                        <span className="text-muted-foreground">
                          {selectedServicio.cliente.contacto_principal}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Fechas
                  </h3>
                  <div className="mt-1 space-y-1">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      <span>
                        Programada:{" "}
                        {formatDate(selectedServicio.fechaProgramada)}{" "}
                        {formatTime(selectedServicio.fechaProgramada)}
                      </span>
                    </p>
                    {selectedServicio.fechaInicio && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-green-500" />
                        <span>
                          Inicio: {formatDate(selectedServicio.fechaInicio)}
                        </span>
                      </p>
                    )}
                    {selectedServicio.fechaFin && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-red-500" />
                        <span>
                          Fin: {formatDate(selectedServicio.fechaFin)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ubicación
                  </h3>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{selectedServicio.ubicacion}</span>
                  </p>
                </div>

                {selectedServicio.notas && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Notas
                    </h3>
                    <p className="mt-1 text-sm border rounded-md p-3 bg-muted/30">
                      {selectedServicio.notas}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Recursos
                  </h3>
                  <div className="mt-1 space-y-2">
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Baños: {selectedServicio.cantidadBanos}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span>
                        Empleados: {selectedServicio.cantidadEmpleados}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-500" />
                      <span>
                        Vehículos: {selectedServicio.cantidadVehiculos}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Estado
                  </h3>
                  <div className="mt-1">
                    <Badge
                      className={getStatusBadgeStyle(selectedServicio.estado)}
                    >
                      {selectedServicio.estado}
                    </Badge>
                    <p className="mt-1 text-sm">
                      Asignación:{" "}
                      {selectedServicio.asignacionAutomatica
                        ? "Automática"
                        : "Manual"}
                    </p>
                  </div>
                </div>

                {selectedServicio.asignaciones &&
                  selectedServicio.asignaciones.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Asignaciones
                      </h3>
                      <div className="mt-2 space-y-3">
                        {/* Empleados asignados */}
                        {selectedServicio.asignaciones
                          .filter((asig: Asignacion) => asig.empleado)
                          .map((asig: Asignacion) => (
                            <div
                              key={`emp-${asig.id}`}
                              className="flex items-center gap-2 p-2 rounded-md bg-slate-50"
                            >
                              <User className="h-4 w-4 text-blue-500" />
                              <span>
                                {asig.empleado?.nombre}{" "}
                                {asig.empleado?.apellido}
                                {asig.rolEmpleado && (
                                  <Badge 
                                    variant="outline" 
                                    className={`ml-2 ${asig.rolEmpleado === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                                  >
                                    Rol {asig.rolEmpleado}
                                  </Badge>
                                )}
                              </span>
                            </div>
                          ))}

                        {/* Vehículos asignados */}
                        {selectedServicio.asignaciones
                          .filter((asig: Asignacion) => asig.vehiculo)
                          .map((asig: Asignacion) => (
                            <div
                              key={`veh-${asig.id}`}
                              className="flex items-center gap-2 p-2 rounded-md bg-slate-50"
                            >
                              <Truck className="h-4 w-4 text-green-500" />
                              <span>
                                {asig.vehiculo?.marca} {asig.vehiculo?.modelo} (
                                {asig.vehiculo?.placa})
                              </span>
                            </div>
                          ))}

                        {/* Baños asignados desde asignaciones (para servicios de instalación) */}
                        {selectedServicio.tipoServicio !== 'LIMPIEZA' && selectedServicio.tipoServicio !== 'RETIRO' && selectedServicio.asignaciones
                          .filter((asig: Asignacion) => asig.bano)
                          .map((asig: Asignacion) => (
                            <div
                              key={`ban-${asig.id}`}
                              className="flex items-center gap-2 p-2 rounded-md bg-slate-50"
                            >
                              <FileText className="h-4 w-4 text-purple-500" />
                              <span>
                                Baño #{asig.bano?.codigo_interno} (Modelo:{" "}
                                {asig.bano?.modelo})
                              </span>
                            </div>
                          ))}

                        {                        /* 
                          Baños instalados para servicios de LIMPIEZA y RETIRO:
                          - Para servicios de LIMPIEZA, el backend automáticamente asigna los baños 
                            del último servicio de INSTALACIÓN del cliente si no se especificaron baños
                          - Para servicios de RETIRO, los baños instalados son los que se van a retirar
                          - Los códigos internos se guardan en el array banosInstalados como strings
                          - Para LIMPIEZA solo mostramos el código interno sin modelo ni badge
                          - Para RETIRO mostramos el código interno con badge de "Para Retiro"
                        */}
                        {banosCompletos && banosCompletos.length > 0 ? (
                          // Mostrar baños con datos completos
                          banosCompletos.map((bano: any, index: number) => (
                            <div
                              key={`completo-${bano.baño_id || bano.id || index}`}
                              className={`flex items-center gap-2 p-2 rounded-md ${
                                selectedServicio?.tipoServicio === 'RETIRO' 
                                  ? 'bg-red-50' 
                                  : 'bg-blue-50'
                              }`}
                            >
                              <Bath className={`h-4 w-4 ${
                                selectedServicio?.tipoServicio === 'RETIRO' 
                                  ? 'text-red-500' 
                                  : 'text-blue-500'
                              }`} />
                              <span>
                                {selectedServicio?.tipoServicio === 'LIMPIEZA' ? (
                                  // Para servicios de LIMPIEZA, solo mostrar el código interno
                                  `Baño #${bano.codigo_interno || bano.baño_id || bano.id}`
                                ) : selectedServicio?.tipoServicio === 'RETIRO' ? (
                                  // Para servicios de RETIRO, mostrar con identificación especial
                                  `Baño #${bano.codigo_interno || bano.baño_id || bano.id} (Para Retiro)`
                                ) : (
                                  // Para otros servicios, mostrar información completa
                                  `Baño #${bano.codigo_interno || bano.baño_id || bano.id} (Modelo: ${bano.modelo || 'No especificado'})`
                                )}
                              </span>
                            </div>
                          ))
                        ) : (
                          // Fallback: mostrar baños instalados básicos para servicios de limpieza
                          selectedServicio.banosInstalados && 
                          selectedServicio.banosInstalados.length > 0 && 
                          selectedServicio.banosInstalados.map((banoCodigoInterno: any, index: number) => {
                            // Log para debugging - ver qué estructura tienen los datos
                            console.log('Código interno del baño instalado (fallback):', banoCodigoInterno);
                            
                            // Si es un string (código interno), intentar buscar información completa
                            if (typeof banoCodigoInterno === 'string') {
                              // Buscar el baño completo en banosCompletos por código interno
                              const banoCompleto = banosCompletos.find((bano: any) => 
                                String(bano.codigo_interno) === String(banoCodigoInterno)
                              );
                              
                              const modelo = banoCompleto?.modelo || 'No especificado';
                              
                              return (
                                <div
                                  key={`instalado-string-${banoCodigoInterno}`}
                                  className={`flex items-center gap-2 p-2 rounded-md ${
                                    selectedServicio.tipoServicio === 'RETIRO' 
                                      ? 'bg-red-50' 
                                      : 'bg-blue-50'
                                  }`}
                                >
                                  <Bath className={`h-4 w-4 ${
                                    selectedServicio.tipoServicio === 'RETIRO' 
                                      ? 'text-red-500' 
                                      : 'text-blue-500'
                                  }`} />
                                  <span>
                                    Baño #{banoCodigoInterno} (Modelo: {modelo})
                                    {selectedServicio.tipoServicio === 'LIMPIEZA' && (
                                      <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                                        Para Limpieza
                                      </Badge>
                                    )}
                                    {selectedServicio.tipoServicio === 'RETIRO' && (
                                      <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                                        Para Retiro
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                              );
                            }
                            
                            // Si es solo un número (ID), mostrarlo directamente
                            if (typeof banoCodigoInterno === 'number') {
                              return (
                                <div
                                  key={`instalado-${banoCodigoInterno}`}
                                  className={`flex items-center gap-2 p-2 rounded-md ${
                                    selectedServicio.tipoServicio === 'RETIRO' 
                                      ? 'bg-red-50' 
                                      : 'bg-blue-50'
                                  }`}
                                >
                                  <Bath className={`h-4 w-4 ${
                                    selectedServicio.tipoServicio === 'RETIRO' 
                                      ? 'text-red-500' 
                                      : 'text-blue-500'
                                  }`} />
                                  <span>
                                    Baño ID: {banoCodigoInterno}
                                    {selectedServicio.tipoServicio === 'LIMPIEZA' && (
                                      <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                                        Para Limpieza
                                      </Badge>
                                    )}
                                    {selectedServicio.tipoServicio === 'RETIRO' && (
                                      <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                                        Para Retiro
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                              );
                            }
                            
                            // Si es un objeto, intentar obtener los datos
                            const codigoInterno = banoCodigoInterno.codigo_interno || 
                                                banoCodigoInterno.codigoInterno || 
                                                banoCodigoInterno.sanitario?.codigo_interno ||
                                                banoCodigoInterno.sanitario?.codigoInterno ||
                                                banoCodigoInterno.Sanitario?.codigo_interno ||
                                                banoCodigoInterno.Sanitario?.codigoInterno ||
                                                banoCodigoInterno.baño_id ||
                                                banoCodigoInterno.bano_id ||
                                                banoCodigoInterno.id ||
                                                `Sin código`;
                            
                            const modelo = banoCodigoInterno.modelo || 
                                          banoCodigoInterno.sanitario?.modelo ||
                                          banoCodigoInterno.Sanitario?.modelo ||
                                          'Modelo no disponible';
                            
                            return (
                             <div
                               key={`instalado-${banoCodigoInterno.baño_id || banoCodigoInterno.id || index}`}
                               className={`flex items-center gap-2 p-2 rounded-md ${
                                 selectedServicio.tipoServicio === 'RETIRO' 
                                   ? 'bg-red-50' 
                                   : 'bg-blue-50'
                               }`}
                             >
                               <Bath className={`h-4 w-4 ${
                                 selectedServicio.tipoServicio === 'RETIRO' 
                                   ? 'text-red-500' 
                                   : 'text-blue-500'
                               }`} />
                               <span>
                                 Baño #{codigoInterno} (Modelo: {modelo})
                                 {selectedServicio.tipoServicio === 'LIMPIEZA' && (
                                   <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                                     Para Limpieza
                                   </Badge>
                                 )}
                                 {selectedServicio.tipoServicio === 'RETIRO' && (
                                   <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                                     Para Retiro
                                   </Badge>
                                 )}
                               </span>
                             </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setBanosCompletos([]);
                }}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}{" "}
      {/* Delete Confirmation Dialog */}
      {selectedServicio && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este servicio? Esta acción
                no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800 text-sm">
              <p>Tipo: {selectedServicio.tipoServicio}</p>
              <p>
                Cliente: {selectedServicio.cliente?.nombre || "No especificado"}
              </p>
              <p>Fecha: {formatDate(selectedServicio.fechaProgramada)}</p>
              <p>Estado: {selectedServicio.estado}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await deleteService(selectedServicio.id);

                    // Verificamos la respuesta
                    if (response && typeof response === "object") {
                      // Si la respuesta tiene un mensaje específico, lo usamos
                      const message =
                        "message" in response
                          ? (response.message as string)
                          : "";

                      // Actualizamos la lista local eliminando el elemento
                      setServicios(
                        servicios.filter(
                          (servicio: Servicio) =>
                            servicio.id !== selectedServicio.id
                        )
                      );

                      setIsDeleteDialogOpen(false);

                      toast.success("Servicio eliminado", {
                        description:
                          message ||
                          "El servicio ha sido eliminado correctamente",
                      });

                      // Actualizamos la página actual
                      const page = Number(searchParams.get("page")) || 1;
                      handlePageChange(page);
                    } else {
                      // Si no hay respuesta específica pero la operación fue exitosa
                      setServicios(
                        servicios.filter(
                          (servicio: Servicio) =>
                            servicio.id !== selectedServicio.id
                        )
                      );

                      setIsDeleteDialogOpen(false);

                      toast.success("Servicio eliminado", {
                        description:
                          "El servicio ha sido eliminado correctamente",
                      });
                    }
                  } catch (error) {
                    console.error("Error al eliminar el servicio:", error);

                    // Extraemos el mensaje de error si está disponible
                    let errorMessage =
                      "No se pudo eliminar el servicio. Intenta nuevamente.";

                    if (error instanceof Error) {
                      errorMessage = error.message;
                    } else if (
                      typeof error === "object" &&
                      error !== null &&
                      "message" in error
                    ) {
                      errorMessage = (error as { message: string }).message;
                    }

                    toast.error("Error al eliminar", {
                      description: errorMessage,
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
