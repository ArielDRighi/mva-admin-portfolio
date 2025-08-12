import { Toaster } from "sonner";
import AuthWrapper from "@/components/auth/AuthWrapper";
import AuthErrorHandler from "@/components/auth/AuthErrorHandler";

export default function DashboardEmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <main>
        <AuthErrorHandler />
        {children}
        <Toaster richColors closeButton />
      </main>
    </AuthWrapper>
  );
}
