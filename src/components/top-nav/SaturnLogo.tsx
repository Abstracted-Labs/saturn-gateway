import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { ColorModeEnum } from "./ColorSwitch";
import { useThemeContext } from "../../providers/themeProvider";

const SaturnLogo = () => {
  const [lightMode, setLightMode] = createSignal<boolean>(false);
  const darkString = "/src/assets/icons/saturn-logo-dark-beta.svg";
  const lightString = "/src/assets/icons/saturn-logo-light-beta.svg";
  const theme = useThemeContext();
  const colorMode = createMemo(() => theme.getColorMode());

  createEffect(on(colorMode, () => {
    if (colorMode() === ColorModeEnum.LIGHT) {
      setLightMode(true);
    } else {
      setLightMode(false);
    }
  }));

  return <a href="/" class="flex ml-2 md:mr-24">
    <Show when={lightMode()}>
      <img id="lightLogo" src={lightString} class="h-8 my-5 mr-3 max-w-xs" alt="Saturn Gateway Logo Light" />
    </Show>
    <Show when={!lightMode()}>
      <img id="darkLogo" src={darkString} class="h-8 my-5 mr-3 max-w-xs" alt="Saturn Gateway Logo Dark" />
    </Show>
  </a>;
};
SaturnLogo.displayName = "SaturnLogo";
export default SaturnLogo;