export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-screen-xl mx-auto flex flex-col justify-center items-center px-6 h-screen">
      {children}
    </main>
  );
}
