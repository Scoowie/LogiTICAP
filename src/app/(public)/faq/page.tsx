import { InfoPage, TextCard } from "@/components/info-page";

const questions = [
  [
    "Can I book without signing in?",
    "You may view public information anonymously, but a verified Supabase session is required to confirm or manage a booking.",
  ],
  [
    "Can two groups take the last slot?",
    "No. Capacity is claimed in a serializable database transaction and protected by constraints.",
  ],
  [
    "What timezone is used?",
    "All user-facing event dates and times use Asia/Manila; timestamps are stored timezone-safely.",
  ],
  [
    "Can a booking reference reveal our details?",
    "No. A reference is safe to share with Logistics but never acts as the sole authorization mechanism.",
  ],
];
export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Frequently asked questions"
      title="Help with photoshoot scheduling"
      intro="Answers to the most common questions about identity, schedules, and privacy."
    >
      {questions.map(([q, a]) => (
        <TextCard key={q} title={q}>
          <p>{a}</p>
        </TextCard>
      ))}
    </InfoPage>
  );
}
