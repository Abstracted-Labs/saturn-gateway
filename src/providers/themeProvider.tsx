import { batch, createContext, createEffect, createMemo, createRenderEffect, onMount, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { createLocalStorage } from "@solid-primitives/storage";
import { ColorModeEnum } from "../components/top-nav/ColorSwitch";

type ThemeContextType = {
  colorMode: ColorModeEnum | null,
  setMode: (colorMode: ColorModeEnum) => void,
  getColorMode: () => string | null,
};

const defaultThemeState = (): ThemeContextType => ({
  colorMode: null, // default to dark mode
  setMode: () => {
    return;
  },
  getColorMode: () => {
    return null;
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

  function getColorMode(): string | null {
    try {
      const ls = localStorage.getItem('colorMode');
      console.log({ ls });
      console.log('getColorMode', storageState['colorMode']);
      const data = JSON.parse(storageState['colorMode']);
      return data.colorMode;
    } catch (e) {
      console.log('error', e);
      return null;
    }
  };

  function setMode(colorMode: ColorModeEnum): void {
    console.log({ colorMode });
    if (!!colorMode) {
      setState('colorMode', colorMode);
      setStorageState("colorMode", JSON.stringify({ colorMode }));
    } else {
      console.log('colorMode is undefined', colorMode);
    }
  }

  // onMount(() => {
  //   console.log('mounted');
  //   const current = getColorMode();
  //   if (current === null) {
  //     setMode(ColorModeEnum.DARK);
  //   } else {
  //     setMode(current as ColorModeEnum);
  //   }
  // });

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