import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "@/components/Field";
import { CityPicker, moveActiveIndex } from "@/components/CityPicker";
import { HeWithEn } from "@/components/HeWithEn";
import { TriStateSelect } from "@/components/TriStateSelect";

describe("ProfileWizard Field accessible names", () => {
  it("associates a select with htmlFor and aria-labelledby", () => {
    const html = renderToStaticMarkup(
      <Field field="age" label="גיל">
        <select className="w-full">
          <option value="">בחירה</option>
        </select>
      </Field>,
    );
    expect(html).toContain('id="profile-field-age-label"');
    expect(html).toContain('for="profile-field-age-control"');
    expect(html).toContain('id="profile-field-age-control"');
    expect(html).toContain('aria-labelledby="profile-field-age-label"');
    expect(html).toMatch(/<label[^>]*id="profile-field-age-label"/);
  });

  it("associates Field+TriStateSelect with matching id and aria-labelledby", () => {
    const html = renderToStaticMarkup(
      <Field field="completedMechina" label="האם סיימתם מכינה קדם-אקדמית?">
        <TriStateSelect className="w-full" value={null} onChange={() => {}} />
      </Field>,
    );
    expect(html).toContain('id="profile-field-completedMechina-label"');
    expect(html).toContain('for="profile-field-completedMechina-control"');
    expect(html).toContain('id="profile-field-completedMechina-control"');
    expect(html).toContain('aria-labelledby="profile-field-completedMechina-label"');
    expect(html).toMatch(/<select[^>]*id="profile-field-completedMechina-control"/);
    expect(html).toMatch(/<select[^>]*aria-labelledby="profile-field-completedMechina-label"/);
  });

  it("passes labelledBy into CityPicker", () => {
    const html = renderToStaticMarkup(
      <Field field="cityOfResidence" label="עיר מגורים נוכחית">
        <CityPicker id="city-residence" value="" onChange={() => {}} suggestions={["באר שבע"]} />
      </Field>,
    );
    expect(html).toContain('aria-labelledby="profile-field-cityOfResidence-label"');
    expect(html).toContain('for="city-residence"');
    expect(html).toContain('id="city-residence"');
  });
});

describe("CityPicker keyboard helper", () => {
  it("clamps arrow movement inside the list", () => {
    expect(moveActiveIndex(0, 5, 1)).toBe(1);
    expect(moveActiveIndex(4, 5, 1)).toBe(4);
    expect(moveActiveIndex(0, 5, -1)).toBe(0);
  });
});

describe("HeWithEn", () => {
  it("wraps Latin bits in bdi lang=en", () => {
    const html = renderToStaticMarkup(<HeWithEn text="HIT מכון טכנולוגי" />);
    expect(html).toContain('lang="en"');
    expect(html).toContain("HIT");
    expect(html).toContain("<bdi");
  });
});
