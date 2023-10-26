import { useLocation } from "@solidjs/router";
import { Match, Switch, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js";
import LoaderAnimation from "./LoaderAnimation";

interface IAvatarAndNameProps { name: string | undefined, avatar: string, enlarge: boolean; hide?: boolean; }

const AvatarAndName = (props: IAvatarAndNameProps) => {
  const [loading, setLoading] = createSignal(true);

  const location = useLocation();

  const getPath = createMemo(() => location.pathname);
  const atHome = createMemo(() => getPath() === '/');

  createEffect(on(() => props.name, () => {
    let timeout: any;

    const delay = () => {
      if (!!props.name) {
        timeout = setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };

    delay();

    onCleanup(() => {
      setLoading(true);
    });
  }));

  return (
    <span class="mr-10 flex items-center gap-1">
      <Switch>
        <Match when={loading()}>
          <LoaderAnimation text="Loading..." />
        </Match>
        <Match when={!loading()}>
          {props.avatar ? <span class={`${ !props.enlarge ? 'w-4 h-4' : 'w-6 h-6' } rounded-full bg-saturn-purple mr-1 transform-all `}><img alt="user-avatar" width={props.enlarge ? 24 : 16} height={props.enlarge ? 24 : 16} src={props.avatar} /></span> : <div class={`${ !props.enlarge ? 'w-4 h-4' : 'w-6 h-6' } rounded-full bg-saturn-purple mr-1`}></div>}
          <span class={`${ props.enlarge ? 'text-lg' : 'text-sm' } text-saturn-black dark:text-saturn-offwhite`}>{props.name ? props.name : !atHome() ? 'Login' : 'Launch App'}</span>
        </Match>
      </Switch>
    </span>
  );
};

AvatarAndName.displayName = "AvatarAndName";
export default AvatarAndName;