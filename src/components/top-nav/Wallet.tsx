import { createSignal, For, createEffect, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Input,
  Table,
  Tbody,
  Tr,
  Td,
} from '@hope-ui/solid';
import {
  WalletAggregator,
  type BaseWallet,
  type Account,
} from '@polkadot-onboard/core';

import { useSelectedAccountContext, SelectedAccountProvider } from "../../providers/selectedAccountProvider";
import { walletAggregator } from "../../App";

const Wallet = ({ ...props }) => {
  const [walletModalOpen, setWalletModalOpen] = createSignal<boolean>(false);
  const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = createSignal<{ wallet: BaseWallet, accounts: Account[]; }>();

  setAvailableWallets(walletAggregator.getWallets());

  const selectedAccountContext = useSelectedAccountContext();

  const connectUserWallet = async (wallet: BaseWallet) => {
    await wallet.connect();
    setAvailableAccounts({ wallet, accounts: await wallet.getAccounts() });
  };

  const connectUserAccount = async (acc: Account, wallet?: BaseWallet,) => {
    if (wallet) {
      selectedAccountContext.setters.setSelected(acc, wallet);
      setWalletModalOpen(false);
    }
  };

  return <>
    <Button
      onClick={() => setWalletModalOpen(true)}
      class='gap-1 rounded-tr-3xl self-start bg-[#D55E8A] hover:bg-[#E40C5B]'
    >
      {selectedAccountContext.state.account?.name || 'Log In'}
    </Button>
    <Portal>
      <Modal
        opened={walletModalOpen()}
        onClose={() => setWalletModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Choose a wallet</ModalHeader>
          <ModalBody>
            <div class='flex flex-col gap-1'>
              <Show
                when={availableAccounts()?.accounts[0]}
                fallback={
                  <For each={availableWallets()}>
                    {wallet => (
                      <Button
                        class='gap-1 bg-[#D55E8A] hover:bg-[#E40C5B] capitalize'
                        onClick={() => connectUserWallet(wallet)}
                      >
                        {wallet.type === "WALLET_CONNECT" ? "Wallet Connect" : wallet.metadata.title}
                      </Button>
                    )}
                  </For>
                }
              >
                <For each={availableAccounts()?.accounts}>
                  {acc => (
                    <Button
                      class='bg-[#D55E8A] hover:bg-[#E40C5B]'
                      onClick={() => connectUserAccount(acc, availableAccounts()?.wallet)}
                    >
                      {acc.name}
                    </Button>
                  )}
                </For>
              </Show>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              class='bg-[#D55E8A] hover:bg-[#E40C5B]'
              onClick={() => setWalletModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Portal>
  </>;
};

Wallet.displayName = 'Wallet';
export default Wallet;
