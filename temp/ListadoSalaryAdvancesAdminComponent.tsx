"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ListadoTabla } from "@/components/ui/local/ListadoTabla";
import { Badge } from "@/components/ui/badge";
import { SalaryAdvance, SalaryAdvanceFilters } from "@/types/salaryAdvanceTypes";
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
  DialogDescription
} from "@/components/ui/dialog";
import Loader from "../ui/local/Loader";
import React from "react";
import {
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  ClipboardList,
  Search,
  ThumbsUp,
  ThumbsDown
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
  getAllAdvancesAction,
  approveAdvanceAction,
  rejectAdvanceAction
} from "@/app/actions/salaryAdvanceActions";
import { formatCurrency, formatDate } from "@/lib/utils";

const ListadoSalaryAdvancesAdminComponent = ({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}: {
  data: SalaryAdvance[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const safeData = Array.isArray(data) ? data : [];

  const [advances, setAdvances] = useState<SalaryAdvance[]>(safeData);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvance | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    
    if (value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!search || search.trim() === "") {
      params.delete("search");
    } else {
      params.set("search", search);
    }

    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleApproveClick = (advance: SalaryAdvance) => {
    setSelectedAdvance(advance);
    setActionType('approve');
    setConfirmDialogOpen(true);
  };

  const handleRejectClick = (advance: SalaryAdvance) => {
    setSelectedAdvance(advance);
    setActionType('reject');
    setConfirmDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedAdvance || !actionType) return;

    try {
      setLoading(true);
      
      if (actionType === 'approve') {
        await approveAdvanceAction(selectedAdvance.id);
        toast.success("Solicitud aprobada", {
          description: "El adelanto salarial ha sido aprobado correctamente.",
          duration: 3000,
        });
      } else {
        await rejectAdvanceAction(selectedAdvance.id);
        toast.success("Solicitud rechazada", {
          description: "El adelanto salarial ha sido rechazado.",
          duration: 3000,
        });
      }

      await fetchAdvances();
    } catch (error) {
      console.error(`Error al ${actionType === 'approve' ? 'aprobar' : 'rechazar'} el adelanto:`, error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      toast.error(`Error al ${actionType === 'approve' ? 'aprobar' : 'rechazar'} adelanto`, {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
      setSelectedAdvance(null);
      setActionType(null);
    }
  };

  const fetchAdvances = useCallback(async () => {
    const currentPage = Number(searchParams.get("page")) || 1;
    const status = searchParams.get("status") as SalaryAdvanceFilters['status'] || 'all';
    
    setLoading(true);

    try {
      const filters: SalaryAdvanceFilters = {
        page: currentPage,
        limit: itemsPerPage,
        status: status === 'all' ? undefined : status as SalaryAdvanceFilters['status']
      };

      const result = await getAllAdvancesAction(filters);
      
      if (result) {
        setAdvances(result.advances);
        setTotal(result.total);
        setPage(result.page);
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
  }, [searchParams, itemsPerPage]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    } else {
      fetchAdvances();
    }
  }, [fetchAdvances, isFirstLoad]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading) {
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
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rechazado</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pendiente</Badge>;
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
              Gestión de Adelantos Salariales
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra las solicitudes de adelantos salariales de los empleados
            </CardDescription>
          </div>
        </div>

        <div className="mt-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid grid-cols-4 w-[500px]">
              <TabsTrigger value="all" className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Aprobados
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Rechazados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ListadoTabla
          data={advances}
          total={total}
          page={page}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Buscar por nombre de empleado..."
          columns={[
            { title: "Empleado", key: "employee" },
            { title: "Monto", key: "amount" },
            { title: "Motivo", key: "reason" },
            { title: "Estado", key: "status" },
            { title: "Fecha", key: "createdAt" },
            { title: "Acciones", key: "actions" }
          ]}
          renderRow={(advance: SalaryAdvance) => (
            <React.Fragment key={advance.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{advance.employee.nombre} {advance.employee.apellido}</span>
                  <span className="text-xs text-muted-foreground">Legajo: {advance.employee.legajo}</span>
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
                  {advance.reason.length > 30 ? advance.reason.substring(0, 30) + "..." : advance.reason}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(advance.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                  {formatDate(advance.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {advance.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400"
                        onClick={() => handleApproveClick(advance)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400"
                        onClick={() => handleRejectClick(advance)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {advance.status !== 'pending' && (
                    <span className="text-sm text-muted-foreground">
                      {advance.status === 'approved' ? 'Aprobado' : 'Rechazado'} por {advance.approvedBy || 'Admin'}
                    </span>
                  )}
                </div>
              </TableCell>
            </React.Fragment>
          )}
        />
      </CardContent>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="[&>button]:cursor-pointer max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar' : 'Rechazar'} adelanto salarial
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas {actionType === 'approve' ? 'aprobar' : 'rechazar'} esta solicitud de adelanto salarial?
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdvance && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">Empleado:</p>
                  <p className="text-sm">{selectedAdvance.employee.nombre} {selectedAdvance.employee.apellido}</p>
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
              <div>
                <p className="text-sm font-medium">Fecha de solicitud:</p>
                <p className="text-sm">{formatDate(selectedAdvance.createdAt)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAction}
              disabled={loading}
              className={
                actionType === 'approve'
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4" /> Procesando...
                </div>
              ) : actionType === 'approve' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Aprobar
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Rechazar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ListadoSalaryAdvancesAdminComponent;
