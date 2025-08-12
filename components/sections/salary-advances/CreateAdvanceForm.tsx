'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/local/FormField';
import { FormDialog } from '@/components/ui/local/FormDialog';
import { 
  AlertCircle, 
  DollarSign, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft 
} from 'lucide-react';
import { createAdvanceAction, getMyAdvancesAction } from '@/app/actions/salaryAdvanceActions';
import { SalaryAdvance } from '@/types/salaryAdvanceTypes';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

const advanceFormSchema = z.object({
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  reason: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500, 'El motivo no puede tener más de 500 caracteres'),
});

type AdvanceFormData = z.infer<typeof advanceFormSchema>;

export default function CreateAdvanceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);

  const form = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceFormSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  });

  const { handleSubmit, control, reset } = form;
  // Cargar adelantos existentes
  useEffect(() => {
    const fetchAdvances = async () => {
      try {
        setLoading(true);
        const response = await getMyAdvancesAction();
        
        if (Array.isArray(response)) {
          setAdvances(response);
        } else {
          console.error('Formato de respuesta no reconocido:', response);
          setAdvances([]);
        }
      } catch (error) {
        console.error('Error al cargar adelantos:', error);
        toast.error('Error', {
          description: error instanceof Error ? error.message : 'No se pudieron cargar los adelantos',
        });
        setAdvances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvances();
  }, []);

  const onSubmit = async (data: AdvanceFormData) => {
    try {
      setIsSubmitting(true);
      
      const result = await createAdvanceAction({
        amount: data.amount,
        reason: data.reason,
        status: 'pending',
      });

      // Si llegamos aquí, la acción fue exitosa
      toast.success('Solicitud de adelanto creada exitosamente');
      reset();
      setIsCreating(false);
        // Recargar la lista de adelantos
      const updatedAdvances = await getMyAdvancesAction();
      if (Array.isArray(updatedAdvances)) {
        setAdvances(updatedAdvances);
      }
      
    } catch (error) {
      console.error('Error creating advance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la solicitud';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClick = () => {
    reset({
      amount: 0,
      reason: '',
    });
    setIsCreating(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300">Rechazado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };
  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-right" richColors />

      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/empleado/dashboard" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mi Perfil
          </Link>
        </Button>
      </div>
      
      {/* Título principal */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 shadow-md my-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Mis Adelantos de Salario
            </h1>
            <p className="text-blue-100">
              Gestiona tus solicitudes de adelanto de salario
            </p>
          </div>
        </div>
      </div>      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">
              Adelantos de Salario
            </CardTitle>
            <CardDescription>
              Puedes solicitar adelantos de tu salario cuando lo necesites
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            disabled={loading}
            className="ml-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Solicitar Adelanto
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : advances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                No hay adelantos registrados
              </h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Aún no tienes solicitudes de adelanto de salario.
              </p>
              <Button onClick={handleCreateClick}>
                <UserPlus className="h-4 w-4 mr-2" />
                Solicitar Primer Adelanto
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monto</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span>${advance.amount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{advance.reason}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(advance.status)}
                          {getStatusBadge(advance.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(advance.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>      <FormDialog
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
          }
        }}
        title="Solicitar Adelanto"
        description="Completa el formulario para solicitar un adelanto de salario."
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Monto del Adelanto"
                name="amount"
                type="number"
                value={field.value?.toString() || ""}
                onChange={(value) => field.onChange(parseFloat(value) || 0)}
                error={fieldState.error?.message}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="reason"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Motivo del Adelanto"
                name="reason"
                value={field.value?.toString() || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Explique brevemente el motivo de su solicitud..."
                disabled={isSubmitting}
                isTextarea={true}
              />
            )}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El adelanto será descontado de su próximo salario</li>
                <li>Solo puede tener una solicitud pendiente a la vez</li>
                <li>La aprobación depende de la disponibilidad de fondos</li>
              </ul>
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
