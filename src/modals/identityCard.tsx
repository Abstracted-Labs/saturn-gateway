import { createSignal, Show, For, createEffect, type Setter } from 'solid-js';
import { type MultisigCall, type Saturn } from '@invarch/saturn-sdk';
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Tabs,
    Tab,
    TabList,
    TabPanel,

} from '@hope-ui/solid';
import { type ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import { BigNumber } from 'bignumber.js';

import { useIdentityContext } from "../providers/identityProvider";
import { type AggregatedIdentity } from "../utils/identityProcessor";

export default function IdentityCardModal() {
    const identityContext = useIdentityContext();

    const getIdentity = (): AggregatedIdentity | undefined => {
        return identityContext.state?.identity;
    }

    createEffect(() => {});

	  const close = () => {
		    identityContext.setters.closeModal();
	  };

    return (
        <Modal size="2xl" opened={!!identityContext.state.identity} onClose={() => close()}>
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton />
                <ModalHeader>{getIdentity()?.address}</ModalHeader>
                <ModalBody>
                    <Tabs>
                        <TabList>
                            <Tab>Aggregated</Tab>
                            <For each={getIdentity()?.otherIdentities}>
                                {(i) => <Tab>{i.service}</Tab>}
                            </For>
                        </TabList>
                        <TabPanel>
                            {getIdentity()?.image?.value && <img class="h-[40px] w-[40px] rounded-full" src={getIdentity()?.image?.value} />}
                            {getIdentity()?.name && <p>Display Name: {getIdentity()?.name}</p>}
                            {getIdentity()?.legal && <p>Legal Name: {getIdentity()?.legal}</p>}
                            {getIdentity()?.twitter && <p>Twitter: {getIdentity()?.twitter}</p>}
                            {getIdentity()?.discord && <p>Discord: {getIdentity()?.discord}</p>}
                            {getIdentity()?.telegram && <p>Telegram: {getIdentity()?.telegram}</p>}
                            {getIdentity()?.web && <p>Website: {getIdentity()?.web}</p>}
                        </TabPanel>
                        <For each={getIdentity()?.otherIdentities}>
                            {(i) => <TabPanel>
                                {i.image?.value && <img class="h-[40px] w-[40px] rounded-full" src={i.image.value} />}
                                {i.name && <p>Display Name: {i.name}</p>}
                                {i.legal && <p>Legal Name: {i.legal}</p>}
                                {i.twitter && <p>Twitter: {i.twitter}</p>}
                                {i.discord && <p>Discord: {i.discord}</p>}
                                {i.telegram && <p>Telegram: {i.telegram}</p>}
                                {i.web && <p>Website: {i.web}</p>}
                            </TabPanel>}
                        </For>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
