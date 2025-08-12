import { Metadata } from "next";
import SalaryAdvancesAdminPage from "@/components/pages/salaryAdvances/SalaryAdvancesAdminPage";

export const metadata: Metadata = {
  title: "Gestión de Adelantos | MVA Admin",
  description: "Administración y aprobación de adelantos de salario",
};

export default function AdminAdvancesPage() {
  return <SalaryAdvancesAdminPage />;
}
