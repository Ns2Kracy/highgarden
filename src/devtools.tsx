import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import { router } from "./router";

export default function Devtools() {
  return (
    <>
      <SolidQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      <TanStackRouterDevtools router={router} initialIsOpen={false} position="bottom-right" />
    </>
  );
}
