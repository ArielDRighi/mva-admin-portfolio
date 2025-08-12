import { redirect } from 'next/navigation';

// Redireccionar a la página de listado de sanitarios
export default function SanitariosPage() {
  redirect('/admin/dashboard/sanitarios/listado');
}
