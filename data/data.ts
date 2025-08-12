import { LogoMVA } from "@/assets/ImgDatabase";
import {
  Car,
  Users,
  Toilet,
  UserCheck,
  Hammer,
  Wrench,
  UserCog,
  Shirt,
  DollarSign,
} from "lucide-react";

const dataSideBar = {
  team: {
    name: "MVA SRL",
    logo: LogoMVA,
    plan: "Sistema de Gestión",
    url: "admin/dashboard",
  },

  navMain: [
    {
      title: "Vehículos",
      url: "/admin/dashboard/vehiculos",
      icon: Car,
      items: [
        { title: "Listado", url: "/admin/dashboard/vehiculos/listado" },
        {
          title: "Mantenimiento",
          url: "/admin/dashboard/vehiculos/mantenimiento",
        },
      ],
    },
    {
      title: "Empleados",
      url: "/admin/dashboard/empleados",
      icon: Users,
      items: [
        { title: "Listado", url: "/admin/dashboard/empleados/listado" },
        {
          title: "Licencias de empleado",
          url: "/admin/dashboard/empleados/licencias",
        },
        {
          title: "Licencias de conducir",
          url: "/admin/dashboard/empleados/licencias_conducir",
        },
        {
          title: "Contactos de emergencia",
          url: "/admin/dashboard/empleados/contactos-emergencia",
        },
      ],
    },
    {
      title: "Sanitarios",
      url: "/admin/dashboard/sanitarios",
      icon: Toilet,
      items: [
        { title: "Listado", url: "/admin/dashboard/sanitarios/listado" },
        {
          title: "Mantenimiento",
          url: "/admin/dashboard/sanitarios/mantenimiento",
        },
      ],
    },
    {
      title: "Clientes",
      url: "/admin/dashboard/clientes",
      icon: UserCheck,
      items: [{ title: "Listado", url: "/admin/dashboard/clientes/listado" }],
    },
    {
      title: "Servicios",
      url: "/admin/dashboard/servicios",
      icon: Hammer,
      items: [
        {
          title: "Crear Capacitacion",
          url: "/admin/dashboard/servicios/capacitaciones/crear",
        },

        {
          title: "Crear Instalacion",
          url: "/admin/dashboard/servicios/instalacion/crear",
        },
        {
          title: "Crear Servicio de Limpieza",
          url: "/admin/dashboard/servicios/genericos/crear",
        },
        {
          title: "Crear Servicio de Retiro",
          url: "/admin/dashboard/servicios/retiro/crear",
        },
        {
          title: "Listado Servicios",
          url: "/admin/dashboard/servicios/listado",
        },
      ],
    },
    {
      title: "Condiciones contractuales",
      url: "#",
      icon: Wrench,
      items: [
        {
          title: "Listado",
          url: "/admin/dashboard/condiciones-contractuales/listado",
        },
        {
          title: "Crear Condición",
          url: "/admin/dashboard/condiciones-contractuales/crear",
        },
      ],
    },
    {
      title: "Usuarios",
      url: "/admin/dashboard/usuarios",
      icon: UserCog,
      items: [
        {
          title: "Listado",
          url: "/admin/dashboard/usuarios/listado",
        },
      ],
    },
    {
      title: "Talles de empleados",
      url: "/admin/dashboard/talles-de-empleados",
      icon: Shirt,
      items: [
        {
          title: "Listado",
          url: "/admin/dashboard/talles-de-empleados/listado",
        },
      ],
    },
    {
      title: "Gestión de Adelantos",
      url: "/admin/dashboard/salary-advances",
      icon: DollarSign,
      items: [
        {
          title: "Listado",
          url: "/admin/dashboard/salary-advances/listado",
        },
      ],
    },
  ],
};

export default dataSideBar;
