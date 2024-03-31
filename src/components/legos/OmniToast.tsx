import { For, Show, createEffect, createSignal } from 'solid-js';
import { TOAST_ALERT_ID, ToastMessageType, ToastProps, useToast } from '../../providers/toastProvider';
import LoaderAnimation from './LoaderAnimation';

function displayMessageStyle(type: ToastMessageType) {
  switch (type) {
    case 'success':
      return 'border-saturn-green';
    case 'error':
      return 'border-saturn-red';
    case 'warning':
      return 'border-saturn-yellow';
    case 'info':
      return 'border-saturn-blue';
    default:
      return 'border-saturn-purple';
  }
}

function OmniToast() {
  const [toasts, setToasts] = createSignal<ToastProps[]>([]);
  const { hideToast, getToast } = useToast();

  createEffect(() => {
    const currentToasts = getToast();
    setToasts(currentToasts);
  });


  return (
    <div id={TOAST_ALERT_ID} role="alert" class="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 my-3">
      <For each={toasts()}>{(toast, index) => (
        <div id={`toast-${ toast.id }`} class={`flex flex-row items-center justify-between gap-5 text-xs py-2 px-3 border bg-saturn-black rounded-lg ${ displayMessageStyle(toast.type) } transition-transform transform translate-y-2`}>
          <div class="flex flex-row gap-1">
            <Show when={toast.type === 'loading'}>
              <LoaderAnimation />
            </Show>
            <span>{toast.message}</span>
          </div>
          <button id={`toast-hide-${ toast.id }`} type="button" data-dismmiss-target={`#toast-${ index() }`} onClick={hideToast} class="focus:outline-none opacity-60 hover:opacity-90 hover:pointer-cursor">
            <svg class="w-2 h-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
      )}</For>
    </div>
  );
}

export default OmniToast;