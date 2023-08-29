import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { BUTTON_COMMON_STYLE } from '../../utils/consts';
import KusamaIcon from '../../assets/icons/kusama-icon-15x9.png';
import PolkadotIcon from '../../assets/icons/polkadot-icon-25x25.png';
import { Dropdown } from "flowbite";
import type { DropdownOptions, DropdownInterface } from "flowbite";

enum NetworkNameEnum {
  KUSAMA = 'kusama',
  POLKADOT = 'polkadot'
}

const ChangeNetworkButton = () => {
  const [isDropdownActive, setIsDropdownActive] = createSignal(false);
  const [activeNetwork, setActiveNetwork] = createSignal<NetworkNameEnum>(NetworkNameEnum.POLKADOT);
  const currentNetwork = createMemo(() => activeNetwork());

  // network blocks
  const networkKusama = () => <>
    <img src={KusamaIcon} alt="Kusama logo" width={20} height={13} class="mr-2 block" />
    <span>Kusama</span>
  </>;
  const networkPolkadot = () => <>
    <img src={PolkadotIcon} alt="Polkadot logo" width={25} height={25} class="mr-1 block" />
    <span>Polkadot</span>
  </>;

  function updateNetworkMode(name: NetworkNameEnum) {
    setActiveNetwork(name);
    const $dropdown = document.getElementById('dropdown');
    $dropdown?.classList.add('hidden');
    $dropdown?.classList.remove('block');
    setIsDropdownActive(false);
  }

  function updateDropdownLabel() {
    if (currentNetwork() === NetworkNameEnum.POLKADOT) {
      return networkPolkadot();
    } else if (currentNetwork() === NetworkNameEnum.KUSAMA) {
      return networkKusama();
    } else {
      // Default network
      return networkKusama();
    }
  }

  function openDropdown() {
    setIsDropdownActive(true);
    const $dropdown = document.getElementById('dropdown');

    if ($dropdown?.classList.contains('hidden')) {
      $dropdown?.classList.remove('hidden');
      $dropdown?.classList.add('block');
      $dropdown?.style.setProperty('transform', 'translate3d(0px, 33px, 0px)');
    }
  }

  return <div class="relative flex flex-col">
    <button
      onClick={openDropdown}
      data-dropdown-offset-distance="-7"
      id="dropdownToggle"
      data-dropdown-toggle="dropdown"
      class={`${ BUTTON_COMMON_STYLE } text-sm text-saturn-black dark:text-saturn-offwhite h-full justify-between pl-4 w-48 z-30 focus:outline-none self-stretch`}
      type="button">
      <span class="mr-10 inline-flex items-center gap-1">{updateDropdownLabel()}</span>
      <svg data-accordion-icon class={`transition-all w-3 h-3 ${ isDropdownActive() ? 'rotate-0' : 'rotate-180' } text-saturn-purple relative right-4`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
      </svg>
    </button>
    <div id="dropdown" class={`${ BUTTON_COMMON_STYLE } hidden divide-y rounded-t-none border-t-0 dark:border-t-saturn-black focus:outline-none w-48 pt-1.5 z-50`}>
      <ul class="text-sm text-gray-700 dark:text-gray-2000 w-48" aria-labelledby="dropdownToggle">
        <li class="pl-4 py-2 hover:bg-saturn-darkpurple dark:text-white inline-flex items-center gap-1 w-full hover:cursor-pointer" onClick={() => updateNetworkMode(NetworkNameEnum.KUSAMA)}>
          {networkKusama()}
        </li>
        <li class="pl-4 py-2 hover:bg-saturn-darkpurple dark:text-white inline-flex items-center gap-1 w-full hover:cursor-pointer" onClick={() => updateNetworkMode(NetworkNameEnum.POLKADOT)}>
          {networkPolkadot()}
        </li>
      </ul>
    </div>
  </div>;
};
ChangeNetworkButton.displayName = 'ChangeNetworkButton';
export default ChangeNetworkButton;