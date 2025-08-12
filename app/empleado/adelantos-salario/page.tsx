import { Metadata } from 'next';
import CreateAdvanceForm from '@/components/sections/salary-advances/CreateAdvanceForm';

export const metadata: Metadata = {
  title: 'Mis Adelantos de Salario | MVA',
  description: 'Solicita y revisa el estado de tus adelantos de salario',
};

export default function EmployeeAdvancesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <CreateAdvanceForm />
    </main>
  );
}
