interface SectionNumberProps {
  n: number;
  label: string;
}

export function SectionNumber({ n, label }: SectionNumberProps) {
  return (
    <div className="snum">
      <span className="snum-num">{String(n).padStart(2, '0')}</span>
      <span className="snum-rule" />
      <span className="snum-label">{label}</span>
    </div>
  );
}
