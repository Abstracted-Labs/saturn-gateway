import { createMemo, createSignal } from 'solid-js';
import { useThemeContext } from '../providers/themeProvider';
import ColorSwitch from '../components/left-side/ColorSwitch';
import { useNavigate } from '@solidjs/router';
import { useSaturnContext } from '../providers/saturnProvider';

const Home = () => {
  const [isHovered, setHovered] = createSignal(false);

  const theme = useThemeContext();
  const nav = useNavigate();
  const saturnContext = useSaturnContext();

  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const multisigId = createMemo(() => saturnContext.state.multisigId);

  const enterGateway = async () => {
    const id = multisigId();
    setHovered(true);

    try {
      if (!!id) {
        nav(`/${ id }/assets`);
      } else {
        // console.error('No multisig id found');
        nav(`${ undefined }/assets`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div class="relative">
      {/* <div ref={setContainer} class="absolute" /> */}
      <div class="fixed left-[-50%] top-[-50%] overflow-hidden h-[200%] w-[200%]">
        <div class="rotate-background" />
        <div class="rotate-background2" />
      </div>
      <div id="planetContainer" />
      <div class="flex items-center justify-center text-center translate-y-[25%] md:translate-y-[50%]">
        <div class="flex flex-col justify-center items-around inset-0 text-center">
          <h1 class="text-4xl/none md:text-5xl/none lg:text-6xl/none h-auto lg:h-32 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF]">One Multisig.<br />
            Any Blockchain.
          </h1>
          <h2 class={`${ !isLightTheme() ? 'text-white' : 'text-black' } text-md md:text-xl lg:text-2xl mb-5 mt-2`}>Welcome to the future of asset management.</h2>
          <button
            id="enter"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={() => setHovered(true)}
            onTouchEnd={() => setHovered(false)}
            onClick={enterGateway}
            class="z-20 relative my-5 p-0.5 overflow-hidden text-sm font-bold w-1/2 md:w-1/3 mx-auto rounded-md group bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF] focus:outline-none focus:ring-saturn-purple dark:focus:ring-saturn-purple hover:text-black">
            <span class="w-full h-14 flex items-center justify-center block mx-auto transition-all ease-in duration-75 bg-white dark:bg-black rounded-md group-hover:bg-opacity-0">
              <span class={`${ !isHovered() ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF]' : 'text-black' } visited:text-black`}>Enter the Omniway</span>
            </span>
          </button>
          <ColorSwitch />
        </div>
      </div>
    </div>
  );
};

export default Home;