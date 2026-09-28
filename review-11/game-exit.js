import {returnDestination} from './game-game-services.js';

export function needsExitConfirmation(phase) {
  return phase === 'playing';
}

export function exitView(variant, savingAvailable) {
  const progress = savingAvailable
    ? 'Completed chapters stay saved on this browser. This unfinished chapter will restart when you return.'
    : 'Browser saving is unavailable. Leaving will lose this run.';
  return `<div class="modal-scrim"><section class="modal exit-modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-title"><span class="eyebrow">TAKE A BREATHER</span><h2 id="modal-title">Back to the website?</h2><p>${progress}</p><p>The clock is paused while you decide.</p><a class="primary" aria-label="Leave game and return to NOW" href="${returnDestination(variant)}">Back to NOW <span aria-hidden="true">↗</span></a><button class="quiet-button" data-action="resume">Keep playing</button></section></div>`;
}

export function installGameExit(link, variant, isPlaying, requestExit) {
  link.href = returnDestination(variant);
  link.addEventListener('click', event => {
    // Preserve modified-link behaviour (for example opening the site in a new tab).
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isPlaying()) {
      event.preventDefault();
      requestExit();
    }
  });
}
