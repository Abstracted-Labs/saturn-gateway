import { For, JSXElement, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { NetworkEnum } from '../../utils/consts';
import { useProposeContext } from '../../providers/proposeProvider';
import OptionItem from '../legos/OptionItem';
import { getNetworkBlock } from '../../utils/getNetworkBlock';
import SaturnSelect from '../legos/SaturnSelect';
import { Dropdown, type DropdownInterface, type DropdownOptions, initDropdowns } from 'flowbite';

const ChangeNetworkButton = () => {
  let dropdown: DropdownInterface;
  const [isDropdownActive, setIsDropdownActive] = createSignal(false);
  const proposeContext = useProposeContext();
  const [activeNetwork, setActiveNetwork] = createSignal<NetworkEnum>(NetworkEnum.TINKERNET);
  const AllNetworks: Record<string, JSXElement> = {
    [NetworkEnum.KUSAMA]: getNetworkBlock(NetworkEnum.KUSAMA),
    [NetworkEnum.POLKADOT]: getNetworkBlock(NetworkEnum.POLKADOT),
    [NetworkEnum.TINKERNET]: getNetworkBlock(NetworkEnum.TINKERNET),
    // [NetworkEnum.BASILISK]: getNetworkBlock(NetworkEnum.BASILISK),
    // [NetworkEnum.PICASSO]: getNetworkBlock(NetworkEnum.PICASSO),
  };
  const TOGGLE_ID = 'networkToggle';
  const DROPDOWN_ID = 'networkDropdown';
  const $toggle = () => document.getElementById(TOGGLE_ID);
  const $dropdown = () => document.getElementById(DROPDOWN_ID);
  const NetworkOptions: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetSkidding: 0,
    offsetDistance: -7,
    delay: 300,
    onHide: () => {
      console.log('dropdown has been hidden');
    },
    onShow: () => {
      console.log('dropdown has been shown');
    },
  };

  function selectedNetwork() {
    const contextSelection = proposeContext.state.currentNetwork;
    return contextSelection && getNetworkBlock(contextSelection) || getNetworkBlock(activeNetwork());
  };

  function updateNetworkMode(name: NetworkEnum) {
    setActiveNetwork(name);
    proposeContext.setters.setCurrentNetwork(name);
    setIsDropdownActive(false);
    dropdown.hide();
  }

  function openDropdown(e: Event) {
    if (dropdown) {
      if (isDropdownActive()) {
        setIsDropdownActive(false);
        dropdown.hide();
      } else {
        setIsDropdownActive(true);
        dropdown.show();
      }
    }
  }

  onMount(() => {
    initDropdowns();
    dropdown = new Dropdown($dropdown(), $toggle(), NetworkOptions);
  });

  createEffect(() => {
    const handleClickOutside = (event: any) => {
      const toggleElement = $toggle();
      const dropdownElement = $dropdown();

      if (toggleElement && dropdownElement && !toggleElement.contains(event.target) && !dropdownElement.contains(event.target)) {
        dropdown.hide();
        setIsDropdownActive(false);
      }
    };

    if (isDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  return <>
    <SaturnSelect isOpen={isDropdownActive()} isMini={false} currentSelection={selectedNetwork()} toggleId={TOGGLE_ID} dropdownId={DROPDOWN_ID} initialOption={getNetworkBlock(NetworkEnum.TINKERNET)} onClick={openDropdown}>
      <For each={Object.entries(AllNetworks)}>
        {([name, element]) => <OptionItem onClick={() => updateNetworkMode(name as NetworkEnum)}>
          {element}
        </OptionItem>}
      </For>
    </SaturnSelect>
  </>;
};

ChangeNetworkButton.displayName = 'ChangeNetworkButton';
export default ChangeNetworkButton;