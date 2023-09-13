import { Show, Suspense, createResource } from 'solid-js';
import TalismanIdenticon from '../identity/TalismanIdenticon';
import { getBestIdentity, type AggregatedIdentity } from "../../utils/identityProcessor";
import { useIdentityContext } from "../../providers/identityProvider";
import { stringShorten } from '@polkadot/util';

export default function Identity(props: { address: string; }) {
  const identityContext = useIdentityContext();

  const getAddress = () => {
    return props.address;
  };

  const [identity, { mutate, refetch }] = createResource(getAddress, getBestIdentity);

  const image = () => { return identity()?.image?.value; };
  const name = () => { return identity()?.name; };

  const openIdentityCard = () => {
    const i: AggregatedIdentity = identity() || { address: getAddress(), otherIdentities: [] };

    identityContext.setters.openModal(i);
  };

  return (
    <div onClick={() => openIdentityCard()}>
      <Suspense fallback={
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <TalismanIdenticon value={getAddress()} size={34} />
          {stringShorten(getAddress(), 4)}
        </div>
      }>
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <Show
            when={image()}
            fallback={
              <TalismanIdenticon value={getAddress()} size={34} />
            }
          >
            <img class="h-[34px] w-[34px] rounded-full"
              src={image()}
            />
          </Show>

          {name() || stringShorten(getAddress(), 4)}
        </div>
      </Suspense>
    </div>
  );
};
