import ConnectWallet from "../components/top-nav/ConnectWallet";

const Welcome = () => {
  return (
    <div class="text-xs mx-auto text-center">
      <h1 class="text-lg font-bold">Welcome to Saturn Gateway</h1>
      <p class="mt-1">To get started, please connect your wallet.</p>
      <ConnectWallet inMultisig={true} />
    </div>
  );
};

Welcome.displayName = 'Welcome';
export default Welcome;