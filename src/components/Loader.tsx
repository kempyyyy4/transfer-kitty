/**
 * A quiet stand-in while something loads: faint bars where the content will be. It fades
 * in only if loading takes longer than about half a second, so a fast load shows nothing.
 */
export function Loader() {
  return (
    <div role="status" className="appear-if-slow flex flex-col gap-3 py-4">
      <span className="sr-only">Loading</span>
      <span aria-hidden className="h-4 w-3/4 animate-pulse bg-chalk-dim/25" />
      <span aria-hidden className="h-4 w-1/2 animate-pulse bg-chalk-dim/20" />
      <span aria-hidden className="h-12 w-full animate-pulse bg-chalk-dim/15" />
    </div>
  );
}
