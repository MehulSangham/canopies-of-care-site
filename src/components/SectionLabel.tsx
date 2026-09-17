interface SectionLabelProps {
  label: string;
}

export default function SectionLabel({ label }: SectionLabelProps) {
  return (
    <h4 className="font-['Redaction_20'] font-normal text-sm uppercase tracking-wide text-[var(--cream-muted)] mb-4">
      {label}
    </h4>
  );
}
