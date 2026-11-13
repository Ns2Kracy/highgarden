import { render } from "@solidjs/web";
import { QueryClientProvider } from "@tanstack/solid-query";
import { RouterProvider } from "@tanstack/solid-router";
import { Loading, lazy } from "solid-js";
import { queryClient } from "./lib/query";
import { router } from "./router";

const Devtools = import.meta.env.DEV ? lazy(() => import("./devtools")) : () => null;

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
