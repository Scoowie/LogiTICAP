import { InfoPage, TextCard } from "@/components/info-page";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact Logistics"
      title="Get help from the TICAP Logistics team"
      intro="Verified contact details can be published through system settings once confirmed. No unverified address or account is included in this repository."
    >
      <TextCard title="Before contacting Logistics">
        <p>
          Include your booking reference when appropriate, but never send
          passwords, sign-in links, or authentication tokens. For private
          concerns, use the authenticated Help area.
        </p>
      </TextCard>
    </InfoPage>
  );
}
