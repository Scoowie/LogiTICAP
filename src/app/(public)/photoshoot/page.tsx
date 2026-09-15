import { InfoPage, TextCard } from "@/components/info-page";

export default function PhotoshootPage() {
  return (
    <InfoPage
      eyebrow="Photoshoot"
      title="Thesis group photoshoot information"
      intro="Published event dates, venue, deadlines, capacity, and preparation instructions are configured by authorized Logistics staff and shown when an event is available."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <TextCard title="Before booking">
          <p>
            Use your verified school email, confirm your structured member list,
            and review all contact details.
          </p>
        </TextCard>
        <TextCard title="Choose a schedule">
          <p>
            Availability is finalized only after server confirmation. Times are
            displayed in Asia/Manila.
          </p>
        </TextCard>
        <TextCard title="After confirmation">
          <p>
            Keep your non-sequential TLMS reference and watch the portal for
            venue or schedule notifications.
          </p>
        </TextCard>
      </div>
    </InfoPage>
  );
}
