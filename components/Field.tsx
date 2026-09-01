"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { ProfileField } from "@/lib/types";
import { fieldDomId } from "@/lib/profile-fields";
import { CityPicker } from "@/components/CityPicker";
import { TriStateSelect } from "@/components/TriStateSelect";

export function Field({
  field,
  label,
  hint,
  children,
}: {
  field?: ProfileField;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const rootId = field ? fieldDomId(field) : undefined;
  const labelId = field ? `${rootId}-label` : undefined;
  const defaultControlId = field ? `${rootId}-control` : undefined;

  const childList = Children.toArray(children);
  const cityChild = childList.find((c) => isValidElement(c) && c.type === CityPicker);
  const htmlFor = isValidElement(cityChild)
    ? (cityChild.props as { id: string }).id
    : defaultControlId;

  const labelled = Children.map(children, (child) => {
    if (!isValidElement(child) || !labelId) return child;
    if (child.type === CityPicker) {
      return cloneElement(child as ReactElement<{ labelledBy?: string }>, { labelledBy: labelId });
    }
    if (child.type === TriStateSelect) {
      return cloneElement(
        child as ReactElement<{ id?: string; labelledBy?: string }>,
        { id: defaultControlId, labelledBy: labelId },
      );
    }
    if (child.type === "select" || child.type === "input") {
      return cloneElement(
        child as ReactElement<{ id?: string; "aria-labelledby"?: string }>,
        { id: defaultControlId, "aria-labelledby": labelId },
      );
    }
    return child;
  });

  return (
    <div className="block" id={rootId}>
      <label id={labelId} htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint ? <span className="mt-1 block text-sm text-ink-soft leading-relaxed">{hint}</span> : null}
      <div className="mt-2">{labelled}</div>
    </div>
  );
}
