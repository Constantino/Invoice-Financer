import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserState } from '@/types/user';

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            user: null,
            login: (user) => set({ isLoggedIn: true, user: user || {} }),
            logout: () => set({ isLoggedIn: false, user: null }),
        }),
        {
            name: 'user-storage',
        }
    )
);
