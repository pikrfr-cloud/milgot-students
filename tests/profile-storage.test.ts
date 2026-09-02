import { describe, expect, it } from "vitest";
import {
  PROFILE_SCHEMA_VERSION,
  migrateStoredProfile,
  serializeProfile,
} from "@/lib/profile-storage";
import { parseTracking } from "@/lib/tracking";

describe("profile schema version migration", () => {
  it("loads a v1 raw profile without wiping fields", () => {
    const v1 = { institution: "tau", degreeLevel: "ba", yearOfStudy: 1 };
    const loaded = migrateStoredProfile(v1);
    expect(loaded.institution).toBe("tau");
    expect(loaded.degreeLevel).toBe("ba");
    expect(loaded.yearOfStudy).toBe(1);
  });

  it("loads a v2 envelope and keeps old fields when serializing", () => {
    const v1 = { institution: "tau", cityOfResidence: "חיפה" };
    const migrated = migrateStoredProfile(v1);
    const stored = serializeProfile(migrated);
    expect(stored.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
    expect(stored.profile.institution).toBe("tau");
    expect(stored.profile.cityOfResidence).toBe("חיפה");
    const roundTrip = migrateStoredProfile(stored);
    expect(roundTrip.institution).toBe("tau");
    expect(roundTrip.cityOfResidence).toBe("חיפה");
  });

  it("imports the previous JSON export wrapper", () => {
    const exported = { version: 1, exportedAt: "2026-08-01T00:00:00.000Z", profile: { service: "idf" } };
    expect(migrateStoredProfile(exported).service).toBe("idf");
  });
});

describe("tracking document checkboxes", () => {
  it("keeps old {status, updatedAt} entries", () => {
    const parsed = parseTracking({
      perach: { status: "in_progress", updatedAt: "2026-09-01T00:00:00.000Z" },
    });
    expect(parsed.perach?.status).toBe("in_progress");
    expect(parsed.perach?.documentsChecked).toBeUndefined();
  });
});
