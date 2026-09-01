"use client";

export function TriStateSelect({
  value,
  onChange,
  className,
  yesLabel = "כן",
  noLabel = "לא",
  unknownLabel = "לא יודע/ת",
  id,
}: {
  value: boolean | null | undefined;
  onChange: (next: boolean | null) => void;
  className: string;
  yesLabel?: string;
  noLabel?: string;
  unknownLabel?: string;
  id?: string;
}) {
  const encoded = value === true ? "yes" : value === false ? "no" : "";
  return (
    <select
      id={id}
      className={className}
      value={encoded}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "yes")}
    >
      <option value="">{unknownLabel}</option>
      <option value="yes">{yesLabel}</option>
      <option value="no">{noLabel}</option>
    </select>
  );
}
