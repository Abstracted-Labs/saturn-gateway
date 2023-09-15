import { JSX, JSXElement, children, createMemo, createSignal, mergeProps } from 'solid-js';
import { INPUT_COMMON_STYLE } from '../../utils/consts';

interface SaturnTextFieldType extends JSX.HTMLAttributes<HTMLInputElement | MouseEvent> {
  initialValue?: string;
  currentValue?: (currentValue: string) => void;
};

const MATH_STYLE = 'text-saturn-purple text-lg p-1 rounded-md focus:outline-saturn-purple grow dark:text-white opacity-50 hover:opacity-100';

const SaturnNumberInput = (props: SaturnTextFieldType) => {
  const [text, setText] = createSignal<string>(props.initialValue || '');

  function preventNonNumberInput(value: string): boolean {
    return /^\d+$/.test(value) || value === '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Backspace' && !preventNonNumberInput(e.key)) {
      e.preventDefault();
      return;
    }
  }

  function handleInput(e: InputEvent) {
    const value = (e.target as HTMLInputElement).value;

    if (value === '' && props.currentValue) {
      setText(props.initialValue || '0');
      props.currentValue(props.initialValue || '0');
    }

    if (preventNonNumberInput(value) && props.currentValue) {
      setText(value);
      props.currentValue(value);
    }
  }

  function decrement() {
    const amount = text() || '0';
    const currentValue = parseInt(amount);

    if (currentValue > 0 && props.currentValue) {
      setText(`${ currentValue - 1 }`);
      props.currentValue(`${ currentValue - 1 }`);
    }

    return;
  }

  function increment() {
    const amount = text() || '0';
    const currentValue = parseInt(amount);

    if (props.currentValue) {
      setText(`${ currentValue + 1 }`);
      props.currentValue(`${ currentValue + 1 }`);
    }

    return;
  }

  return <div class="flex flex-row gap-1 items-center">
    <button type="button" class={MATH_STYLE} onClick={decrement}>-</button>
    <input class={`${ INPUT_COMMON_STYLE } text-center w-10 h-10 p-2`} type="text" value={text()} onKeyDown={handleKeyDown} onInput={handleInput} />
    <button type="button" class={MATH_STYLE} onClick={increment}>+</button>
  </div>;
};

SaturnNumberInput.displayName = 'SaturnNumberInput';
export default SaturnNumberInput;