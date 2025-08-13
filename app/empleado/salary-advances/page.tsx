import { Metadata } from "next";
import SalaryAdvancesEmpleadosPage from "@/components/pages/Dashboard-Empleados/SalaryAdvancesEmpleadosPage";

export const metadata: Metadata = {
  title: "Adelantos de Salario | AR Admin",
  description: "Gestión de adelantos de salario para empleados",
};

export default function SalaryAdvancesPage() {
  return <SalaryAdvancesEmpleadosPage />;
}
