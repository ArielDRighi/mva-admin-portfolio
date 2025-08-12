"use client";

import { create } from "zustand";

interface MaintenanceVehicleState {
  // Estado para crear un nuevo mantenimiento
  isCreateModalOpen: boolean;
  selectedVehicleId: number | null;

  // Acciones
  openCreateModal: (vehicleId: number) => void;
  closeCreateModal: () => void;
  reset: () => void;
}

export const useMaintenanceVehicleStore = create<MaintenanceVehicleState>()(
  (set) => ({
    isCreateModalOpen: false,
    selectedVehicleId: null,

    openCreateModal: (vehicleId: number) =>
      set({
        isCreateModalOpen: true,
        selectedVehicleId: vehicleId,
      }),
    closeCreateModal: () => set({ isCreateModalOpen: false }),
    reset: () => set({ isCreateModalOpen: false, selectedVehicleId: null }),
  })
);
