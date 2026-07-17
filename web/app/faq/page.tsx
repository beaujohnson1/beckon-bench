import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata = {
  title: 'How the Bench works — scoring, judges, and vote integrity',
  description:
    'How Beckon Bench scores AI coding models: the one-shot protocol, the cross-vendor AI judge panel, the People’s Vote, what the efficiency stats mean, and why every receipt is public.',
  alternates: { canonical: '/faq/' },
};

// Answers sourced from the public protocol docs (RULES.md, RULINGS.md,
// ARENA.md). Keep claims in sync with the rulings — this page is the
// plain-language mirror of the receipts, not a separate authority.
const FAQ: { q: string; a: React.ReactNode; plain: string }[] = [
  {
    q: 'What is Beckon Bench?',
    plain:
      'A benchmark for AI coding models built around eight one-shot tests run under identical conditions. Every prompt, artifact, score, judge vote, and ballot is published — the receipts are the product.',
    a: (
      <>
        A benchmark for AI coding models built around eight one-shot tests — build a game, animate a
        lava lamp, fix seeded bugs, drive Blender — run under identical conditions. Every prompt,
        artifact, judge vote, and ballot is published. The receipts are the product. See{' '}
        <Link href="/tests/">the eight tests</Link>, verbatim.
      </>
    ),
  },
  {
    q: 'Who decides the scores?',
    plain:
      'Two public verdicts: a cross-vendor AI judge panel (the Arena) and the People’s Vote. Human scores were issued through 2026-07-16 and stand as history; no new ones are issued since Ruling #6.',
    a: (
      <>
        Two public verdicts. The <Link href="/matches/">Arena</Link> — a cross-vendor AI judge panel
        — and the <Link href="/vote/">People&apos;s Vote</Link>, cast by visitors like you. Season
        one began with human scoring on camera; those scores stand as history, but per Ruling #6 no
        new human scores are issued. Nothing is ever rescored quietly: revisions happen on the
        record, in the published score notes.
      </>
    ),
  },
  {
    q: 'How does the AI judge panel work?',
    plain:
      'Three judges from vendors with no model in the match see both artifacts blind, in randomized order, and must pick a winner. Majority decides, winners climb an ELO ladder, and every judge’s reasoning is published. A judge never evaluates its own vendor’s model.',
    a: (
      <>
        Three judges from vendors with <em>no model in the match</em> see both artifacts blind, in
        randomized order, and must pick a winner — no ties allowed. Majority decides, winners climb
        an ELO ladder, and every judge&apos;s reasoning is published word for word. A judge never
        evaluates its own vendor&apos;s model. There&apos;s also a panel-score pilot: five judges
        rubric-score each artifact independently, with the median of each dimension published, using
        rendered evidence — actual frames of the artifact running — not just code on faith.
      </>
    ),
  },
  {
    q: 'Can the People’s Vote be gamed?',
    plain:
      'Each ballot is one vote per person per match, deduplicated, and stored as an individual record — recountable, never opaque counters. Tallies are presented as indicative while anti-brigading protections are hardened, per the open item in Ruling #6.',
    a: (
      <>
        Each ballot is one vote per person per match, deduplicated, and stored as an individual
        record — recountable rows, never opaque counters. We&apos;re honest about the current state:
        per the open item in Ruling #6, tallies are presented as <em>indicative</em> while
        anti-brigading protections are hardened. If a tally is ever thrown out, that happens on the
        record too.
      </>
    ),
  },
  {
    q: 'What does “one shot” mean?',
    plain:
      'The model’s first complete response is the scored artifact — no follow-ups, no retries, no error pasting. If the environment (not the model) fails, the run is voided and re-run once, disclosed in the rulings.',
    a: (
      <>
        The model&apos;s first complete response is the artifact. No follow-ups, no &quot;make it
        better&quot;, no pasting errors back. If the <em>environment</em> fails — a network drop, a
        harness crash — the run is voided and re-run once, disclosed in the rulings. A model-caused
        failure scores as-is.
      </>
    ),
  },
  {
    q: 'Why do models run in different CLIs?',
    plain:
      'Each model runs in its own vendor’s flagship CLI at comparable settings, in the same environment, because vibe coders use each model through its native tool — the model-plus-harness pair is what’s being benchmarked.',
    a: (
      <>
        GPT models can&apos;t run in Claude Code, and vice versa — so per Ruling #1, every model runs
        in its own vendor&apos;s flagship CLI, in the same environment, at comparable settings. The
        model-plus-harness pair is the product people actually use, so it&apos;s the thing being
        benchmarked. The exact CLI and version is recorded in every run&apos;s receipt.
      </>
    ),
  },
  {
    q: 'What do the time, token, and cost numbers mean?',
    plain:
      'Wall-clock time, output tokens, and API-equivalent cost are recorded for every run and published, but they never affect scores or verdicts. Cost is computed from output tokens at published API rates when runs happen on flat-rate subscriptions.',
    a: (
      <>
        Wall-clock time, output tokens, and cost are recorded for every run and published on the{' '}
        <Link href="/#efficiency">efficiency board</Link> — but they never affect a score or a
        verdict. When a run happens on a flat-rate subscription, cost is shown as the API-equivalent
        of its output tokens at published rates, labeled as such. Some CLIs don&apos;t report token
        usage; those cells honestly read n/a.
      </>
    ),
  },
  {
    q: 'Can I see the actual prompts and artifacts?',
    plain:
      'Yes — every prompt is published verbatim, every artifact is playable or watchable on its test page, and score records including revision notes are public in the repository.',
    a: (
      <>
        All of it. Every prompt is published verbatim on{' '}
        <Link href="/tests/">the tests page</Link>, every artifact is embedded playable or watchable
        on its test page, and the underlying records — including any revision notes — are in the
        public repository. If you can&apos;t verify it, we shouldn&apos;t publish it.
      </>
    ),
  },
  {
    q: 'What is Beckon?',
    plain:
      'Beckon is the agentic workspace the bench runs inside — say the word, your agents build. Beckon Bench is its public benchmark.',
    a: (
      <>
        The workspace this whole bench runs inside. Say the word, your agents build —{' '}
        <a href="https://heybeckon.ai">heybeckon.ai</a>.
      </>
    ),
  },
];

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.plain },
    })),
  };
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">HELP</p>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">How the Bench works.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The protocol in plain language. The authoritative versions live in the published rules
            and rulings — when in doubt, the receipts win.
          </p>
        </section>
        <div className="border bg-card px-4">
          <Accordion type="single" collapsible>
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`}>
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-foreground/90">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
