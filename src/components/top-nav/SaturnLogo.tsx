import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { ColorModeEnum } from "../left-side/ColorSwitch";
import { useThemeContext } from "../../providers/themeProvider";
import darkLogo from "../../assets/icons/saturn-logo-dark-beta.svg";
import lightLogo from "../../assets/icons/saturn-logo-light-beta.svg";
import { A, useLocation } from "@solidjs/router";

const SaturnLogo = () => {
  const [lightMode, setLightMode] = createSignal<boolean>(false);
  const theme = useThemeContext();
  const colorMode = createMemo(() => theme.getColorMode());
  const loc = useLocation();
  const atHome = createMemo(() => {
    return loc.pathname === '/';
  });

  createEffect(on(colorMode, () => {
    if (colorMode() === ColorModeEnum.LIGHT) {
      setLightMode(true);
    } else {
      setLightMode(false);
    }
  }));

  return <A href="/" class={`flex ${ !atHome() ? 'ml-2 md:mr-24' : '' }`}>
    <Show when={lightMode()}>
      <img id="lightLogo" src={lightLogo} class="h-8 my-5 mr-3 max-w-xs" alt="Saturn Gateway Logo Light" />
    </Show>
    <Show when={!lightMode()}>
      <img id="darkLogo" src={darkLogo} class="h-8 my-5 mr-3 max-w-xs" alt="Saturn Gateway Logo Dark" />
    </Show>
  </A>;
};

SaturnLogo.displayName = "SaturnLogo";
export default SaturnLogo;