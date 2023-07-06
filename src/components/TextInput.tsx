import { Show, mergeProps, type Component } from "solid-js";
import { createFormControl, type IFormControl } from "solid-forms";
import { Input } from '@hope-ui/solid';

export default function TextInput(passedProps: {
    control?: IFormControl<string>;
    name?: string;
    type?: string;
}) {
  const props = mergeProps({ control: createFormControl(""), type: "text" }, passedProps);

  return (
      <div
          classList={{
              "is-invalid": !!props.control.errors,
              "is-touched": props.control.isTouched,
              "is-required": props.control.isRequired,
          }}
      >
          <Input
              name={props.name}
              type={props.type}
              value={props.control.value}
              onInput={(e) => {
                  props.control.setValue(e.currentTarget.value);
              }}
              onBlur={() => props.control.markTouched(true)}
              required={props.control.isRequired}
          />

          <Show when={props.control.isTouched && props.control.errors?.isMissing}>
              <small>Answer required.</small>
          </Show>
      </div>
  );
};
