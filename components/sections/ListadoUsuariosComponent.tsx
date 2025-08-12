"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { ListadoTabla } from "@/components/ui/local/ListadoTabla";
import { FormDialog } from "@/components/ui/local/FormDialog";
import { FormField } from "@/components/ui/local/FormField";
import Loader from "@/components/ui/local/Loader";
import { Badge } from "@/components/ui/badge";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserCog,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  changeUserStatus,
  deleteUser,
} from "@/app/actions/users";
import { Role, User } from "@/types/userTypes";
import { EmpleadoSelector } from "@/components/ui/local/SearchSelector/Selectors";

// Definir esquema de validación con zod
const userFormSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Debe ser un email válido"),
  password: z.string().optional(),
  roles: z.array(z.nativeEnum(Role)).min(1, "Debe seleccionar al menos un rol"),
  empleadoId: z.number().nullable().optional(),
});

// Tipo de datos del formulario basado en el esquema zod
type UserFormValues = z.infer<typeof userFormSchema>;

interface ListadoUsuariosComponentProps {
  data: User[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}

const ListadoUsuariosComponent: React.FC<ListadoUsuariosComponentProps> = ({
  data,
  totalItems,
  currentPage,
  itemsPerPage,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>(data);
  const [total, setTotal] = useState<number>(totalItems);
  const [page, setPage] = useState<number>(currentPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToChangeStatus, setUserToChangeStatus] = useState<{
    id: number;
    estado: "ACTIVO" | "INACTIVO";
  } | null>(null);
  console.log("users", users);

  // Configuración del formulario con validación
  const { handleSubmit, setValue, control, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      roles: [],
      empleadoId: null,
    },
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", search);
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsCreating(false);
    setValue("nombre", user.nombre);
    setValue("email", user.email);
    setValue("password", "");
    setValue("roles", user.roles);
    setValue("empleadoId", user.empleadoId || null);
  };

  const handleCreateClick = () => {
    reset({
      nombre: "",
      email: "",
      password: "",
      roles: [],
      empleadoId: null,
    });
    setSelectedUser(null);
    setIsCreating(true);
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setConfirmDialogOpen(true);
  };

  const handleChangeStatusClick = (user: User) => {
    setUserToChangeStatus({
      id: user.id,
      estado: user.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO",
    });
    setStatusDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete);
      toast.success("Usuario eliminado", {
        description: "El usuario ha sido eliminado correctamente.",
      });
      await fetchUsers();    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      
      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "No se pudo eliminar el usuario.";
      
      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error("Error al eliminar usuario", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
    } finally {
      setUserToDelete(null);
      setConfirmDialogOpen(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!userToChangeStatus) return;

    try {
      await changeUserStatus(userToChangeStatus.id, userToChangeStatus.estado);
      toast.success("Estado actualizado", {
        description: `El usuario ha sido ${
          userToChangeStatus.estado === "ACTIVO" ? "activado" : "desactivado"
        } correctamente.`,
      });
      await fetchUsers();    } catch (error) {
      console.error("Error al cambiar el estado del usuario:", error);
      
      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "No se pudo cambiar el estado del usuario.";
      
      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error("Error al actualizar estado", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
    } finally {
      setUserToChangeStatus(null);
      setStatusDialogOpen(false);
    }
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      // Preparar datos para envío
      const formData = { ...data };

      // Eliminar campos que no son necesarios
      if (formData.empleadoId === null) {
        delete formData.empleadoId;
      }

      if (selectedUser && selectedUser.id) {
        // Modo edición
        if (!formData.password || formData.password === "") {
          delete formData.password;
        }

        // Convertir roles al tipo correcto para la API
        const apiData: {
          email: string;
          password?: string;
          roles: string[];
          empleadoId?: number;
        } = {
          email: formData.email,
          roles: formData.roles as unknown as string[],
          empleadoId: formData.empleadoId as number | undefined,
        };

        if (formData.password) {
          apiData.password = formData.password;
        }

        await updateUser(selectedUser.id, apiData);
        toast.success("Usuario actualizado", {
          description: "Los cambios se han guardado correctamente.",
        });
      } else {
        // Modo creación
        if (!formData.password) {        return toast.error("Error de validación", {
          description: "La contraseña es obligatoria para crear un usuario.",
          duration: 5000, // Duración aumentada para mejor visibilidad
        });
        }

        // Convertir roles al tipo correcto para la API
        const apiData = {
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          roles: formData.roles as unknown as string[],
          empleadoId: formData.empleadoId as number | undefined,
        };

        await createUser(apiData);
        toast.success("Usuario creado", {
          description: "El usuario se ha registrado correctamente.",
        });
      }

      await fetchUsers();
      setIsCreating(false);
      setSelectedUser(null);    } catch (error) {
      console.error("Error en el envío del formulario:", error);
        // Ya se está haciendo una buena extracción del mensaje de error, solo mejoramos el formato del toast
      const errorMessage = error instanceof Error
        ? error.message
        : selectedUser
        ? "No se pudo actualizar el usuario."
        : "No se pudo crear el usuario.";
      
      toast.error(selectedUser ? "Error al actualizar usuario" : "Error al crear usuario", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
    }
  };  const fetchUsers = useCallback(async () => {
    const currentPage = Number(searchParams.get("page")) || 1;
    const searchQuery = searchParams.get("search") || "";
    setLoading(true);

    try {
      const response = await getUsers(currentPage, itemsPerPage, searchQuery);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (response && typeof response === 'object') {
        type ApiResponse = {
          data: User[];
          totalItems: number;
          currentPage: number;
        };
        
        const typedResponse = response as ApiResponse;
        setUsers(typedResponse.data || []);
        setTotal(typedResponse.totalItems || 0);
        setPage(typedResponse.currentPage || 1);
      }
    } catch (error) {
      console.error("Error al cargar los usuarios:", error);
      
      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "No se pudieron cargar los usuarios.";
      
      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error("Error al cargar usuarios", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading && users.length === 0) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Gestión de Usuarios
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Administra los usuarios del sistema y sus permisos
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateClick}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="rounded-md border">
          <ListadoTabla
            title=""
            data={users}
            itemsPerPage={itemsPerPage}
            searchableKeys={["nombre", "email", "estado"]}
            remotePagination
            totalItems={total}
            currentPage={page}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            columns={[
              { title: "Usuario", key: "nombre" },
              { title: "Email", key: "email" },
              { title: "Roles", key: "roles" },
              { title: "Estado", key: "estado" },
              { title: "Acciones", key: "acciones" },
            ]}
            renderRow={(user: User) => (
              <>
                <TableCell className="min-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserCog className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium">{user.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="min-w-[180px]">{user.email}</TableCell>

                <TableCell className="min-w-[180px]">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role: string) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className={
                          role === "ADMIN"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : role === "SUPERVISOR"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-green-100 text-green-800 hover:bg-green-100"
                        }
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="min-w-[120px]">
                  <Badge
                    variant={user.estado === "ACTIVO" ? "default" : "secondary"}
                    className={
                      user.estado === "ACTIVO"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {user.estado}
                  </Badge>
                </TableCell>

                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(user)}
                    className="cursor-pointer border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(user.id)}
                    className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>

                  <Button
                    variant={
                      user.estado === "ACTIVO" ? "destructive" : "default"
                    }
                    size="sm"
                    onClick={() => handleChangeStatusClick(user)}
                    className={
                      user.estado === "ACTIVO"
                        ? "cursor-pointer bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800"
                        : "cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                    }
                  >
                    {user.estado === "ACTIVO" ? (
                      <>
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Activar
                      </>
                    )}
                  </Button>
                </TableCell>
              </>
            )}
          />
        </div>
      </CardContent>

      {/* Formulario para crear/editar usuario */}
      <FormDialog
        open={isCreating || selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setSelectedUser(null);
          }
        }}
        title={selectedUser ? "Editar Usuario" : "Crear Usuario"}
        description={
          selectedUser
            ? "Modificar información del usuario en el sistema."
            : "Completa el formulario para registrar un nuevo usuario."
        }
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4">
          <Controller
            name="nombre"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Nombre de usuario"
                name="nombre"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Ingrese el nombre de usuario"
                disabled={!isCreating && !!selectedUser}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label="Correo electrónico"
                name="email"
                type="email"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="usuario@ejemplo.com"
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <FormField
                label={
                  isCreating
                    ? "Contraseña"
                    : "Contraseña (dejar en blanco para mantener la actual)"
                }
                name="password"
                type="password"
                value={field.value || ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder={
                  isCreating ? "Ingrese la contraseña" : "Nueva contraseña"
                }
              />
            )}
          />

          <Controller
            name="roles"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label htmlFor="roles" className="text-sm font-medium">
                  Roles
                </label>
                <div className="space-y-2">
                  {Object.values(Role).map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={field.value.includes(role)}
                        onChange={(e) => {
                          const updatedRoles = e.target.checked
                            ? [...field.value, role]
                            : field.value.filter((r) => r !== role);
                          field.onChange(updatedRoles);
                        }}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="text-sm cursor-pointer"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
                {fieldState.error && (
                  <p className="text-sm text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="empleadoId"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label htmlFor="empleadoId" className="text-sm font-medium">
                  Empleado asociado (opcional)
                </label>
                <EmpleadoSelector
                  value={field.value || 0}
                  onChange={(id) => field.onChange(id)}
                  name="empleadoId"
                  label=""
                  error={fieldState.error?.message}
                  disabled={false}
                />
                <p className="text-xs text-muted-foreground">
                  Vincule este usuario a un empleado si corresponde
                </p>
              </div>
            )}
          />
        </div>
      </FormDialog>

      {/* Diálogo de confirmación para eliminar */}
      <FormDialog
        open={confirmDialogOpen}
        submitButtonText="Eliminar"
        submitButtonVariant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogOpen(false);
            setUserToDelete(null);
          }
        }}
        title="Confirmar eliminación"
        onSubmit={(e) => {
          e.preventDefault();
          confirmDelete();
        }}
      >
        <div className="space-y-4 py-4">
          <p className="text-destructive font-semibold">¡Atención!</p>
          <p>
            Esta acción eliminará permanentemente al usuario. Esta operación no
            se puede deshacer.
          </p>
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
      </FormDialog>

      {/* Diálogo de confirmación para cambiar estado */}
      <FormDialog
        open={statusDialogOpen}
        submitButtonText={
          userToChangeStatus?.estado === "ACTIVO" ? "Activar" : "Desactivar"
        }
        submitButtonVariant={
          userToChangeStatus?.estado === "ACTIVO" ? "default" : "destructive"
        }
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialogOpen(false);
            setUserToChangeStatus(null);
          }
        }}
        title={`Confirmar ${
          userToChangeStatus?.estado === "ACTIVO"
            ? "activación"
            : "desactivación"
        }`}
        onSubmit={(e) => {
          e.preventDefault();
          confirmStatusChange();
        }}
      >
        <div className="space-y-4 py-4">
          <p
            className={
              userToChangeStatus?.estado === "ACTIVO"
                ? "text-green-600 font-semibold"
                : "text-destructive font-semibold"
            }
          >
            ¡Atención!
          </p>
          <p>
            {userToChangeStatus?.estado === "ACTIVO"
              ? "Esta acción activará al usuario permitiéndole acceder al sistema."
              : "Esta acción desactivará al usuario impidiéndole acceder al sistema."}
          </p>
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
      </FormDialog>
    </Card>
  );
};

export default ListadoUsuariosComponent;
