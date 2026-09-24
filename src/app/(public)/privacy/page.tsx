import { LockKeyhole, Scale, ShieldCheck, UserRoundCheck } from "lucide-react";
import { InfoPage } from "@/components/info-page";
import { PrivacyNoticeContent } from "@/components/privacy-notice-content";
import { Card } from "@/components/ui";

const principles = [
  [
    ShieldCheck,
    "Purpose limitation",
    "Information is processed for declared account, scheduling, communication, security, and logistics purposes.",
  ],
  [
    LockKeyhole,
    "Controlled access",
    "Authentication, server authorization, resource checks, and audit records protect operational information.",
  ],
  [
    UserRoundCheck,
    "Individual rights",
    "The notice explains how to seek access, correction, objection, withdrawal, or other applicable privacy rights.",
  ],
] as const;

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy and consent"
      title="Your information, handled with purpose"
      intro="This notice explains how the TLMS portal processes personal data, the safeguards built into the service, and the choices and rights available to users."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {principles.map(([Icon, title, body]) => (
          <section key={title} className="hex-panel bg-[#fbf6e8] p-5">
            <Icon
              aria-hidden="true"
              className="size-7 stroke-[1.5] text-[#153f6f]"
            />
            <h2 className="mt-4 font-[Cinzel] font-semibold text-[#4c3a27]">
              {title}
            </h2>
            <p className="muted mt-2 text-sm leading-6">{body}</p>
          </section>
        ))}
      </div>

      <Card className="border-t-4 border-t-[#153f6f]!">
        <div className="mb-7 flex items-start gap-3 border-b border-[#b69a5e]/50 pb-6">
          <Scale
            aria-hidden="true"
            className="mt-1 size-7 shrink-0 stroke-[1.5] text-[#806837]"
          />
          <div>
            <h2 className="font-[Cinzel] text-xl font-semibold text-[#4c3a27]">
              Complete notice
            </h2>
            <p className="muted mt-1 text-sm leading-6">
              The notice uses neutral wording where an institution-approved
              controller identity, privacy contact, or exact retention schedule
              has not yet been published through this portal.
            </p>
          </div>
        </div>
        <PrivacyNoticeContent />
      </Card>
    </InfoPage>
  );
}
