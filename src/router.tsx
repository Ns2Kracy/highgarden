import {
  Link,
  Outlet,
  createHashHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/solid-router";
import type { QueryClient } from "@tanstack/solid-query";
import { queryClient } from "./lib/query";
import HomePage from "./routes/home";

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: () => (
    <main>
      <h1>Page not found</h1>
      <Link to="/">Back to home</Link>
    </main>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute]),
  // Hash routes work inside the packaged MyGo app without server-side rewrites.
  history: createHashHistory(),
  context: { queryClient },
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}
