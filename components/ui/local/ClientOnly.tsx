"use client";

import { useState, useEffect, ReactNode } from 'react';
import Loader from './Loader';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que renderiza sus hijos solo en el cliente, evitando problemas de hidratación
 * al garantizar que no hay renderizado en el servidor.
 */
export default function ClientOnly({ children, fallback = <Loader /> }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Solo mostramos el contenido del componente cuando estamos en el cliente
  // Esto previene problemas de hidratación al evitar el renderizado en el servidor
  if (!isClient) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        {fallback}
      </div>
    );
  }

  return <>{children}</>;
}
