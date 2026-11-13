import {
  createHashHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/solid-router";
import type { QueryClient } from "@tanstack/solid-query";
import { queryClient } from "./lib/query";
import { AppShell } from "./components/shell/app-shell";
import HomePage from "./routes/home";
import ErrorPage from "./routes/error-page";
import NotFoundPage from "./routes/not-found";
import SettingsPage from "./routes/settings";
import ToolPage from "./routes/tool";

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
  errorComponent: (props) => {
    return <ErrorPage error={props.error} reset={props.reset} />;
  },
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const toolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools/$toolId",
  component: ToolPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, toolRoute, settingsRoute]),
  // Hash routes work inside the packaged MyGo app without server-side rewrites.
  history: createHashHistory(),
  context: { queryClient },
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}
