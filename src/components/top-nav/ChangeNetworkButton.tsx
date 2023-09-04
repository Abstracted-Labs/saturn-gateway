import { For, JSXElement, createSignal } from 'solid-js';
import { NetworkEnum } from '../../utils/consts';
import { useProposeContext } from '../../providers/proposeProvider';
import OptionItem from '../legos/OptionItem';
import { getNetworkBlock } from '../../utils/getNetworkBlock';
import SaturnSelect from '../legos/SaturnSelect';
import { Dropdown, DropdownInterface, type DropdownOptions } from 'flowbite';

const ChangeNetworkButton = () => {
  const [isDropdownActive, setIsDropdownActive] = createSignal(false);
  const proposeContext = useProposeContext();
  const [activeNetwork, setActiveNetwork] = createSignal<NetworkEnum>(NetworkEnum.TINKERNET);
  const options2: Record<string, JSXElement> = {
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
  const options: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetSkidding: 0,
    offsetDistance: 10,
    delay: 300,
    onHide: () => {
      console.log('dropdown has been hidden');
    },
    onShow: () => {
      console.log('dropdown has been shown');
    },
    onToggle: () => {
      console.log('dropdown has been toggled');
    }
  };
  const dropdown: DropdownInterface = new Dropdown($dropdown(), $toggle(), options);

  function selectedNetwork() {
    return getNetworkBlock(activeNetwork());
  };

  function updateNetworkMode(name: NetworkEnum) {
    setActiveNetwork(name);
    console.log('updateNetworkMode', name);
    proposeContext.setters.setCurrentNetwork(name);
    setIsDropdownActive(false);
    dropdown.hide();
  }

  function openDropdown(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownActive(true);
    dropdown.show();
    // if ($toggle()?.classList.contains('hidden')) {
    //   $toggle()?.classList.remove('hidden');
    //   $toggle()?.classList.add('block');
    //   $toggle()?.style.setProperty('transform', 'translate3d(0px, 33px, 0px)');
    // }
  }

  return <>
    <SaturnSelect isOpen={isDropdownActive()} currentSelection={selectedNetwork()} toggleId={TOGGLE_ID} dropdownId={DROPDOWN_ID} initialOption={getNetworkBlock(NetworkEnum.TINKERNET)} onClick={(e) => openDropdown(e)}>
      <For each={Object.entries(options2)}>
        {([name, element]) => <OptionItem onClick={() => updateNetworkMode(name as NetworkEnum)}>
          {element}
        </OptionItem>}
      </For>
    </SaturnSelect>
  </>;
};

ChangeNetworkButton.displayName = 'ChangeNetworkButton';
export default ChangeNetworkButton;