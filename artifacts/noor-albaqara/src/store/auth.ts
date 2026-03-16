import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudentWithProgress, Supervisor } from "@workspace/api-client-react";

type Role = "student" | "supervisor" | "admin" | null;

interface AuthState {
  user: any | null; // Can be StudentWithProgress, Supervisor, or Admin object
  role: Role;
  login: (user: any, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      login: (user, role) => set({ user, role }),
      logout: () => set({ user: null, role: null }),
    }),
    {
      name: "noor-albaqara-auth",
    }
  )
);
