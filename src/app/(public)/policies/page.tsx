import { InfoPage, TextCard } from "@/components/info-page";
import { dataPrivacyAgreementSections } from "@/lib/privacy-agreement";

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
        </ul>
      </TextCard>
      <TextCard title="Data Privacy Agreement">
        <div className="space-y-4">
          {dataPrivacyAgreementSections.map((section) => (
            <section key={section.title}>
              <h3 className="font-bold text-[#4c3a27]">{section.title}</h3>
              <p className="mt-1">{section.body}</p>
            </section>
          ))}
          <p>
            By accepting this agreement during account creation, you agree to
            the collection and use of your information for these described TLMS
            purposes.
          </p>
        </div>
      </TextCard>
    </InfoPage>
  );
}
