import { batch, createContext, createEffect, createMemo, createRenderEffect, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { createLocalStorage } from "@solid-primitives/storage";
import { ColorModeEnum } from "../components/top-nav/ColorSwitch";

type ThemeContextType = {
  colorMode: ColorModeEnum | undefined,
  setMode: (colorMode: ColorModeEnum) => void,
  getColorMode: () => string | undefined,
};

const defaultThemeState = (): ThemeContextType => ({
  colorMode: 'dark' as ColorModeEnum, // default to dark mode
  setMode: () => {
    return;
  },
  getColorMode: () => {
    return undefined;
  }
});

export const ThemeContext = createContext<ThemeContextType>(defaultThemeState());

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext: cannot find a ThemeContext");
  }

  return context;
}

export function ThemeProvider(props: any) {
  const [state, setState] = createStore<ThemeContextType>(defaultThemeState());
  const [storageState, setStorageState] = createLocalStorage();

  function getColorMode(): string | undefined {
    const data = JSON.parse(storageState['colorMode']);
    return data.colorMode;
  };

  function setMode(colorMode: ColorModeEnum): void {
    batch(() => {
      if (!!colorMode) {
        setState('colorMode', colorMode);
        setStorageState("colorMode", JSON.stringify({ colorMode }));
      }
    });
  }

  const contextValue = createMemo(() => ({
    ...state,
    setMode,
    getColorMode,
  }));

  return (
    <ThemeContext.Provider value={contextValue()}>
      {props.children}
    </ThemeContext.Provider>
  );
}