"use client";

import { ReactNode, useEffect, useState } from 'react';
import Loader from './Loader';

interface ClientTallesWrapperProps {
  children: ReactNode;
}

/**
 * Componente cliente que envuelve el contenido y previene problemas de hidratación
 * asegurando que el renderizado solo ocurra en el cliente.
 */
export function ClientTallesWrapper({ children }: ClientTallesWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
