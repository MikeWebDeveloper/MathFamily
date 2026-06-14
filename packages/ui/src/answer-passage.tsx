/** AnswerPassage — server component.
 * A question-form H2 followed by a concise 40–75-word plain-language answer.
 * Both the heading and the paragraph carry `.mf-speakable` so the page's
 * `speakableLd` (cssSelector ["h1", ".mf-speakable"]) targets them for voice/AI extraction.
 */
export function AnswerPassage({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="mf-speakable text-lg font-semibold text-ink">{question}</h2>
      <p className="mf-speakable text-[15px] leading-relaxed text-ink-muted">{children}</p>
    </section>
  );
}
