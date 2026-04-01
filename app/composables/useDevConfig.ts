export const useDevConfig = () => {
  // Only execute logic if we're in development mode. In production, this state shouldn't be used or hydrated.
  // Using useState to persist across the app lifecycle.
  const networkDelay = import.meta.dev
    ? useState<number>("dev-network-delay", () => 0)
    : ref(0);
  const isDevMenuOpen = import.meta.dev
    ? useState<boolean>("dev-menu-open", () => false)
    : ref(false);

  const forceError = import.meta.dev
    ? useState<boolean>("dev-force-error", () => false)
    : ref(false);
  const simulate401 = import.meta.dev
    ? useState<boolean>("dev-simulate-401", () => false)
    : ref(false);
  const slowUploads = import.meta.dev
    ? useState<boolean>("dev-slow-uploads", () => false)
    : ref(false);
  const debugUI = import.meta.dev
    ? useState<boolean>("dev-debug-ui", () => false)
    : ref(false);

  return {
    networkDelay,
    isDevMenuOpen,
    forceError,
    simulate401,
    slowUploads,
    debugUI,
  };
};
