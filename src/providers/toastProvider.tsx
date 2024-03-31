import { createContext, useContext, JSX, createSignal, onMount, createMemo, onCleanup, createEffect } from 'solid-js';
import { Dismiss, initDismisses } from "flowbite";
import type { DismissInterface } from "flowbite";

export const TOAST_ALERT_ID = 'toastAlert';

export type ToastMessageType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default';

export interface ToastProps {
  message: string;
  type: ToastMessageType;
  id: string;
}

export type ToastContextType = {
  toast: ToastProps[];
  getToast: () => ToastProps[];
  addToast: (message: string, type: ToastMessageType) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextType>();

export function ToastProvider(props: { children: JSX.Element; }) {
  let timeouts: Map<string, NodeJS.Timeout> = new Map();

  const [toastInstance, setToastInstance] = createSignal<Map<string, DismissInterface>>(new Map());
  const [toasts, setToasts] = createSignal<ToastProps[]>([]);

  const getToast = () => toasts();

  const addToast = (message: string, type: ToastMessageType) => {
    const id = `toast-${ toasts().length }`;
    const newToast = { message, type, id };
    setToasts(currentToasts => {
      return [...currentToasts, newToast];
    });
    const timeoutId = setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
      timeouts.delete(id);
    }, 5000);
    timeouts.set(id, timeoutId);
  };

  const hideToast = () => {
    const currentToasts = toasts();
    const index = currentToasts.length - 1;
    if (index < 0 || index >= currentToasts.length) return;
    const { id } = currentToasts[index];
    setToasts(currentToasts.filter((_, i) => i !== index));
    const timeoutId = timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.delete(id);
    }
    const instance = toastInstance().get(id);
    if (instance) {
      instance.hide();
      instance.destroy();
    } else {
      console.error('No toast instance found for id:', id);
    }
  };

  onMount(() => {
    initDismisses();
  });

  createEffect(() => {
    const currentToasts = toasts();
    currentToasts.forEach(toast => {
      const toastElement = document.getElementById(`toast-${ toast.id }`);
      const toastHideElement = document.getElementById(`toast-hide-${ toast.id }`);
      if (toastElement && toastHideElement && !toastInstance().has(toast.id)) {
        const instance = new Dismiss(toastElement, toastHideElement, { transition: 'transition-transform', duration: 1000, timing: 'ease-in-out' });
        toastInstance().set(toast.id, instance);
        setToastInstance(new Map(toastInstance()));
      }
    });
  });

  onCleanup(() => {
    timeouts.forEach(timeoutId => clearTimeout(timeoutId));
  });

  const value = createMemo(() => ({
    toast: toasts(),
    getToast,
    addToast,
    hideToast,
  }));

  return (
    <ToastContext.Provider value={value()}>
      {props.children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast: cannot find a ToastContext");
  }

  return context;
}