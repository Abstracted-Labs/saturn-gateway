import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { ColorModeEnum } from "./ColorSwitch";

const SaturnLogo = () => {
  const [lightMode, setLightMode] = createSignal<boolean>(false);
  const darkString = "/src/assets/icons/saturn-logo-dark-beta.svg";
  const lightString = "/src/assets/icons/saturn-logo-light-beta.svg";
  const localTheme = createMemo(() => localStorage.getItem('color-theme'));

  createEffect(on(localTheme, () => {
    console.log('localTheme changed', localTheme());
    if (localTheme() === ColorModeEnum.LIGHT) {
      setLightMode(true);
      console.log('light mode');
    } else {
      setLightMode(false);
      console.log('dark mode');
    }
  }, { defer: true }));

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