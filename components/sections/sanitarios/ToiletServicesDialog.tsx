'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, User, Phone, MapPin, Mail, Loader2 } from 'lucide-react';
import { getToiletServices } from '@/app/actions/sanitarios';
import { toast } from 'sonner';

interface ToiletServicesDialogProps {
  toiletId: string;
  toiletName: string;
  children: React.ReactNode;
}

interface ServiceData {
  // IDs y datos básicos del servicio
  servicioId?: number;
  servicioid?: number;  // Campo real del backend
  id?: number;
  serviceId?: number;
  
  // Nombre y descripción del servicio
  servicioNombre?: string;
  tiposervicio?: string;  // Campo real del backend
  nombre?: string;
  name?: string;
  tipo?: string;
  tipo_servicio?: string;
  
  servicioDescripcion?: string | null;
  notasservicio?: string | null;  // Campo real del backend
  descripcion?: string | null;
  description?: string | null;
  
  // Fechas del servicio
  fechaInicio?: string;
  fechainicio?: string;  // Campo real del backend
  fecha_inicio?: string;
  fecha_programada?: string;
  fechaprogramada?: string;  // Campo real del backend
  startDate?: string;
  
  fechaFin?: string;
  fechafin?: string;  // Campo real del backend
  fecha_fin?: string;
  endDate?: string;
  
  // Estado del servicio
  estadoServicio?: string;
  estadoservicio?: string;  // Campo real del backend
  estado?: string;
  status?: string;
  
  // Datos del cliente
  clienteId?: number;
  clienteid?: number;  // Campo real del backend
  cliente_id?: number;
  clientId?: number;
  
  clienteNombre?: string | null;
  clientenombre?: string | null;  // Campo real del backend
  cliente_nombre?: string | null;
  clientName?: string | null;
  nombre_cliente?: string | null;
  
  clienteEmail?: string | null;
  clienteemail?: string | null;  // Campo real del backend
  cliente_email?: string | null;
  clientEmail?: string | null;
  email_cliente?: string | null;
  
  clienteTelefono?: string | null;
  clientetelefono?: string | null;  // Campo real del backend
  cliente_telefono?: string | null;
  clientPhone?: string | null;
  telefono_cliente?: string | null;
  
  clienteDireccion?: string | null;
  clientedireccion?: string | null;  // Campo real del backend
  cliente_direccion?: string | null;
  clientAddress?: string | null;
  direccion_cliente?: string | null;
  ubicacion?: string | null;
  ubicacionservicio?: string | null;  // Campo real del backend
}

export function ToiletServicesDialog({ toiletId, toiletName, children }: ToiletServicesDialogProps) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getToiletServices(Number(toiletId));
      console.log('🔍 Raw data from API:', data);
      console.log('🔍 Is data an array?', Array.isArray(data));
      console.log('🔍 Data type:', typeof data);
      
      if (data && Array.isArray(data)) {
        console.log('🔍 First service data:', data[0]);
        if (data[0]) {
          console.log('🔍 All available fields in first service:', Object.keys(data[0]));
          console.log('🔍 Sample field values:', {
            // Campos reales del backend (en minúsculas)
            tiposervicio: data[0].tiposervicio,
            notasservicio: data[0].notasservicio,
            fechainicio: data[0].fechainicio,
            fechafin: data[0].fechafin,
            fechaprogramada: data[0].fechaprogramada,
            estadoservicio: data[0].estadoservicio,
            clientenombre: data[0].clientenombre,
            clienteemail: data[0].clienteemail,
            clientetelefono: data[0].clientetelefono,
            clientedireccion: data[0].clientedireccion,
            ubicacionservicio: data[0].ubicacionservicio,
          });
          console.log('🔍 Mapped values test:', {
            serviceName: getServiceName(data[0]),
            serviceDescription: getServiceDescription(data[0]),
            startDate: getStartDate(data[0]),
            endDate: getEndDate(data[0]),
            status: getServiceStatus(data[0]),
            clientName: getClientName(data[0]),
            clientEmail: getClientEmail(data[0]),
            clientPhone: getClientPhone(data[0]),
            clientAddress: getClientAddress(data[0])
          });
        }
        setServices(data);
      } else if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as any).items)) {
        console.log('🔍 Data has items property, using data.items');
        const items = (data as any).items;
        console.log('🔍 First service data:', items[0]);
        if (items[0]) {
          console.log('🔍 All available fields in first service:', Object.keys(items[0]));
          console.log('🔍 Sample field values:', {
            // Campos reales del backend (en minúsculas)
            tiposervicio: items[0].tiposervicio,
            notasservicio: items[0].notasservicio,
            fechainicio: items[0].fechainicio,
            fechafin: items[0].fechafin,
            fechaprogramada: items[0].fechaprogramada,
            estadoservicio: items[0].estadoservicio,
            clientenombre: items[0].clientenombre,
            clienteemail: items[0].clienteemail,
            clientetelefono: items[0].clientetelefono,
            clientedireccion: items[0].clientedireccion,
            ubicacionservicio: items[0].ubicacionservicio,
          });
          console.log('🔍 Mapped values test:', {
            serviceName: getServiceName(items[0]),
            serviceDescription: getServiceDescription(items[0]),
            startDate: getStartDate(items[0]),
            endDate: getEndDate(items[0]),
            status: getServiceStatus(items[0]),
            clientName: getClientName(items[0]),
            clientEmail: getClientEmail(items[0]),
            clientPhone: getClientPhone(items[0]),
            clientAddress: getClientAddress(items[0])
          });
        }
        setServices(items);
      } else {
        console.log('🔍 Data format not recognized, setting empty array');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open, toiletId]);

  // Funciones auxiliares para mapear campos del backend
  const getServiceName = (service: ServiceData): string => {
    const tipo = service.tiposervicio || service.servicioNombre || service.nombre || service.name || service.tipo || service.tipo_servicio;
    if (tipo) {
      // Convertir el tipo de servicio a un nombre más amigable
      const tipoMap: Record<string, string> = {
        'INSTALACION': 'Servicio de Instalación',
        'LIMPIEZA': 'Servicio de Limpieza',
        'MANTENIMIENTO': 'Servicio de Mantenimiento',
        'CAPACITACION': 'Servicio de Capacitación',
        'ALQUILER': 'Servicio de Alquiler'
      };
      return tipoMap[tipo.toString().toUpperCase()] || `Servicio ${tipo}`;
    }
    return 'Servicio sin nombre';
  };

  const getServiceDescription = (service: ServiceData): string | null => {
    return service.notasservicio || service.servicioDescripcion || service.descripcion || service.description || null;
  };

  const getStartDate = (service: ServiceData): string => {
    return service.fechainicio || service.fechaInicio || service.fecha_inicio || service.fecha_programada || service.startDate || '';
  };

  const getEndDate = (service: ServiceData): string => {
    return service.fechafin || service.fechaFin || service.fecha_fin || service.endDate || '';
  };

  const getServiceStatus = (service: ServiceData): string => {
    return service.estadoservicio || service.estadoServicio || service.estado || service.status || 'PENDIENTE';
  };

  const getClientName = (service: ServiceData): string => {
    return service.clientenombre || service.clienteNombre || service.cliente_nombre || service.clientName || service.nombre_cliente || 'Sin nombre';
  };

  const getClientEmail = (service: ServiceData): string | null => {
    return service.clienteemail || service.clienteEmail || service.cliente_email || service.clientEmail || service.email_cliente || null;
  };

  const getClientPhone = (service: ServiceData): string | null => {
    return service.clientetelefono || service.clienteTelefono || service.cliente_telefono || service.clientPhone || service.telefono_cliente || null;
  };

  const getClientAddress = (service: ServiceData): string | null => {
    // Priorizar la dirección del cliente, pero si no está disponible, usar la ubicación del servicio
    const clientAddress = service.clientedireccion || service.clienteDireccion || service.cliente_direccion || service.clientAddress || service.direccion_cliente;
    const serviceLocation = service.ubicacionservicio || service.ubicacion;
    
    return clientAddress || serviceLocation || null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    
    try {
      // Intentar parsear la fecha directamente
      let date = new Date(dateString);
      
      // Si la fecha no es válida, intentar diferentes formatos
      if (isNaN(date.getTime())) {
        // Formato común del backend: YYYY-MM-DD
        if (dateString.includes('-') && dateString.length === 10) {
          const [year, month, day] = dateString.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        // Formato con timestamp: YYYY-MM-DD HH:mm:ss
        else if (dateString.includes(' ')) {
          date = new Date(dateString.replace(' ', 'T'));
        }
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return dateString; // Retornar el string original si no se puede parsear
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; label: string }> = {
      'ACTIVO': { variant: 'default', label: 'Activo' },
      'COMPLETADO': { variant: 'secondary', label: 'Completado' },
      'CANCELADO': { variant: 'destructive', label: 'Cancelado' },
      'PENDIENTE': { variant: 'outline', label: 'Pendiente' },
    };

    const statusInfo = statusMap[status] || { variant: 'outline', label: status };
    
    return (
      <Badge variant={statusInfo.variant as any}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Servicios Asignados - {toiletName}
          </DialogTitle>
          <DialogDescription>
            Lista de servicios a los que está asignado este baño químico
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Este baño no está asignado a ningún servicio actualmente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.servicioId || service.id || service.serviceId || Math.random()}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {getServiceName(service)}
                          </p>
                          {getServiceDescription(service) && getServiceDescription(service)!.trim() && (
                            <p className="text-sm text-muted-foreground">
                              {getServiceDescription(service)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {getClientName(service)}
                            </span>
                          </div>
                          {getClientAddress(service) && getClientAddress(service)!.trim() && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{getClientAddress(service)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getClientEmail(service) && getClientEmail(service)!.trim() && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{getClientEmail(service)}</span>
                            </div>
                          )}
                          {getClientPhone(service) && getClientPhone(service)!.trim() && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{getClientPhone(service)}</span>
                            </div>
                          )}
                          {(!getClientEmail(service) || !getClientEmail(service)!.trim()) && 
                           (!getClientPhone(service) || !getClientPhone(service)!.trim()) && (
                            <span className="text-sm text-muted-foreground">Sin contacto</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            <span className="font-medium">Inicio:</span>{' '}
                            {formatDate(getStartDate(service))}
                          </p>
                          <p>
                            <span className="font-medium">Fin:</span>{' '}
                            {formatDate(getEndDate(service))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(getServiceStatus(service))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
