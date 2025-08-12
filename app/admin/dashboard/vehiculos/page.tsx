import { redirect } from 'next/navigation';

// Redireccionar a la página de listado de vehículos
export default function VehiculosPage() {
  redirect('/admin/dashboard/vehiculos/listado');
}
