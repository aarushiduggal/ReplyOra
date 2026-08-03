/** Numbered, uppercase section header — "( 01 )  OVERVIEW". Editorial, small. */
export function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink">
      <span className="text-oxblood">( {num} )</span>
      <span>{label}</span>
    </div>
  );
}
