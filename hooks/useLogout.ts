import { toast } from "sonner";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const router = useRouter();

  const handleLogoutClick = () => {
    try {
      deleteCookie("user");
      deleteCookie("token");

      router.push("/login");

      toast.success("Sesión finalizada", {
        description: "Ha cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión", {
        description:
          "No se pudo cerrar la sesión correctamente. Por favor intente nuevamente.",
      });
    }
  };

  return {
    handleLogoutClick,
  };
};
