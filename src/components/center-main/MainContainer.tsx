import { isAddress } from "@polkadot/util-crypto";
import { useLocation, useParams } from "@solidjs/router";
import { createSignal, createEffect, createMemo, on } from "solid-js";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { setSaturnConnectAccount } from "../../utils/setupSaturnConnect";
import defaultMultisigImage from '../../assets/images/default-multisig-image.png';
import MainContent from "./MainContent";

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

  const location = useLocation();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const params = useParams();
  const hash = params.hash;

  const getId = createMemo(() => hash?.split('/')[0]);

  createEffect(() => {
    const details = saturnContext.state.multisigDetails;
    const ra = ringApisContext.state;
    const mid = saturnContext.state.multisigId;

    if (details && ra?.tinkernet && typeof mid === "number") {
      const acc = details.account;

      const runAsync = async () => {
        const iden = (
          (await ra.tinkernet.query.identity.identityOf(acc))?.toHuman() as {
            info: {
              display: { Raw: string; };
              image: { Raw: string; };
              twitter: { Raw: string; };
              web: { Raw: string; };
            };
          }
        )?.info;

        const name = iden?.display?.Raw ? iden.display.Raw : `Multisig ${ mid }`;
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
    }
  });

  createEffect(() => {
    const name = multisigIdentity().name;
    const address = saturnContext.state.multisigAddress;

    if (!address || name === "Multisig") return;

    setSaturnConnectAccount(name, address);
  });

  createEffect(on(getId, () => {
    const tinkernetApi = ringApisContext.state.tinkernet;
    const sat = saturnContext.state.saturn;
    const idOrAddress = getId();

    if (!tinkernetApi || !sat) return;

    const runAsync = async () => {
      if (location.pathname.endsWith('create') && !idOrAddress) return;

      let id;
      if (isAddress(idOrAddress)) {
        const result = await tinkernetApi.query.inv4.coreByAccount(idOrAddress);
        if (!result) {
          console.error('Result is null or undefined');
          return;
        }
        id = result.unwrapOr(null)?.toNumber();
        // Ensure id is within the safe range
        if (id && id > Number.MAX_SAFE_INTEGER) {
          console.error('ID exceeds safe integer range');
          return;
        }
      } else {
        id = parseInt(idOrAddress);
        // Check if id is a valid integer
        if (isNaN(id)) {
          console.error('Invalid id:', id);
          return;
        }
      }
      console.log('MainContainer id:', id);
      saturnContext.setters.setMultisigId(id);

      // Ensure id is a number before passing it to getDetails
      const numericId = Number(id);
      const maybeDetails = await sat.getDetails(numericId);

      if (maybeDetails) {
        saturnContext.setters.setMultisigDetails(maybeDetails);
        saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
      }
    };

    runAsync();
  }));

  return (
    <div class="m-5 lg:m-2">
      <MainContent />
    </div>
  );
};

MainContainer.displayName = 'MainContainer';
export default MainContainer;
