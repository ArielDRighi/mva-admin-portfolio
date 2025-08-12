import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getEmployeeById } from "@/app/actions/empleados";
import { User } from "@/components/sections/DashboardComponent";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";

interface EmployeeData {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento: string;
  fecha_contratacion: string;
  cargo: string;
  estado: string;
  numero_legajo: string;
  cuil: string;
  cbu: string | null;
  diasVacacionesTotal: number;
  diasVacacionesRestantes: number;
  diasVacacionesUsados: number;
}

export const useEmployeeData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [employeeId, setEmployeeId] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userCookie = getCookie("user");

    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie as string);
        console.log("Parsed user from cookie:", parsedUser);
        setUser(parsedUser);

        // If user has empleadoId, set it directly
        if (parsedUser.empleadoId) {
          console.log(
            "Setting employeeId from user cookie:",
            parsedUser.empleadoId
          );
          setEmployeeId(parsedUser.empleadoId);
        }
      } catch (error) {
        console.error("Error al parsear el usuario:", error);
        toast.error("Error de sesión", {
          description:
            "No se pudo cargar la información del usuario. Por favor, intente iniciar sesión nuevamente.",
        });
        router.push("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        if (employeeId === 0) {
          return;
        }

        setLoading(true);

        const completeEmployeeData = await getEmployeeById(
          employeeId.toString()
        );

        if (completeEmployeeData) {
          setEmployeeData(completeEmployeeData as EmployeeData);
        } else {
          console.warn("No employee data returned from getEmployeeById");
          setEmployeeData(null);
        }
      } catch (error) {
        console.error("Error al obtener información del empleado:", error);
        toast.error("Error de datos", {
          description:
            error instanceof Error
              ? error.message
              : "No se pudo cargar la información del empleado. Por favor, refresque la página.",
        });
        setEmployeeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  return {
    user,
    employeeData,
    employeeId,
    loading,
    setUser,
    setEmployeeData,
    setEmployeeId,
    setLoading,
  };
};
