import { Match, Switch, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
// import { WebGLRenderer, Scene, PerspectiveCamera, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, MathUtils, Color } from 'three';
// import HomeLogo from '../components/legos/HomeLogo';
import SaturnPlanetLight from '../assets/images/saturn-planet-light.svg';
import SaturnPlanetDark from '../assets/images/saturn-planet-dark.svg';
import { useThemeContext } from '../providers/themeProvider';
import ColorSwitch, { ColorModeEnum } from '../components/left-side/ColorSwitch';
import { WALLET_ACCOUNTS_MODAL_ID } from '../components/top-nav/ConnectWallet';
import { Modal, initModals } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import { useSelectedAccountContext } from '../providers/selectedAccountProvider';
import { useNavigate } from '@solidjs/router';
import { useSaturnContext } from '../providers/saturnProvider';

const Home = () => {
  let modal: ModalInterface;
  let cleanup = () => { };
  const [container, setContainer] = createSignal<HTMLElement>();
  const theme = useThemeContext();
  const nav = useNavigate();
  const saturnContext = useSaturnContext();
  const selectedAccount = useSelectedAccountContext();
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const $modalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);
  const alreadyLoggedIn = createMemo(() => !!selectedAccount.state.account);

  const modalOptions: ModalOptions = {
    backdrop: 'dynamic',
    closable: true,
  };

  function togglePalette(e: any) {
    e.preventDefault();
    return; // prevent toggling to light mode for now

    // if set via local storage previously
    // if (isLightTheme()) {
    //   document.documentElement.classList.add(ColorModeEnum.DARK);
    //   theme.setMode(ColorModeEnum.DARK);
    // } else {
    //   document.documentElement.classList.remove(ColorModeEnum.DARK);
    //   theme.setMode(ColorModeEnum.LIGHT);
    // }
  }

  function openConnectWallet() {
    const multisigId = saturnContext.state.multisigId;
    if (alreadyLoggedIn() && !!multisigId) {
      if (!!multisigId) {
        nav(`/${ multisigId }/members`);
        return;
      } else {
        nav('/create');
        return;
      }
      return;
    }

    // if (modal) {
    //   if (modal.isHidden() && !alreadyLoggedIn()) {
    //     modal.show();
    //   }
    // }
  }

  onMount(() => {
    initModals();
    if (!$modalElement()) {
      modal = new Modal($modalElement(), modalOptions);
    }
  });

  // createEffect(() => {
  //   cleanup(); // Clean up the previous scene

  //   const scene = new Scene();
  //   scene.background = isLightTheme() ? new Color(0xF9F9FB) : new Color(0x000000); // Set bg color

  //   const renderer = new WebGLRenderer();
  //   renderer.setSize(window.innerWidth, window.innerHeight);

  //   const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  //   camera.position.z = 5;

  //   const vertices = [];
  //   for (let i = 0; i < 10000; i++) {
  //     vertices.push(
  //       MathUtils.randFloatSpread(2000), // x
  //       MathUtils.randFloatSpread(2000), // y
  //       MathUtils.randFloatSpread(2000)  // z
  //     );
  //   }

  //   const starsGeometry = new BufferGeometry();
  //   starsGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

  //   const starsMaterial = new PointsMaterial({
  //     color: isLightTheme() ? 0x888893 : 0xF9F9FB, // Set stars color based on theme
  //     size: Math.random() * 2.3,
  //     sizeAttenuation: true,
  //   });

  //   const starField = new Points(starsGeometry, starsMaterial);
  //   scene.add(starField);

  //   const animate = () => {
  //     requestAnimationFrame(animate);
  //     starField.rotation.x += 0.001;
  //     starField.rotation.y += 0.001;
  //     renderer.render(scene, camera);
  //   };

  //   container()?.appendChild(renderer.domElement);
  //   animate();

  //   cleanup = () => {
  //     container()?.removeChild(renderer.domElement);
  //     renderer.dispose();
  //     scene.remove(starField);
  //     starsMaterial.dispose();
  //     starsGeometry.dispose();
  //   };
  // });

  return (
    <div class="relative">
      {/* <div ref={setContainer} class="absolute" /> */}
      <div class="fixed left-[-50%] top-[-50%] overflow-hidden h-[200%] w-[200%]">
        <div class="rotate-background" />
      </div>
      <div class="absolute z-1">
        <div class="flex items-center justify-center text-center translate-y-[25%] lg:translate-y-[50%]">
          <div class="flex flex-col items-around inset-0 text-center">
            {/* <div class="text-center px-20 mx-auto mb-20">
              <HomeLogo />
            </div> */}
            <h1 class="text-5xl/none lg:text-6xl/none h-32 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF]">One Multisig.<br />
              Any Blockchain.
            </h1>
            <h2 class={`${ !isLightTheme() ? 'text-white' : 'text-black' } text-xl lg:text-2xl mb-5 mt-2`}>Welcome to the future of asset management.</h2>
            <p class={`${ !isLightTheme() ? 'text-white' : 'text-black' } text-sm/tight w-2/3 px-10 block text-center mx-auto`}>A multichain multisig secured by Polkadot that can manage assets across any blockchain.</p>
            <button type="button" class="z-20 text-white w-1/2 md:w-1/3 mx-auto my-5 bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF] focus:outline-saturn-purple focus:ring-none font-bold rounded-md text-sm px-5 py-5 text-center" onClick={openConnectWallet} data-modal-target={WALLET_ACCOUNTS_MODAL_ID} data-modal-show={WALLET_ACCOUNTS_MODAL_ID} >Enter the Gateway</button>
            <ColorSwitch />
          </div>
        </div>
        <div class="relative w-screen">
          <div class="fixed w-screen h-auto xs:bottom-[-20%] sm:bottom-[-15%] lg:bottom-0" onClick={togglePalette}>
            <Switch>
              <Match when={isLightTheme()}>
                <div class="overflow-hidden h-[190px]">
                  <img src={SaturnPlanetLight} alt="Saturn Planet" />
                </div>
              </Match>
              <Match when={!isLightTheme()}>
                <div class="overflow-hidden h-[190px]">
                  <img src={SaturnPlanetDark} alt="Saturn Planet" />
                </div>
              </Match>
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;