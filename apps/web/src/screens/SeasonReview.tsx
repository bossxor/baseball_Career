import type { SeasonReviewView } from '../model.js';

export function SeasonReview({ review }: { review: SeasonReviewView }) {
 return <section aria-label={`${review.season} 시즌 결과`}>
  <h2>{review.season} 시즌 결과</h2>
  {review.sections.map(section => <section className="panel" key={section.title}>
   <h3>{section.title}</h3>
   <dl className="records">
    {section.lines.map(line => <div key={line.label}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}
   </dl>
  </section>)}
 </section>;
}
