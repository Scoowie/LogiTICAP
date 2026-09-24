import Link from "next/link";
import { InfoPage, TextCard } from "@/components/info-page";

export default function PoliciesPage() {
  return (
    <InfoPage
      eyebrow="Booking policies"
      title="Clear rules for fair scheduling"
      intro="Event-specific deadlines are displayed before confirmation and enforced by the server."
    >
      <TextCard title="Reservations">
        <ul className="list-disc space-y-2 pl-5">
          <li>One active booking is allowed per thesis group and event.</li>
          <li>
            A booking belongs to its verified representative and is not
            transferable through its reference alone.
          </li>
          <li>
            Blocked, full, closed, expired, and past slots cannot be booked.
          </li>
        </ul>
      </TextCard>
      <TextCard title="Changes and privacy">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Rescheduling and cancellation are available only before the
            configured deadlines.
          </li>
          <li>
            Administrative overrides require a written reason and create an
            audit record.
          </li>
          <li>
            Only data necessary for logistics operations is collected and access
            is role-limited.
          </li>
          <li>
            Review the dedicated{" "}
            <Link
              href="/privacy"
              className="font-semibold text-[#153f6f] underline underline-offset-4"
            >
              TLMS Privacy Notice and Consent
            </Link>{" "}
            for processing purposes, safeguards, and data-subject rights.
          </li>
        </ul>
      </TextCard>
    </InfoPage>
  );
}
