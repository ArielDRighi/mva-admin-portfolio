// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogoMVA } from "@/assets/ImgDatabase";

export default async function Home() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user")?.value;

  if (userCookie) {
    // Don't wrap the redirect in a try-catch since redirect() throws an error
    // that's meant to be caught by Next.js, not by our code
    const user = JSON.parse(userCookie);

    if (user.roles.includes("ADMIN") || user.roles.includes("SUPERVISOR")) {
      redirect("/admin/dashboard");
    } else if (user.roles.includes("OPERARIO")) {
      redirect("/empleado/dashboard");
    }
  }
  // If not authenticated, show the simple home page
  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-8 bg-gradient-to-b from-white to-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <header className="flex items-center space-x-2">
          <Image src={LogoMVA} alt="MVA Logo" className="h-16 w-auto" width={64} height={64} />
          <h2 className="font-bold text-2xl">MVA SRL</h2>
        </header>
        <h1 className="text-3xl font-bold text-primary text-center">
          Sistema de Gestión
        </h1>
        <Link href="/login">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            Iniciar sesión
          </Button>
        </Link>
      </div>
      <footer className="w-full text-center text-sm text-gray-500 mt-8">
        © 2025 MVA SRL. Todos los derechos reservados.
      </footer>
    </main>
  );
}
