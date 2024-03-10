import { ProposalType } from "../providers/proposeProvider";
import { NetworkEnum } from "./consts";

type ProposalTypeProps = {
  fromChain: string;
  toChain: string;
  asset: string;
  toAddress: string;
  multisigAddress: string | undefined;
};

export default function getProposalType(props: ProposalTypeProps): ProposalType {
  const { fromChain, toChain, toAddress, multisigAddress } = props;

  if (fromChain === toChain && fromChain === NetworkEnum.TINKERNET && toChain === NetworkEnum.TINKERNET) {
    return ProposalType.LocalTransfer;
  } else if (fromChain === toChain && fromChain !== NetworkEnum.TINKERNET && toChain !== NetworkEnum.TINKERNET) {
    return ProposalType.XcmTransfer;
  } else if (toAddress === multisigAddress && fromChain !== toChain) {
    return ProposalType.XcmBridge;
  }

  return ProposalType.LocalCall;
}