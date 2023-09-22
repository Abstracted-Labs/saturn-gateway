import { Show, Suspense, createResource, lazy } from 'solid-js';
import TalismanIdenticon from '../identity/TalismanIdenticon';
import { getBestIdentity, type AggregatedIdentity } from "../../utils/identityProcessor";
import { useIdentityContext } from "../../providers/identityProvider";
import { stringShorten } from '@polkadot/util';

const CopyAddress = lazy(() => import('../legos/CopyAddressField'));

export default function Identity(props: { address: string; }) {
  const identityContext = useIdentityContext();

  const getAddress = () => {
    return props.address;
  };

  const [identity, { mutate, refetch }] = createResource(getAddress, getBestIdentity);

  const image = () => identity()?.image?.value;
  const name = () => identity()?.name;

  const openIdentityCard = () => {
    console.log('open identity card disabled');
    return;
    const i: AggregatedIdentity = identity() || { address: getAddress(), otherIdentities: [] };

    identityContext.setters.openModal(i);
  };

  return (
    <div onClick={() => openIdentityCard()}>
      <Suspense fallback={
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <TalismanIdenticon value={getAddress()} size={34} />
          <CopyAddress name={name()} address={getAddress()} length={10} />
        </div>
      }>
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <Show
            when={image()}
            fallback={
              <TalismanIdenticon value={getAddress()} size={34} />
            }
          >
            <img class="max-h-[34px] max-w-[34px] rounded-full"
              src={image()}
            />
          </Show>
          <CopyAddress name={name()} address={getAddress()} length={10} />
        </div>
      </Suspense>
    </div>
  );
};
