import { createEffect, createMemo, createSignal } from "solid-js";
import { useThemeContext } from "../../providers/themeProvider";

export enum ColorModeEnum {
  LIGHT = 'light',
  DARK = 'dark',
}

const ColorSwitch = () => {
  const [colorTheme, setColorTheme] = createSignal<ColorModeEnum>(ColorModeEnum.DARK);
  const modeText = createMemo(() => colorTheme() === ColorModeEnum.LIGHT ? 'Light' : 'Dark');
  const theme = useThemeContext();
  const colorMode = createMemo(() => theme.getColorMode());

  const toggle = () => {
    // if set via local storage previously
    if (colorMode()) {
      if (colorMode() === ColorModeEnum.LIGHT) {
        document.documentElement.classList.add(ColorModeEnum.DARK);
        theme.setMode(ColorModeEnum.DARK);
        setColorTheme(ColorModeEnum.DARK);
      } else {
        document.documentElement.classList.remove(ColorModeEnum.DARK);
        theme.setMode(ColorModeEnum.LIGHT);
        setColorTheme(ColorModeEnum.LIGHT);
      }
    } else {
      console.log('colorMode is undefined', colorMode());
      // if NOT set via local storage previously
      if (document.documentElement.classList.contains(ColorModeEnum.DARK)) {
        document.documentElement.classList.remove(ColorModeEnum.DARK);
        theme.setMode(ColorModeEnum.LIGHT);
        setColorTheme(ColorModeEnum.LIGHT);
      } else {
        document.documentElement.classList.add(ColorModeEnum.DARK);
        theme.setMode(ColorModeEnum.DARK);
        setColorTheme(ColorModeEnum.DARK);
      }
    }
  };

  return <>
    <label class="relative inline-flex items-center mr-5 cursor-pointer">
      <input type="checkbox" id="theme-toggle" value={colorTheme()} onInput={toggle} class="sr-only peer" />
      <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
      <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{modeText()} Mode</span>
    </label>
  </>;
};
ColorSwitch.displayName = 'ColorSwitch';
export default ColorSwitch;