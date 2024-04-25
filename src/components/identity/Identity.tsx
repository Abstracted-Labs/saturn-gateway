import { Show, Suspense, createEffect, createMemo, createResource, lazy } from 'solid-js';
import TalismanIdenticon from '../identity/TalismanIdenticon';
import { getBestIdentity, type AggregatedIdentity } from "../../utils/identityProcessor";
import { useIdentityContext } from "../../providers/identityProvider";
import { stringShorten } from '@polkadot/util';
import CopyAddressField from '../legos/CopyAddressField';

export default function Identity(props: { address: string; }) {
  const idContext = useIdentityContext();

  const identity = createMemo(() => idContext.state.identities?.find(id => id.address === props.address));
  const image = createMemo(() => identity()?.image?.value);
  const name = createMemo(() => identity()?.name);
  const address = createMemo(() => props.address);

  const openIdentityCard = () => {
    console.log('open identity card disabled');
    return;
    // const i: AggregatedIdentity = identity() || { address: getAddress(), otherIdentities: [] };
    // identityContext.setters.openModal(i);
  };

  return (
    <div onClick={openIdentityCard}>
      <Suspense fallback={
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <TalismanIdenticon value={address()} size={34} />
          <CopyAddressField name={name()} nativeAddress={address()} length={10} isUserAddress />
        </div>
      }>
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <Show
            when={image()}
            fallback={
              <TalismanIdenticon value={address()} size={34} />
            }
          >
            <img class="max-h-[34px] max-w-[34px] rounded-full"
              src={image()}
            />
          </Show>
          <CopyAddressField name={name()} nativeAddress={address()} length={10} isUserAddress />
        </div>
      </Suspense>
    </div>
  );
};
