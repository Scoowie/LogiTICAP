import { describe, expect, it } from "vitest";
import {
  DATA_PRIVACY_AGREEMENT_VERSION,
  dataPrivacyAgreementSections,
} from "./privacy-agreement";

describe("privacy agreement", () => {
  it("publishes the professional v2 notice with the required subject areas", () => {
    expect(DATA_PRIVACY_AGREEMENT_VERSION).toBe("v2");
    const titles = dataPrivacyAgreementSections.map((section) => section.title);

    expect(titles).toContain("Personal data processed");
    expect(titles).toContain("Purposes of processing");
    expect(titles).toContain("Retention and disposal");
    expect(titles).toContain("Your data-subject rights");
  });
});
