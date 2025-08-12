"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { loginUser } from "@/app/actions/login";
import { useState, useEffect } from "react";
import Image from "next/image";
import Loader from "../ui/local/Loader";
import { toast } from "sonner";
import ForgotPasswordModal from "../ui/ForgotPasswordModal";

const formSchema = z.object({
  email: z.string().min(3, { message: "El mail es obligatorio" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

const LoginComponent = () => {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Verificar si el usuario fue redirigido por sesión expirada
  useEffect(() => {
    const expired = searchParams.get("expired");
    if (expired === "true") {
      toast.error("Sesión expirada", {
        description: "Por favor, inicia sesión nuevamente",
        duration: 4000,
      });
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setFormError("");
    setIsLoading(true);

    try {
      const data = await loginUser(values.email, values.password);

      // Determinar la ruta correcta basada en el rol
      let redirectPath = "/admin/dashboard";
      if (data.user.roles && data.user.roles.includes("OPERARIO")) {
        redirectPath = "/empleado/dashboard";
      }

      // Usar window.location para una navegación completa
      window.location.href = redirectPath;
    } catch (err) {
      setFormError("Usuario o contraseña incorrectos");
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  return (
    <>
      <Form {...form}>
        <div className="form_wrapper">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 form_main"
          >
            <Image
              src="/images/MVA_LogoPNG.png"
              alt="Logo"
              width={120}
              height={120}
              className="z-10"
            />
            <h1 className="heading">Iniciar sesión</h1>

            <div className="inputContainer">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Email</FormLabel>
                    <svg
                      className="inputIcon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#2e2e2e"
                      viewBox="0 0 16 16"
                    >
                      <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z"></path>
                    </svg>
                    <FormControl>
                      <Input
                        placeholder="empleado@mva.com"
                        {...field}
                        id="email"
                        className="inputField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="inputContainer">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Contraseña</FormLabel>
                    <svg
                      className="inputIcon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="#2e2e2e"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                    </svg>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                          id="password"
                          className="inputField"
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer"
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="#2e2e2e"
                              viewBox="0 0 16 16"
                            >
                              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                              <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="#2e2e2e"
                              viewBox="0 0 16 16"
                            >
                              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-500 z-10">{formError}</p>
            )}

            {isLoading ? (
              <Loader />
            ) : (
              <Button
                type="submit"
                id="button"
                className="cursor-pointer flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                Iniciar sesión
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              onClick={handleForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </form>
        </div>
      </Form>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </>
  );
};

export default LoginComponent;
