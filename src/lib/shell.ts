import { createSignal } from "solid-js";

const [commandOpen, setCommandOpen] = createSignal(false);

export { commandOpen };

export function openCommandPalette(): void {
  setCommandOpen(true);
}

export function closeCommandPalette(): void {
  setCommandOpen(false);
}

export function toggleCommandPalette(): void {
  setCommandOpen((open) => !open);
}
