import { Show, createEffect, createSignal, on } from "solid-js";

const AvatarAndName = (props: { name: string | undefined, avatar: string, enlarge: boolean; }) => {
  return (
    <span class="mr-10 flex items-center gap-1">
      {props.avatar ? <span class={`${ !props.enlarge ? 'w-4 h-4' : 'w-6 h-6' } rounded-full bg-saturn-purple mr-1`}><img alt="user-avatar" width={props.enlarge ? 24 : 16} height={props.enlarge ? 24 : 16} src={props.avatar} /></span> : <div class={`${ !props.enlarge ? 'w-4 h-4' : 'w-6 h-6' } rounded-full bg-saturn-purple mr-1`}></div>}
      <span class={`${ props.enlarge ? 'text-lg' : 'text-sm' } text-saturn-black dark:text-saturn-offwhite`}>{props.name ?? 'Login'}</span>
    </span>
  );
};

AvatarAndName.displayName = "AvatarAndName";
export default AvatarAndName;