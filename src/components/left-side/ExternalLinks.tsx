import ExternalLinkIcon from '../../assets/icons/external-link-icon-16x16.svg';
import { For } from 'solid-js';

const links: [string, string][] = [
  ["Docs", "#"],
  ["Support", "#"],
  ["𝕏", "#"],
  ["Discord", "#"]
];

function renderExternalLink(name: string, href: string) {
  return <li class="text-saturn-lightgrey hover:text-saturn-yellow">
    <a href={href} class="flex items-center py-1.5 rounded-md">
      <span class="mr-2">{name}</span>
      <img src={ExternalLinkIcon} alt="external-link-icon" />
    </a>
  </li>;
}

const ExternalLinks = () => {
  return <ul class="space-y-0.5 text-sm">
    <For each={links}>
      {(link) => renderExternalLink(link[0], link[1])}
    </For>
  </ul>;
};

ExternalLinks.displayName = "ExternalLinks";
export default ExternalLinks;