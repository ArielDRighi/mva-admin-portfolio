"use client";

import { create } from "zustand";

interface MaintenanceToiletState {
  // Estado para crear un nuevo mantenimiento
  isCreateModalOpen: boolean;
  selectedToiletId: string | null;

  // Acciones
  openCreateModal: (toiletId: string) => void;
  closeCreateModal: () => void;
  reset: () => void;
}

export const useMaintenanceToiletStore = create<MaintenanceToiletState>()(
  (set) => ({
    isCreateModalOpen: false,
    selectedToiletId: null,

    openCreateModal: (toiletId: string) =>
      set({
        isCreateModalOpen: true,
        selectedToiletId: toiletId,
      }),
    closeCreateModal: () => set({ isCreateModalOpen: false }),
    reset: () => set({ isCreateModalOpen: false, selectedToiletId: null }),
  })
);
