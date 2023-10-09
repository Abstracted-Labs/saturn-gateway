import { isAddress } from "@polkadot/util-crypto";
import { useParams } from "@solidjs/router";
import { createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { setSaturnConnectAccount } from "../../utils/setupSaturnConnect";
import IdentityCardModal from "../modals/identityCard";
import ProposeModal from "../modals/propose";
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
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const params = useParams();
  const { idOrAddress } = params;

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

  createEffect(() => {
    const tinkernetApi = ringApisContext.state.tinkernet;
    const sat = saturnContext.state.saturn;

    if (!tinkernetApi || !sat) return;

    const runAsync = async () => {
      if (isAddress(idOrAddress)) {
        const id = (await tinkernetApi.query.inv4.coreByAccount(idOrAddress))
          .unwrapOr(null)
          ?.toNumber();

        if (typeof id === 'number') {
          saturnContext.setters.setMultisigId(id);

          const maybeDetails = await sat.getDetails(id);

          if (maybeDetails) {
            saturnContext.setters.setMultisigDetails(maybeDetails);

            saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
          }
        }
      } else {
        const numberId = parseInt(idOrAddress);

        saturnContext.setters.setMultisigId(numberId);

        const maybeDetails = await sat.getDetails(numberId);

        if (maybeDetails) {
          saturnContext.setters.setMultisigDetails(maybeDetails);

          saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
        }
      }
    };

    runAsync();
  });

  return (
    <div class="m-2">
      <MainContent />
      <Portal>
        <ProposeModal />
        <IdentityCardModal />
      </Portal>
    </div>
  );
};

MainContainer.displayName = 'MainContainer';
export default MainContainer;
