// Framework-neutral UI APIs; the corresponding adapters still target Solid 1.
// Construct instances where needed rather than allocating unused global state.
export { FormApi } from "@tanstack/form-core";
export {
  constructTable,
  createColumnHelper,
  createCoreRowModel,
  tableFeatures,
  tableOptions,
} from "@tanstack/table-core";
export { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";
export {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
} from "@tanstack/virtual-core";
