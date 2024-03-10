import { createEffect, createSignal } from "solid-js";
import { useRingApisContext } from "../../providers/ringApisProvider";
import BigNumber from "bignumber.js";
import WalletIcon from "../../assets/icons/wallet-icon.svg";
import { formatAsset } from "../../utils/formatAsset";

type BalancePrimitiveType = {
  nonce: string;
  consumers: string;
  providers: string;
  sufficients: string;
  data: {
    free: string;
    reserved: string;
    frozen: string;
  };
};

type AssetReturnType = { free: number, reserved: number, frozen: number; };

const NetworkBalance = (props: { address: string | undefined; }) => {
  const [tnkrBalance, setTnkrBalance] = createSignal<string | null>(null);
  const [ksmBalance, setKsmBalance] = createSignal<string | null>(null);
  const rings = useRingApisContext();

  const setBalanceTNKR = async () => {
    try {
      if (!rings.state.tinkernet || !props.address) return;

      await rings.state.tinkernet.query.system.account(props.address, (account) => {
        const balance = account.toPrimitive() as BalancePrimitiveType;
        const total = new BigNumber(balance.data.free.toString());
        const frozen = new BigNumber(balance.data.frozen.toString());
        const reserved = new BigNumber(balance.data.reserved.toString());
        const transferable = total.minus(frozen).minus(reserved);
        const formattedBalance = formatAsset(transferable.toString(), 12, 2);

        setTnkrBalance(formattedBalance);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const setBalanceKSM = async () => {
    try {
      if (!rings.state.tinkernet || !props.address) return;

      const accountInfo = await rings.state.tinkernet.query.tokens.accounts(props.address, 1);
      const { free: total, reserved, frozen } = accountInfo.toHuman() as unknown as AssetReturnType;
      const formatTotal = new BigNumber(total.toString());
      const formatFrozen = new BigNumber(frozen.toString());
      const formatReserve = new BigNumber(reserved.toString());
      const transferable = formatTotal.minus(formatFrozen).minus(formatReserve);
      const formattedBalance = formatAsset(transferable.toString(), 10);

      setKsmBalance(formattedBalance);
    } catch (error) {
      console.error(error);
    }
  };

  createEffect(() => {
    setBalanceTNKR();
    setBalanceKSM();
  });

  return (
    <div class="flex items-start flex-row gap-2">
      <img src={WalletIcon} alt="purple-wallet-icon" class="mt-[2px]" />
      <div>
        <div class="flex justify-end flex-row gap-1 text-saturn-black dark:text-saturn-offwhite">
          <span>{tnkrBalance()}</span>
          <span>TNKR</span>
        </div>
        <div class="flex justify-end flex-row gap-1 text-saturn-black dark:text-saturn-offwhite">
          <span>{ksmBalance()}</span>
          <span>KSM</span>
        </div>
      </div>
    </div>
  );
};

NetworkBalance.displayName = "NetworkBalance";
export default NetworkBalance;