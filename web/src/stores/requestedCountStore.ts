import { create } from "zustand";

interface RequestedCountState {
    requestedCount: number;
    setRequestedCount: (count: number) => void;
}

export const useRequestedCountStore = create<RequestedCountState>()((set) => ({
    requestedCount: 0,
    setRequestedCount: (count) => set({ requestedCount: count }),
}));
