import { InfoPage, TextCard } from "@/components/info-page";

export default function ServicesPage() {
  return (
    <InfoPage
      eyebrow="Services"
      title="Centralized support for TICAP logistics"
      intro="Photoshoot scheduling is available in Phase 1. The portal is prepared for additional services without obscuring the photoshoot workflow."
    >
      <TextCard title="Thesis Photoshoot Scheduling">
        <p>
          Group registration, capacity-safe reservations, schedule changes,
          attendance, and authorized reporting.
        </p>
      </TextCard>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          "Room Reservations",
          "Equipment Requests",
          "Event Logistics",
          "Gate Pass and Document Tracking",
          "General Logistics Concerns",
        ].map((name) => (
          <TextCard key={name} title={name}>
            <p>
              Coming Soon. Service-specific request, approval, scheduling, and
              fulfillment flows will be introduced in a later phase.
            </p>
          </TextCard>
        ))}
      </div>
    </InfoPage>
  );
}
