import { render } from "@solidjs/web";
import { QueryClientProvider } from "@tanstack/solid-query";
import { RouterProvider } from "@tanstack/solid-router";
import { Loading, lazy } from "solid-js";
import { queryClient } from "./lib/query";
import { startPreferences } from "./lib/preferences";
import { router } from "./router";

const Devtools = import.meta.env.DEV ? lazy(() => import("./devtools")) : () => null;

if (import.meta.env.DEV) {
  window.addEventListener("error", (event) => {
    console.error("[app] uncaught:", event.error?.stack ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[app] unhandled:", (event.reason as Error)?.stack ?? event.reason);
  });
}

startPreferences();

const dispose = render(
  () => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Loading>
        <Devtools />
      </Loading>
    </QueryClientProvider>
  ),
  document.getElementById("app")!,
);

import.meta.hot?.dispose(dispose);
