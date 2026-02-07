import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "Admin" | "Lender" | "Borrower";

interface RoleState {
    currentRole: UserRole;
    setRole: (role: UserRole) => void;
}

export const useRoleStore = create<RoleState>()(
    persist(
        (set) => ({
            currentRole: "Borrower",
            setRole: (role) => set({ currentRole: role }),
        }),
        { name: "role-storage" }
    )
);
