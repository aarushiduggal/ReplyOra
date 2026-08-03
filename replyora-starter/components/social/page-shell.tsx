/** Consistent content container for portal pages — narrow-ish, lots of air. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>
  );
}
