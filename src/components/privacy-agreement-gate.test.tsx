// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PrivacyAgreementGate } from "./privacy-agreement-gate";

afterEach(cleanup);

describe("PrivacyAgreementGate", () => {
  it("requires the agreement to be opened and reviewed before acceptance", () => {
    const onAcceptanceChange = vi.fn();
    const { container } = render(
      <PrivacyAgreementGate onAcceptanceChange={onAcceptanceChange} />,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /agree to the TLMS Data Privacy Agreement/i,
    });
    const viewedField = container.querySelector<HTMLInputElement>(
      'input[name="privacyViewed"]',
    );

    expect(checkbox).toHaveProperty("disabled", true);
    expect(viewedField?.value).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Open agreement" }));
    expect(
      screen.getByRole("heading", { name: "Information collected" }),
    ).toBeTruthy();
    expect(checkbox).toHaveProperty("disabled", true);

    fireEvent.click(
      screen.getByRole("button", {
        name: "I have reviewed this agreement",
      }),
    );
    expect(checkbox).toHaveProperty("disabled", false);
    expect(viewedField?.value).toBe("true");

    fireEvent.click(checkbox);
    expect(onAcceptanceChange).toHaveBeenLastCalledWith(true);
  });
});
