export function CoverageNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-ink-soft leading-relaxed ${className}`}>
      זו לא החלטת זכאות. תמיד בודקים באתר המלגה לפני הגשה.
    </p>
  );
}
