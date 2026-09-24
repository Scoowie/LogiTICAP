import Link from "next/link";
import {
  DATA_PRIVACY_AGREEMENT_VERSION,
  DATA_PRIVACY_NOTICE_TITLE,
  dataPrivacyAgreementSections,
} from "@/lib/privacy-agreement";

export function PrivacyNoticeContent({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className="text-[#3c342a]">
      <div className="rounded-lg border border-[#b69a5e] bg-[#fbf6e8] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-[Cinzel] text-base font-semibold text-[#4c3a27]">
            {DATA_PRIVACY_NOTICE_TITLE}
          </p>
          <span className="rounded-full border border-[#806837] bg-[#f3ead2] px-3 py-1 text-xs font-semibold tracking-wider text-[#4c3a27] uppercase">
            Version {DATA_PRIVACY_AGREEMENT_VERSION}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#615848]">
          Please read this notice carefully. It explains what TLMS processes,
          why the information is needed, who may access it, and the choices and
          rights available to you.
        </p>
      </div>

      <ol className={compact ? "mt-5 space-y-5" : "mt-7 space-y-7"}>
        {dataPrivacyAgreementSections.map((section, index) => (
          <li key={section.title} className="grid grid-cols-[2rem_1fr] gap-3">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full border border-[#b69a5e] bg-[#f3ead2] font-[Cinzel] text-xs font-bold text-[#4c3a27]"
            >
              {index + 1}
            </span>
            <section>
              <h3 className="font-bold text-[#4c3a27]">{section.title}</h3>
              <div className="mt-1 space-y-2 text-sm leading-6 text-[#615848]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </li>
        ))}
      </ol>

      <aside className="mt-7 rounded-lg border-l-4 border-[#286f9c] bg-[#d8eef7] p-4 text-sm leading-6 text-[#184d6b]">
        <p className="font-bold">Philippine privacy references</p>
        <p className="mt-1">
          This notice is structured around guidance from the Philippine National
          Privacy Commission. Review the NPC&apos;s{" "}
          <Link
            href="https://privacy.gov.ph/the-right-to-be-informed/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-4"
          >
            right-to-be-informed guidance
          </Link>{" "}
          and{" "}
          <Link
            href="https://privacy.gov.ph/data-subject-rights/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-4"
          >
            data-subject rights overview
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
