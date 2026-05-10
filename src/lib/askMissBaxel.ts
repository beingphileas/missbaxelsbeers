// Tiny pub/sub so any component can pre-fill and open the WhisperFAB.
export const ASK_EVENT = 'missbaxel:ask';

export function askMissBaxel(query: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { query } }));
}
