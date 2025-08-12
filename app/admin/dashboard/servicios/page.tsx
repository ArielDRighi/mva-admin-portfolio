import { redirect } from 'next/navigation';

// Redireccionar a la página de listado de servicios
export default function ServiciosPage() {
  redirect('/admin/dashboard/servicios/listado');
}
