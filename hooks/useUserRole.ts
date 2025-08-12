"use client";

import { useState, useEffect } from "react";
import { Role } from "@/types/userTypes";

interface User {
  userId: number;
  nombre: string;
  email: string;
  roles: Role[];
}

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener el usuario de las cookies del lado del cliente
    const getUserFromCookies = () => {
      try {
        // Obtener todas las cookies
        const cookies = document.cookie.split(';');
        const userCookie = cookies.find(cookie => 
          cookie.trim().startsWith('user=')
        );
        
        if (userCookie) {
          const userValue = userCookie.split('=')[1];
          const userData = JSON.parse(decodeURIComponent(userValue));
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al obtener el usuario de las cookies:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserFromCookies();
  }, []);

  const hasRole = (role: Role): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const isAdmin = (): boolean => {
    return hasRole(Role.ADMIN);
  };

  const isSupervisor = (): boolean => {
    return hasRole(Role.SUPERVISOR);
  };

  const isOperario = (): boolean => {
    return hasRole(Role.OPERARIO);
  };

  const canViewPrices = (): boolean => {
    // Solo los admin pueden ver precios
    return isAdmin();
  };

  const canCreateContractualConditions = (): boolean => {
    // Solo los admin pueden crear condiciones contractuales
    return isAdmin();
  };

  return {
    user,
    isLoading,
    hasRole,
    isAdmin,
    isSupervisor,
    isOperario,
    canViewPrices,
    canCreateContractualConditions,
  };
}
