import { createSignal, Show, For, createEffect, type Setter } from 'solid-js';
import { type Saturn } from '@invarch/saturn-sdk';
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
	Select,
	SelectTrigger,
	SelectValue,
	SelectIcon,
	SelectContent,
	SelectListbox,
	SelectOption,
	SelectOptionText,
	SelectOptionIndicator,
	Switch,
} from '@hope-ui/solid';
import { type ApiPromise } from '@polkadot/api';
import { BN, u8aToHex } from '@polkadot/util';
import type { AnyJson } from '@polkadot/types/types/codec';

import { NetworksByAsset } from '../data/rings';

export type TransferModalProps = {
	open: {network: string; asset: string} | undefined;
	setOpen: Setter<{network: string; asset: string} | undefined>;
	saturn: Saturn | undefined;
	multisigId: number | undefined;
	multisigAddress: string | undefined;
	ringApis: Record<string, ApiPromise> | undefined;
	setProposeModalOpen: Setter<boolean>;
	setCurrentCall: Setter<Uint8Array>;
};

export default function ProposeModal(props: TransferModalProps) {
	const [amount, setAmount] = createSignal<number>(0);
	const [possibleNetworks, setPossibleNetworks] = createSignal<string[]>([]);
	const [initialNetwork, setInitialNetwork] = createSignal<string>('');
	const [finalNetworkPair, setFinalNetworkPair] = createSignal<{from: string; to: string}>({ from: '', to: '' });
	const [targetAddress, setTargetAddress] = createSignal<string>('');
	const [bridgeToSelf, setBridgeToSelf] = createSignal<boolean>(false);

	createEffect(() => {
		const a = props.open?.asset;
		const n = props.open?.network;

		if (a && n && NetworksByAsset[a]) {
			setPossibleNetworks(NetworksByAsset[a]);
			setInitialNetwork(n);
			setFinalNetworkPair({ from: n, to: n });
		}
	});

	const proposeTransfer = async () => {
		const asset = props.open?.asset;

		if (!props.saturn || typeof props.multisigId !== 'number' || !props.multisigAddress || !props.ringApis || !asset || amount() <= 0) {
			return;
		}

		const pair = finalNetworkPair();

		console.log('pair: ', pair);
		console.log('asset: ', asset);

		let call;

		if (pair.from == 'tinkernet' && pair.to == 'tinkernet') {
			if (asset == 'TNKR') {
				call = props.ringApis.tinkernet.tx.balances.transferKeepAlive(targetAddress(), new BN(amount()).mul(new BN('1000000000000')).toString()).unwrap().toU8a();
			} else if (asset == 'KSM') {
				call = props.ringApis.tinkernet.tx.tokens.transferKeepAlive(targetAddress(), 1, new BN(amount()).mul(new BN('1000000000000')).toString()).unwrap().toU8a();
			}
		} else if (pair.from == 'tinkernet' && pair.to != 'tinkernet') {
			// Handle bridging TNKR or KSM from Tinkernet to other chains.
		} else if (pair.from != 'tinkernet' && pair.to == 'tinkernet') {
			// Handle bridging TNKR or KSM from other chains to Tinkernet.
		} else if (pair.from != 'tinkernet' && pair.to != 'tinkernet' && pair.from != pair.to) {
			// Handle bridging assets between other chains.
		} else if (pair.from != 'tinkernet' && pair.to != 'tinkernet' && pair.from == pair.to) {
			// Handle balance transfer of assets within another chain.
			const assetXcmRep = props.saturn.chains.find(c => c.chain.toLowerCase() == pair.from)?.assets.find(a => a.label == asset)?.registerType;

			console.log(assetXcmRep);

			if (!assetXcmRep || !props.ringApis?.[pair.from]) {
				return;
			}

			const estimateFee = (await props.ringApis[pair.from].tx.balances.transfer(targetAddress(), new BN(amount())).paymentInfo(props.multisigAddress)).partialFee;

			const ac = props.saturn.transferXcmAsset({
				id: props.multisigId,
				asset: assetXcmRep,
				amount: new BN(amount()),
				to: targetAddress(),
				xcmFeeAsset: assetXcmRep,
				xcmFee: estimateFee.mul(new BN('2')),
			}).call.toHuman();

			if (!ac) {
				return;
			}

			console.log('ac: ', ac);

			const maybeCall = (((ac as Record<string, AnyJson>).method as Record<string, AnyJson>).args as Record<string, AnyJson>).call;

			console.log('maybeCall: ', maybeCall);

			if (!maybeCall) {
				return;
			}

			//call = maybeCall.toU8a();
		}

		if (call) {
			console.log('call bfr: ', u8aToHex(call));
			props.setCurrentCall(call);
			props.setProposeModalOpen(true);
			props.setOpen(undefined);
		}
	};

	return (
		<Modal opened={Boolean(props.open)} onClose={() => {
			props.setOpen(undefined);
		}}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>Propose Asset Transfer</ModalHeader>
				<ModalBody>
					<div class='flex flex-col gap-1'>
						<div class='flex flex-row'>
							<Select value={finalNetworkPair().from} onChange={v => setFinalNetworkPair({ from: v, to: finalNetworkPair().to }) }>
								<SelectTrigger>
									<SelectValue class='capitalize' />
									<SelectIcon />
								</SelectTrigger>
								<SelectContent>
									<SelectListbox>
										<For each={possibleNetworks()}>
											{item => (
												<SelectOption value={item}>
													<SelectOptionText class='capitalize'>{item}</SelectOptionText>
													<SelectOptionIndicator />
												</SelectOption>
											)}
										</For>
									</SelectListbox>
								</SelectContent>
							</Select>
							<Select value={finalNetworkPair().to} onChange={v => setFinalNetworkPair({ from: finalNetworkPair().from, to: v }) }>
								<SelectTrigger>
									<SelectValue class='capitalize' />
									<SelectIcon />
								</SelectTrigger>
								<SelectContent>
									<SelectListbox>
										<For each={possibleNetworks()}>
											{item => (
												<SelectOption value={item}>
													<SelectOptionText class='capitalize'>{item}</SelectOptionText>
													<SelectOptionIndicator />
												</SelectOption>
											)}
										</For>
									</SelectListbox>
								</SelectContent>
							</Select>
						</div>
						<Show when={ finalNetworkPair().from != finalNetworkPair().to }>
							<Switch defaultChecked={false} onChange={e => setBridgeToSelf(!bridgeToSelf())}>Bridge To Self</Switch>
						</Show>
						<Input
							placeholder='Address'
							value={bridgeToSelf() ? props.multisigAddress : targetAddress()}
							disabled={bridgeToSelf()}
							onInput={e => setTargetAddress(e.currentTarget.value)}
						/>
						<Input
							placeholder='Amount'
							value={amount()}
							onInput={e => {
								const a = parseInt(e.currentTarget.value);
								if (typeof a === 'number') {
									setAmount(a);
								}
							}}
						/>
						<Button onClick={() => proposeTransfer()}>Propose</Button>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button onClick={() => {
						props.setOpen(undefined);
					}}>Cancel</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
