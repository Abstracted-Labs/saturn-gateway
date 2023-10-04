import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { ColorModeEnum } from "../left-side/ColorSwitch";
import { useThemeContext } from "../../providers/themeProvider";
import darkLogo from "../../assets/icons/saturn-home-logo-dark.svg";
import lightLogo from "../../assets/icons/saturn-home-logo-light.svg";

const HomeLogo = () => {
  const [lightMode, setLightMode] = createSignal<boolean>(false);
  const theme = useThemeContext();
  const colorMode = createMemo(() => theme.getColorMode());

  createEffect(on(colorMode, () => {
    if (colorMode() === ColorModeEnum.LIGHT) {
      setLightMode(true);
    } else {
      setLightMode(false);
    }
  }));

  return <>
    <Show when={lightMode()}>
      <img id="lightLogo" src={lightLogo} class="flex" alt="Saturn Gateway Logo Light" />
    </Show>
    <Show when={!lightMode()}>
      <img id="darkLogo" src={darkLogo} class="flex" alt="Saturn Gateway Logo Dark" />
    </Show>
  </>;
};

HomeLogo.displayName = "HomeLogo";
export default HomeLogo;