"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        const userData = JSON.parse(userCookie as string);
        setUser(userData);
      }
    } catch (error) {
      console.error("Error parsing user cookie:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAdmin = user?.roles?.includes("admin") || false;
  const isSupervisor = user?.roles?.includes("supervisor") || false;
  const isOperario = user?.roles?.includes("operario") || false;

  return {
    user,
    loading,
    isAdmin,
    isSupervisor,
    isOperario,
    hasRole: (role: string) => user?.roles?.includes(role) || false,
  };
}
