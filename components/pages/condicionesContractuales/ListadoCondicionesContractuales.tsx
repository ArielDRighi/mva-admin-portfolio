import ListadoCondicionesContractualesComponent from "@/components/sections/ListadoCondicionesContractualesComponent";

export default function ListadoCondicionesContractualesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoCondicionesContractualesComponent />
      </div>
    </main>
  );
}
