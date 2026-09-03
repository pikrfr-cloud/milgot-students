import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WhatsAppReminderButton } from "@/components/WhatsAppReminderButton";
import { HE } from "@/lib/i18n/he";
import { sharedResultsUrl } from "@/lib/profile-share";
import { publicWhatsAppBotNumber, whatsappReminderHref } from "@/lib/whatsapp-bot-link";
import type { StudentProfile } from "@/lib/types";

const PROFILE: StudentProfile = { institution: "tau", degreeLevel: "ba" };

afterEach(() => {
  delete process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;
});

describe("WhatsApp reminder button", () => {
  it("empty env → not in the component tree (no wa.me)", () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;
    expect(publicWhatsAppBotNumber()).toBe("");
    expect(whatsappReminderHref(PROFILE)).toBeNull();
    const html = renderToStaticMarkup(<WhatsAppReminderButton profile={PROFILE} />);
    expect(html).toBe("");
    expect(html).not.toContain("wa.me");
    expect(html).not.toContain("שלחו לי תזכורת");
  });

  it("whitespace env → not rendered", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER = "   ";
    const html = renderToStaticMarkup(<WhatsAppReminderButton profile={PROFILE} />);
    expect(html).toBe("");
  });

  it("hides when there is no shareable report URL", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER = "9725XXXXXXXX";
    const html = renderToStaticMarkup(<WhatsAppReminderButton profile={{}} />);
    expect(html).toBe("");
    expect(whatsappReminderHref({})).toBeNull();
  });

  it("set to 9725XXXXXXXX → href contains wa.me/9725XXXXXXXX and text תזכורת plus a report link", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER = "9725XXXXXXXX";
    const html = renderToStaticMarkup(<WhatsAppReminderButton profile={PROFILE} />);
    expect(html).toContain("wa.me/9725XXXXXXXX");
    expect(html).toContain(HE.actions.whatsappReminder);
    expect(html).toContain("תזכורת");
    expect(html).toContain("min-h-11");

    const href = whatsappReminderHref(PROFILE);
    expect(href).toContain("https://wa.me/9725XXXXXXXX");
    const text = new URL(href!).searchParams.get("text") ?? "";
    expect(text).toContain("תזכורת");
    expect(text).toContain(sharedResultsUrl(PROFILE));
    expect(html).toContain(encodeURIComponent(sharedResultsUrl(PROFILE)));
  });
});
