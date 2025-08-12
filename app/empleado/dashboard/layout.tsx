import React from "react";

// Forzar renderizado dinámico en todas las páginas del dashboard de empleados
export const dynamic = 'force-dynamic';

export default function EmpleadoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
