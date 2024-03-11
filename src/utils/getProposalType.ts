import { ProposalType } from "../providers/proposeProvider";
import { NetworkEnum } from "./consts";

type ProposalTypeProps = {
  fromChain: string;
  toChain: string;
};

export default function getProposalType(props: ProposalTypeProps): ProposalType {
  const { fromChain, toChain } = props;

  if (fromChain === NetworkEnum.TINKERNET && toChain === NetworkEnum.TINKERNET) {
    return ProposalType.LocalTransfer;
  } else if (fromChain === NetworkEnum.TINKERNET && toChain !== NetworkEnum.TINKERNET) {
    return ProposalType.XcmTransfer;
  } else if (fromChain !== NetworkEnum.TINKERNET && fromChain !== toChain) {
    return ProposalType.XcmBridge;
  }

  return ProposalType.LocalCall;
}