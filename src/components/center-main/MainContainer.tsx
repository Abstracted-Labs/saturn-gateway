import { isAddress } from "@polkadot/util-crypto";
import { useLocation, useParams } from "@solidjs/router";
import { createSignal, createEffect, createMemo, on } from "solid-js";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { setSaturnConnectAccount } from "../../utils/setupSaturnConnect";
import defaultMultisigImage from '../../assets/images/default-multisig-image.png';
import MainContent from "./MainContent";
import { Option } from '@polkadot/types';
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";

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
  const saContext = useSelectedAccountContext();

  const selectedAddress = createMemo(() => saContext.state.account?.address);
  const ringsApiState = createMemo(() => ringApisContext.state);
  const saturnState = createMemo(() => saturnContext.state);
  const tinkernetApi = createMemo(() => ringsApiState().tinkernet);
  const saturnApi = createMemo(() => saturnState().saturn);
  const multisigId = createMemo(() => saturnState().multisigId);
  const details = createMemo(() => saturnState().multisigDetails);

  createEffect(() => {
    const acc = details()?.account;

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
    const multisigHashId = loc.pathname.split('/')[1];

    if (!multisigHashId) {
      console.error('No multisigHashId provided, exiting early.');
      return;
    };

    if (!selectedAddress()) {
      return;
    }

    const runAsync = async () => {
      let id;

      if (isAddress(multisigHashId)) {
        const result = await tinkernetApi().query.inv4.coreByAccount(multisigHashId);
        if (result instanceof Option && result.isSome) {
          id = result.unwrapOr(null)?.toNumber();
          // Ensure id is within the safe range
          if (id && id > Number.MAX_SAFE_INTEGER) {
            // Handle the case where id exceeds the safe integer range
            return;
          }
        } else {
          // Handle the case where result is null or undefined
          return;
        }
      } else {
        id = parseInt(multisigHashId);
        if (isNaN(id)) {
          console.error('Invalid id provided:', multisigHashId);
          return;
        }
      }

      saturnContext.setters.setMultisigId(id);

      // Ensure id is a number before passing it to getDetails
      const numericId = Number(id);
      const maybeDetails = await saturnApi()?.getDetails(numericId);

      if (maybeDetails) {
        saturnContext.setters.setMultisigDetails(maybeDetails);
        saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
      } else {
        console.error(`No details found for ID: ${ numericId }`);
      }
    };

    runAsync();
  });

  createEffect(() => {
    const name = multisigIdentity().name;
    const address = details()?.account.toHuman();

    if (!address || name === "Multisig") {
      return;
    };

    setSaturnConnectAccount(name, address);
  });

  return (
    <div class="m-5 lg:m-2">
      <MainContent />
    </div>
  );
};

MainContainer.displayName = 'MainContainer';
export default MainContainer;
