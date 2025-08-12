"use client";


import { ListadoTabla } from "@/components/ui/local/ListadoTabla";
import { Badge } from "@/components/ui/badge";
import { SalaryAdvance, CreateAdvanceDto } from "@/types/salaryAdvanceTypes";
import { TableCell } from "../ui/table";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getCookie } from "cookies-next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Loader from "../ui/local/Loader";
import React from "react";
import {
  Calendar,
  DollarSign,
  FileText,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMyAdvancesAction,
  createAdvanceAction,
  deleteAdvanceAction,
} from "@/app/actions/salaryAdvanceActions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const createAdvanceSchema = z.object({
  amount: z
    .coerce
    .number()
    .positive("El monto debe ser mayor que 0")
    .max(1000000, "El monto máximo permitido es 1.000.000"),
  reason: z
    .string()
    .min(10, "El motivo debe tener al menos 10 caracteres")
    .max(500, "El motivo no puede exceder los 500 caracteres"),
});

const ListadoSalaryAdvancesEmpleadosComponent = ({
  data,
}: {
  data: SalaryAdvance[];
}) => {

  const safeData = Array.isArray(data) ? data : [];

  const [advances, setAdvances] = useState<SalaryAdvance[]>(safeData);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvance | null>(null);

  const form = useForm<z.infer<typeof createAdvanceSchema>>({
    resolver: zodResolver(createAdvanceSchema),
    defaultValues: {
      amount: 0,
      reason: "",
    },
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchAdvances(value);
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleDeleteClick = (advance: SalaryAdvance) => {
    setSelectedAdvance(advance);
    setConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAdvance) return;

    try {
      setLoading(true);
      await deleteAdvanceAction(selectedAdvance.id);

      toast.success("Solicitud eliminada", {
        description: "La solicitud de adelanto salarial ha sido eliminada correctamente.",
        duration: 3000,
      });

      await fetchAdvances(activeTab);
    } catch (error) {
      console.error("Error al eliminar el adelanto:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      toast.error("Error al eliminar adelanto", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setConfirmDeleteDialogOpen(false);
      setSelectedAdvance(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof createAdvanceSchema>) => {
    try {
      setLoading(true);
      
      const advanceData: CreateAdvanceDto = {
        amount: values.amount,
        reason: values.reason,
      };

      await createAdvanceAction(advanceData);
      
      toast.success("Solicitud creada", {
        description: "La solicitud de adelanto salarial ha sido creada correctamente.",
        duration: 3000,
      });

      form.reset();
      setCreateDialogOpen(false);
      await fetchAdvances(activeTab);
    } catch (error) {
      console.error("Error al crear el adelanto:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      toast.error("Error al crear adelanto", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchAdvances = useCallback(async (status = "all") => {
    setLoading(true);

    try {
      // Obtener el token del usuario desde las cookies
      const userToken = getCookie("token") as string | undefined;
      
      // Pasar el token del usuario (o undefined si no hay token)
      const result = await getMyAdvancesAction(userToken);
      
      if (result) {
        // Filtrar por estado si es necesario
        const filteredAdvances = status === "all" 
          ? result 
          : result.filter(adv => adv.status === status);
          
        setAdvances(filteredAdvances);
      }
    } catch (error) {
      console.error("Error al cargar los adelantos:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      toast.error("Error al cargar adelantos salariales", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    } else {
      fetchAdvances(activeTab);
    }
  }, [fetchAdvances, isFirstLoad, activeTab]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading && !advances.length) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>
        );
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rechazado</Badge>;
      case "pending":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">Pendiente</Badge>
        );
      default:
        return <Badge className="bg-slate-500">Desconocido</Badge>;
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Mis Adelantos Salariales
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Gestiona tus solicitudes de adelantos salariales
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </div>

        <div className="mt-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="all" className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {advances.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No hay solicitudes de adelanto salarial {activeTab !== 'all' && `con estado ${activeTab}`}
            </p>
            <Button
              onClick={handleCreateClick}
              variant="outline"
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear nueva solicitud
            </Button>
          </div>
        ) : (
          <ListadoTabla
            data={advances}
            currentPage={1}
            itemsPerPage={advances.length}
            columns={[
              { title: "Fecha", key: "createdAt" },
              { title: "Monto", key: "amount" },
              { title: "Motivo", key: "reason" },
              { title: "Estado", key: "status" },
              { title: "Acciones", key: "actions" },
            ]}
            renderRow={(advance: SalaryAdvance) => (
              <React.Fragment key={advance.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {formatDate(advance.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                    {formatCurrency(advance.amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <FileText className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span title={advance.reason}>
                      {advance.reason.length > 30
                        ? advance.reason.substring(0, 30) + "..."
                        : advance.reason}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(advance.status)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {advance.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400"
                        onClick={() => handleDeleteClick(advance)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                    {advance.status === "approved" && (
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Aprobado el {advance.approvedAt ? formatDate(advance.approvedAt) : "N/A"}
                      </span>
                    )}
                    {advance.status === "rejected" && (
                      <span className="text-sm text-red-600 dark:text-red-400">
                        Rechazado
                      </span>
                    )}
                  </div>
                </TableCell>
              </React.Fragment>
            )}
          />
        )}
      </CardContent>

      {/* Diálogo para crear una nueva solicitud */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="[&>button]:cursor-pointer max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva solicitud de adelanto</DialogTitle>
            <DialogDescription>
              Completa el formulario para solicitar un adelanto salarial.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4 text-muted-foreground absolute ml-2" />
                        <Input
                          placeholder="0,00"
                          type="number"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Ingresa el monto que necesitas solicitar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explica brevemente por qué necesitas este adelanto..."
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detalla el motivo de tu solicitud (mínimo 10 caracteres)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center">
                      <Loader className="mr-2 h-4 w-4" /> Procesando...
                    </div>
                  ) : (
                    "Solicitar Adelanto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="[&>button]:cursor-pointer max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar solicitud de adelanto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar esta solicitud de adelanto salarial?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdvance && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">Fecha:</p>
                  <p className="text-sm">{formatDate(selectedAdvance.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Monto:</p>
                  <p className="text-sm">{formatCurrency(selectedAdvance.amount)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Motivo:</p>
                <p className="text-sm">{selectedAdvance.reason}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4" /> Procesando...
                </div>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ListadoSalaryAdvancesEmpleadosComponent;