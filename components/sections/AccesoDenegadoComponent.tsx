"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccesoDenegadoComponent() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-orange-50 border-b border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-orange-800">
                  Acceso Restringido
                </CardTitle>
                <p className="text-sm text-orange-600 mt-1">
                  Funcionalidad no disponible para su rol
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="py-6">
            <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-orange-800">
                    <strong>Permisos insuficientes:</strong> Su rol de Supervisor no incluye 
                    permisos para crear condiciones contractuales.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  ¿Qué puede hacer como Supervisor?
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ver el listado de condiciones contractuales existentes</li>
                  <li>• Seleccionar condiciones contractuales para crear servicios</li>
                  <li>• Gestionar servicios de instalación, limpieza y mantenimiento</li>
                  <li>• Monitorear operaciones y empleados</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Para crear condiciones contractuales:
                </h3>
                <p className="text-sm text-blue-600">
                  Contacte a un <strong>Administrador</strong> del sistema quien puede 
                  crear nuevas condiciones contractuales según las necesidades del negocio.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button 
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              
              <Button 
                onClick={() => router.push("/admin/dashboard/condiciones-contractuales/listado")}
                className="flex-1"
              >
                Ver Condiciones Contractuales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
