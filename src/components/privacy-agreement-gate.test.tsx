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
      name: /consent to the processing described in it/i,
    });
    const viewedField = container.querySelector<HTMLInputElement>(
      'input[name="privacyViewed"]',
    );

    expect(checkbox).toHaveProperty("disabled", true);
    expect(viewedField?.value).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Open agreement" }));
    expect(
      screen.getByRole("heading", { name: "Scope and transparency" }),
    ).toBeTruthy();
    expect(checkbox).toHaveProperty("disabled", true);

    const reviewButton = screen.getByRole("button", {
      name: "I have reviewed this agreement",
    });
    expect(reviewButton).toHaveProperty("disabled", true);

    const noticeRegion = screen.getByRole("region", {
      name: "Scrollable TLMS privacy notice",
    });
    Object.defineProperties(noticeRegion, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 600 },
    });
    fireEvent.scroll(noticeRegion);

    expect(reviewButton).toHaveProperty("disabled", false);
    expect(
      screen
        .getByRole("progressbar", {
          name: "Privacy notice review progress",
        })
        .getAttribute("aria-valuenow"),
    ).toBe("100");

    fireEvent.click(reviewButton);
    expect(checkbox).toHaveProperty("disabled", false);
    expect(viewedField?.value).toBe("true");

    fireEvent.click(checkbox);
    expect(onAcceptanceChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(
      screen.getByRole("button", { name: "Review agreement again" }),
    );
    expect(checkbox).toHaveProperty("disabled", false);
    expect(viewedField?.value).toBe("true");
  });
});
