// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const userCookie = request.cookies.get("user")?.value;

    const isAuth = !!token;
    const isLoginPage = request.nextUrl.pathname.startsWith("/login");
    const isAdminDashboard = request.nextUrl.pathname.startsWith("/admin/dashboard");

    console.log(`Middleware: ${request.nextUrl.pathname}, isAuth: ${isAuth}`);

    // Si NO está autenticado y no está en la página de login → redirigir a login
    if (!isAuth && !isLoginPage) {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      response.cookies.delete("user");
      return response;
    }

    // Si está autenticado y entra a /login → redirigir al dashboard apropiado
    if (isAuth && isLoginPage && userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (user?.roles?.includes("ADMIN")) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        } else if (user?.roles?.includes("OPERADOR") || user?.roles?.includes("OPERARIO")) {
          return NextResponse.redirect(new URL("/empleado/dashboard", request.url));
        }
      } catch (error) {
        console.error("Error parsing user cookie in login redirect:", error);
        // Si hay error, limpiar cookies y permitir el acceso al login
        const response = NextResponse.next();
        response.cookies.delete("token");
        response.cookies.delete("user");
        return response;
      }
    }

    // Si es OPERARIO intentando acceder al dashboard de admin → redirigir
    if (isAuth && isAdminDashboard && userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (
          user?.roles?.includes("OPERARIO") &&
          !user?.roles?.includes("ADMIN") &&
          !user?.roles?.includes("SUPERVISOR")
        ) {
          return NextResponse.redirect(new URL("/empleado/dashboard", request.url));
        }
      } catch (error) {
        console.error("Error parsing user cookie in admin check:", error);
        // En caso de error, permitir el acceso
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Critical middleware error:", error);
    // En caso de error crítico, permitir el acceso
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/empleado/:path*", "/login"],
};
