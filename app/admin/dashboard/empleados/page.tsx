import { redirect } from 'next/navigation';

// Redireccionar a la página de listado de empleados
export default function EmpleadosPage() {
  redirect('/admin/dashboard/empleados/listado');
}
