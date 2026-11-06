/** Wall-clock cap for one chained "season/month" request. The engine's results never depend on chunking, so stopping early only
 * means the user presses the same CTA again; it keeps a request under proxy/mobile timeouts. Override with PLAYBALL_SPAN_BUDGET_MS. */
export const spanDeadline=():number=>Date.now()+Number(process.env.PLAYBALL_SPAN_BUDGET_MS??25_000);
