import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Store {
    isDark: boolean,
    toggleDarkMode: () => void,
    initializeDarkMode: () => void,
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            isDark: false,
            toggleDarkMode: () => {
                set((state) => {
                    const newIsDark = !state.isDark;
                    // Apply the theme immediately
                    if (newIsDark) {
                        document.documentElement.classList.add("dark");
                    } else {
                        document.documentElement.classList.remove("dark");
                    }
                    return { isDark: newIsDark };
                });
            },
            initializeDarkMode: () => {
                // Get the current persisted state
                const currentState = get();
                
                // If we have a saved preference, use it
                if (currentState.isDark !== undefined) {
                    if (currentState.isDark) {
                        document.documentElement.classList.add("dark");
                    } else {
                        document.documentElement.classList.remove("dark");
                    }
                    return;
                }
                
                // Otherwise, fall back to system preference
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                if (prefersDark) {
                    document.documentElement.classList.add("dark");
                    set({ isDark: true });
                } else {
                    document.documentElement.classList.remove("dark");
                    set({ isDark: false });
                }
            }
        }),
        {
            name: 'app-store',
            partialize: (state) => ({
                isDark: state.isDark,
            }),
        }
    )
);