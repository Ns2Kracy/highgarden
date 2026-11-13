import { useMutation, useQuery } from "@tanstack/solid-query";
import { Loading, createSignal, onCleanup } from "solid-js";
import { Greeter, events } from "../mygo";

export default function HomePage() {
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: Greeter.info }));
  const greeting = useMutation(() => ({ mutationFn: Greeter.greet }));
  const [clock, setClock] = createSignal("--:--:--");

  onCleanup(events.tick.on((time) => setClock(new Date(time).toLocaleTimeString())));

  return (
    <main>
      <h1>highgarden</h1>
      <p class="muted">Go ↔ TypeScript, fully typed.</p>
      <form
        id="greet"
        onSubmit={(event) => {
          event.preventDefault();
          greeting.mutate(String(new FormData(event.currentTarget).get("name") ?? ""));
        }}
      >
        <input
          id="name"
          name="name"
          aria-label="Your name"
          placeholder="Your name"
          autocomplete="off"
          autofocus
        />
        <button type="submit" disabled={greeting.isPending}>
          Greet
        </button>
      </form>
      <p id="greeting" class="card" aria-live="polite">
        {greeting.error?.message ?? greeting.data ?? ""}
      </p>
      <p class="muted">
        <span id="info">
          {info.isError ? (
            info.error?.message
          ) : (
            <Loading>
              {info.data.os}/{info.data.arch} · {info.data.goVersion}
            </Loading>
          )}
        </span>{" "}
        · <span id="clock">{clock()}</span>
      </p>
    </main>
  );
}
