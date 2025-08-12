import CrearCondicionContractualComponent from "@/components/sections/CrearCondicionContractualComponent";

export default async function CrearCondicionContractualesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <CrearCondicionContractualComponent />
      </div>
    </main>
  );
}
