"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <div className="relative w-48 h-48 mx-auto mb-4">
            <Image
              src="/images/MVA_LogoPNG.png"
              alt="Página no encontrada"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">
            404
          </h1>
          <h2 className="text-2xl font-semibold mb-4">Página no encontrada</h2>
          <p className="text-muted-foreground mb-8">
            Lo sentimos, no pudimos encontrar la página que estás buscando.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="default"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto"
          >
            Ir al Home
          </Button>
        </div>
      </div>
    </div>
  );
}
