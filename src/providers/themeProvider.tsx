import { batch, createContext, createMemo, useContext } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { createLocalStorage } from "@solid-primitives/storage";
import { ColorModeEnum } from "../components/ColorSwitch";

type ThemeContextType = {
  colorMode: ColorModeEnum | undefined,
  setMode: (colorMode: ColorModeEnum) => void,
  getColorMode: () => string | undefined,
};

const defaultThemeState = (): ThemeContextType => ({
  colorMode: undefined,
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
    throw new Error("useThemeProvider: cannot find a ThemeContext");
  }

  return context;
}

export function ThemeProvider(props: any) {
  const [state, setState] = createStore<ThemeContextType>(defaultThemeState());
  const [storageState, setStorageState] = createLocalStorage();

  function getColorMode(): string | undefined {
    const data = JSON.parse(storageState['colorMode']);
    if (data) {
      console.log({ data });
      return data;
    }
  };

  function setMode(colorMode: ColorModeEnum): void {
    batch(() => {
      setState('colorMode', colorMode);
      setStorageState("colorMode", JSON.stringify({ colorMode }));
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