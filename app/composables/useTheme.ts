import { useStorage } from "@vueuse/core";

export const useTheme = () => {
  const primaryColor = useStorage("fynncloud-primary-color", "blue");

  const availableColors = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];

  const setPrimaryColor = (color: string) => {
    if (!availableColors.includes(color)) return;

    primaryColor.value = color;
    updateCssVariables(color);
    localStorage.setItem("fynncloud-primary-color", color);
  };

  const updateCssVariables = (color: string) => {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const root = document.documentElement;

    shades.forEach((shade) => {
      root.style.setProperty(
        `--color-primary-${shade}`,
        `var(--color-${color}-${shade})`,
      );
    });
  };

  interface InfoResponse {
    primaryColor: string;
    [key: string]: any;
  }

  const isDark = useState<boolean>("theme-dark", () => false);

  const toggleDark = () => {
    isDark.value = !isDark.value;
    applyTheme();
    localStorage.setItem("fynncloud-theme", isDark.value ? "dark" : "light");
  };

  const applyTheme = () => {
    if (import.meta.client) {
      document.documentElement.classList.toggle("dark", isDark.value);
    }
  };

  const initTheme = () => {
    // Apply persisted color immediately
    updateCssVariables(primaryColor.value);

    if (import.meta.client) {
      const storedTheme = localStorage.getItem("fynncloud-theme");
      if (storedTheme) {
        isDark.value = storedTheme === "dark";
      } else {
        isDark.value = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
      }
      applyTheme();
    }
  };

  return {
    primaryColor,
    availableColors,
    setPrimaryColor,
    initTheme,
    isDark,
    toggleDark,
  };
};
