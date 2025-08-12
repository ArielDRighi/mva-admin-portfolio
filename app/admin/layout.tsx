// app/dashboard/layout.tsx
import { AppSidebar } from "@/components/layout/AppSidebar";
import Header from "@/components/layout/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import AuthWrapper from "@/components/auth/AuthWrapper";
import AuthErrorHandler from "@/components/auth/AuthErrorHandler";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <AuthErrorHandler />
          {children}
        </SidebarInset>
        <Toaster richColors closeButton />
      </SidebarProvider>
    </AuthWrapper>
  );
}
