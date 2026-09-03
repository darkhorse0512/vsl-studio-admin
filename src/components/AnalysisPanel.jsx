import { Badge } from './ui/Feedback'
import { Puzzle, Quote, Sparkles, Target } from './Icons'

/**
 * Read-only view of the shared VSL analysis.
 * This is the exact object both generators consume, so showing it here is
 * what lets the user verify the consistency between the two assets.
 */
export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null

  const {
    language,
    offer_name: offerName,
    product_type: productType,
    big_promise: bigPromise,
    headline,
    subheadline,
    target_audience: audience = {},
    pain_points: pains = [],
    desires = [],
    unique_mechanism: mechanism = {},
    benefits = [],
    solution = {},
    offer = {},
    objections = [],
    proof = {},
    faq = [],
    cta = {},
    tone = {},
    quiz_blueprint: quiz = {},
  } = analysis

  return (
    <div className="space-y-5">
      {/* Positioning ------------------------------------------------- */}
      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="brand">
            <Sparkles className="h-3.5 w-3.5" />
            Shared brief
          </Badge>
          {offerName && <Badge>{offerName}</Badge>}
          {productType && <Badge>{productType}</Badge>}
          {language && <Badge tone="info">{String(language).toUpperCase()}</Badge>}
        </div>

        {headline && <h3 className="text-xl font-semibold text-white sm:text-2xl">{headline}</h3>}
        {subheadline && <p className="mt-2 text-ink-300">{subheadline}</p>}

        {bigPromise && (
          <div className="mt-5 rounded-xl border border-brand-500/25 bg-brand-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              The big promise
            </p>
            <p className="mt-1.5 text-ink-100">{bigPromise}</p>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Audience -------------------------------------------------- */}
        <Section title="Target audience" icon={Target}>
          {audience.summary && <p className="text-sm text-ink-200">{audience.summary}</p>}
          {audience.awareness_level && (
            <p className="mt-3 text-xs text-ink-400">
              Awareness level:{' '}
              <span className="font-medium text-ink-200">{audience.awareness_level}</span>
            </p>
          )}
          <ChipGroup label="Demographics" items={audience.demographics} />
          <ChipGroup label="Psychographics" items={audience.psychographics} />
        </Section>

        {/* Mechanism -------------------------------------------------- */}
        <Section title="Unique mechanism" icon={Puzzle}>
          {mechanism.name && <p className="font-semibold text-white">{mechanism.name}</p>}
          {mechanism.explanation && (
            <p className="mt-2 text-sm text-ink-300">{mechanism.explanation}</p>
          )}
          {mechanism.why_it_works && (
            <p className="mt-3 border-l-2 border-brand-500/50 pl-3 text-sm text-ink-400">
              {mechanism.why_it_works}
            </p>
          )}
        </Section>

        <Section title={`Pain points (${pains.length})`}>
          <ItemList items={pains} />
        </Section>

        <Section title={`Desires (${desires.length})`}>
          <ItemList items={desires} />
        </Section>

        <Section title={`Benefits (${benefits.length})`}>
          <ItemList items={benefits} />
        </Section>

        <Section title="Solution">
          {solution.name && <p className="font-semibold text-white">{solution.name}</p>}
          {solution.description && (
            <p className="mt-2 text-sm text-ink-300">{solution.description}</p>
          )}
          {solution.steps?.length > 0 && (
            <ol className="mt-4 space-y-3">
              {solution.steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-100">{step.title}</p>
                    {step.description && (
                      <p className="text-sm text-ink-400">{step.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>

      {/* Offer --------------------------------------------------------- */}
      <Section title="The offer">
        {offer.summary && <p className="text-sm text-ink-200">{offer.summary}</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NamedList title="Deliverables" items={offer.deliverables} />
          <NamedList title="Bonuses" items={offer.bonuses} />
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Price" value={offer.price} />
          <Fact label="Payment options" value={offer.payment_options} />
          <Fact label="Guarantee" value={offer.guarantee} />
          <Fact label="Scarcity" value={offer.scarcity} />
        </dl>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={`Objections (${objections.length})`}>
          {objections.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-4">
              {objections.map((item, index) => (
                <li key={index}>
                  <p className="text-sm font-medium text-ink-100">“{item.objection}”</p>
                  <p className="mt-1 text-sm text-ink-400">{item.response}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`FAQ (${faq.length})`}>
          {faq.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {faq.map((item, index) => (
                <li key={index}>
                  <p className="text-sm font-medium text-ink-100">{item.question}</p>
                  <p className="mt-1 text-sm text-ink-400">{item.answer}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Proof" icon={Quote}>
          {proof.testimonials?.length > 0 ? (
            <ul className="space-y-4">
              {proof.testimonials.map((item, index) => (
                <li key={index} className="border-l-2 border-ink-700 pl-3">
                  <p className="text-sm italic text-ink-200">“{item.quote}”</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {[item.author, item.result].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No testimonials were found in the VSL." />
          )}
          <ChipGroup label="Credentials" items={proof.credentials} />
          <ChipGroup label="Stats" items={proof.stats} />
        </Section>

        <Section title="Call to action & quiz angle">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Primary CTA" value={cta.primary_label} />
            <Fact label="Secondary CTA" value={cta.secondary_label} />
            <Fact label="Reassurance" value={cta.supporting_line} />
            <Fact label="Tone of voice" value={tone.voice} />
          </dl>

          {quiz.title && (
            <div className="mt-5 rounded-xl border border-ink-700 bg-ink-950/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Quiz blueprint
              </p>
              <p className="mt-1.5 font-medium text-white">{quiz.title}</p>
              {quiz.promise && <p className="mt-1 text-sm text-ink-400">{quiz.promise}</p>}
              {quiz.outcomes?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {quiz.outcomes.map((outcome, index) => (
                    <li key={index}>
                      <Badge tone="brand">{outcome.name}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Section({ title, icon: IconComponent, children }) {
  return (
    <section className="card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-300">
        {IconComponent && <IconComponent className="h-4 w-4 text-brand-400" />}
        {title}
      </h3>
      {children}
    </section>
  )
}

function ItemList({ items = [] }) {
  if (!items.length) return <Empty />

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-100">{item.title}</p>
            {item.description && <p className="text-sm text-ink-400">{item.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function NamedList({ title, items = [] }) {
  if (!items.length) return null

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{title}</p>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="rounded-lg border border-ink-800 bg-ink-950/40 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-ink-100">{item.name}</p>
              {item.value && <span className="text-xs text-brand-300">{item.value}</span>}
            </div>
            {item.description && <p className="mt-1 text-sm text-ink-400">{item.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChipGroup({ label, items = [] }) {
  if (!items?.length) return null

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <li key={index}>
            <Badge>{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Fact({ label, value }) {
  if (!value) return null

  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950/40 p-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-100">{value}</dd>
    </div>
  )
}

function Empty({ text = 'Nothing was found for this section in the VSL.' }) {
  return <p className="text-sm italic text-ink-500">{text}</p>
}
