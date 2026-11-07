import type { RetirementSummaryView } from '../model.js';

export function RetirementSummary({ summary }: { summary: RetirementSummaryView }) {
 return <section aria-label="은퇴 기록">
  <h2>{summary.name}의 은퇴 기록</h2>
  <dl className="records">{summary.details.map(line => <div key={line.label}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}</dl>
  {summary.sections.map(section => <section className="panel" key={section.title}>
   <h3>{section.title}</h3>
   <dl className="records">{section.lines.map(line => <div key={line.label}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}</dl>
  </section>)}
 </section>;
}
