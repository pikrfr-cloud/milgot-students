export function CoverageNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-ink-soft leading-relaxed ${className}`}>
      הדוח שלם ביחס למלגות שבקטלוג זה. הקטלוג גדל, וסכומים או מועדים מסומנים כלא ודאיים כשלא ניתן
      לאמת אותם. זו אינה החלטת זכאות רשמית של הקרן — תמיד יש לאמת באתר המלגה לפני הגשה.
    </p>
  );
}
