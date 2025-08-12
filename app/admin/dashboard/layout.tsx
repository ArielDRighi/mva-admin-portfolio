import React from "react";

// Forzar renderizado dinámico en todas las páginas del dashboard
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
