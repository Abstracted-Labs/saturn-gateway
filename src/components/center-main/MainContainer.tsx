import { isAddress } from "@polkadot/util-crypto";
import { useLocation } from "@solidjs/router";
import { createSignal, createEffect, createMemo } from "solid-js";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { setSaturnConnectAccount } from "../../utils/setupSaturnConnect";
import defaultMultisigImage from '../../assets/images/default-multisig-image.png';
import MainContent from "./MainContent";
import { Option } from '@polkadot/types';

const MainContainer = () => {
  const [multisigIdentity, setMultisigIdentity] = createSignal<{
    name: string;
    imageUrl: string;
    twitterUrl?: string;
    websiteUrl?: string;
  }>({
    name: 'Multisig',
    imageUrl: defaultMultisigImage,
    twitterUrl: undefined,
    websiteUrl: undefined,
  });

  const loc = useLocation();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();

  const ringsApiState = createMemo(() => ringApisContext.state);
  const saturnState = createMemo(() => saturnContext.state);
  const tinkernetApi = createMemo(() => ringsApiState().tinkernet);
  const multisigId = createMemo(() => saturnState().multisigId);
  const details = createMemo(() => saturnState().multisigDetails);
  const multisigHashId = createMemo(() => loc.pathname.split('/')[1]);

  createEffect(() => {
    const acc = details()?.parachainAccount;

    if (!acc) return;

    const runAsync = async () => {
      const iden = (
        (await ringsApiState().tinkernet.query.identity.identityOf(acc))?.toHuman() as {
          info: {
            display: { Raw: string; };
            image: { Raw: string; };
            twitter: { Raw: string; };
            web: { Raw: string; };
          };
        }
      )?.info;

      const name = iden?.display?.Raw ? iden.display.Raw : `Multisig ${ multisigId() }`;
      const imageUrl = iden?.image?.Raw
        ? iden.image.Raw
        : multisigIdentity().imageUrl;
      const twitterUrl = iden?.twitter?.Raw
        ? `https://twitter.com/${ iden.twitter.Raw }`
        : undefined;
      const websiteUrl = iden?.web?.Raw || undefined;

      setMultisigIdentity({ name, imageUrl, twitterUrl, websiteUrl });
    };

    runAsync();
  });

  createEffect(() => {
    const hashId = multisigHashId();

    if (!hashId) {
      console.error('No hashId provided, exiting early.');
      return;
    };

    const runAsync = async () => {
      let id;
      if (isAddress(hashId)) {
        const result = await tinkernetApi().query.inv4.coreByAccount(hashId);
        if (result instanceof Option && result.isSome) {
          id = result.unwrapOr(null)?.toNumber();
          // Ensure id is within the safe range
          if (id && id > Number.MAX_SAFE_INTEGER) {
            return;
          }
        } else {
          return;
        }
      } else {
        id = parseInt(hashId);
        console.log('hashId:', id);
        if (isNaN(id)) {
          console.error('Invalid id provided:', multisigHashId);
          return;
        }
      }

      // Set multisig id in omniway context
      saturnContext.setters.setMultisigId(id);

      // Ensure id is a number before passing it to getDetails
      const numericId = Number(id);
      const maybeDetails = await saturnContext.state.saturn?.getDetails(numericId);

      // Set multisig details and address in omniway context
      if (maybeDetails) {
        saturnContext.setters.setMultisigDetails(maybeDetails);
        console.log('multisig address: ', maybeDetails.parachainAccount.toHuman());
        saturnContext.setters.setMultisigAddress(maybeDetails.parachainAccount.toHuman());
      } else {
        console.error(`No details found for ID: ${ numericId }`);
      }
    };

    runAsync();
  });

  createEffect(() => {
    const name = multisigIdentity().name;
    const address = details()?.parachainAccount.toHuman();

    if (!address || name === "Multisig") {
      return;
    };

    setSaturnConnectAccount(name, address);
  });

  return (
    <div class="m-5 lg:my-3 lg:mx-3">
      <MainContent />
    </div>
  );
};

MainContainer.displayName = 'MainContainer';
export default MainContainer;
