"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function TestInput() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log("Buscando:", searchTerm);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={(e) => e.preventDefault()}>
        <Input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          className="max-w-sm"
        />
      </form>
    </div>
  );
}
