import { Show, Suspense, createResource } from 'solid-js';
import TalismanIdenticon from '../identity/TalismanIdenticon';
import { getBestIdentity, type AggregatedIdentity } from "../../utils/identityProcessor";
import { useIdentityContext } from "../../providers/identityProvider";

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
        <div class="flex flex-row gap-2.5 items-center">
          <TalismanIdenticon value={getAddress()} size={40} />
          {getAddress()}
        </div>
      }>
        <div class="flex flex-row gap-2.5 items-center">
          <Show
            when={image()}
            fallback={
              <TalismanIdenticon value={getAddress()} size={40} />
            }
          >
            <img class="h-[40px] w-[40px] rounded-full"
              src={image()}
            />
          </Show>

          {name() || getAddress()}
        </div>
      </Suspense>
    </div>
  );
};
