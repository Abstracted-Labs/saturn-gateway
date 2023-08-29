export function removeAccountsModal() {
  const $modal = document.getElementById('accounts-modal');
  const $backdrop = document.querySelector('[modal-backdrop]');
  if (!$modal || !$backdrop) return;
  $modal?.classList.remove('hidden');
  $modal?.classList.add('flex');
  $backdrop?.classList.remove('hidden');
}