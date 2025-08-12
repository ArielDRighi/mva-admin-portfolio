import LoginPage from "@/components/pages/LoginPage";
import React, { Suspense } from "react";

const Login = () => {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginPage />
    </Suspense>
  );
};

export default Login;
