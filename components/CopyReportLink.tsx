"use client";

import { useState } from "react";
import { HE } from "@/lib/i18n/he";
import { encodeSharedProfile, sharedResultsUrl } from "@/lib/profile-share";
import type { StudentProfile } from "@/lib/types";

export function CopyReportLink({ profile }: { profile: StudentProfile }) {
  const encoded = encodeSharedProfile(profile);
  const [copied, setCopied] = useState(false);
  if (!encoded) return null;

  async function copy() {
    const url = sharedResultsUrl(profile);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
    >
      {copied ? HE.actions.copied : HE.actions.copyReportLink}
    </button>
  );
}
