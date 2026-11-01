# M2 closure proof handoff — user-requested stop, 2026-11-02

## Resume harness changes (unexecuted until stable source checkpoint)

The resumed proof owner changed only the two proof scripts and this handoff. No runtime success is inferred from these edits:

- Command receipts now retain a JSON command input and its SHA256, source/result/output hashes, source/result revisions, and command-chain hash. Both original and serialized replay inputs must remain immutable. Initial fixtures are captured once per slice; full state is not retained after every command.
- The source manifest is rebuilt and sorted at each comparison, so added/deleted engine, rules, and test files are detected. The manifest also covers both harness scripts, path/event catalogues, package metadata and the dependency lockfile. Concurrent changes still reject the proof. A failure writes a separate `-failed.json` containing the actual exception, completed slices and interrupted command receipts; it never writes a success status into the final report.
- P15 salary assertions select the actual `path-salary` receipt rather than the first KRW income (which may be a signing bonus). US external inventory/world inputs are retained as actual command inputs rather than labels.
- P02 adds the real E86 learning writer, six pitcher abilities including PICKOFF, valid weights and shared XP reservation. Role competition and completed learning remain unproven.
- P08/P09 add actual posting request/decision/offer reducers for sign, defer, age45 zero offers, and remaining with the original club. Seven closed100-registration seasons, military completion, abilities and recent batting are controlled fixture inputs. Seed selection occurs before tracing and only chooses a nonzero offer-count boundary. These slices do not prove a native seven-season career or US activation.
- P11 adds actual callup response and the existing batch16-game AG reducer, persisted PA, appearance and result-dependent military eligibility. It does not prove the full28-player selection/calendar worker or three duty seasons. If the actual medal is not gold, the positive eligibility branch remains explicitly unproven.
- Default KBO execution adds P23 repeated read-only committed record totals with unchanged world/record hashes. M7 commentary/replay/card/export/backup remain external. P14 was removed from that slice's ID because it does not independently prove same-game trait/goal/chronicle integration.

P10/P16 integration awaits the owning agents' stable helper contracts. P13 and P14 have no new executed endpoint proof here. The parent owns the final stable-source runtime and single full-suite validation. Do not cite this edit note as runtime evidence.

## Frozen state

M2 is **not complete**. No complete P01–24 runtime report or persisted path SHA256 set was produced. Stop requested while extending the proof runner; source and tests below are WIP for checkpoint commit. Do not report this checkpoint as M2 PASS.

Files added:

- `scripts/verify-m2-closure.mjs`: native HS216→college entry, controlled KBO goal/agent/game, command input/output/source/result hashing, JSON replay at every command, immutable-source checks, complete99 source-reference inventory, complete24 path inventory, source SHA256 manifest/concurrent-change rejection.
- `scripts/m2-path-scenarios.mjs`: controlled-prefix actual endpoint scenarios for P01, P03, P04, P05, P06, P07, P12, and accepted/rejected P15 branches. These added scenarios are **not verified to completion**.
- `packages/engine/test/m2-closure-contract.test.ts`: verified E99 controlled M7 notice boundary; exact catalogue/evidence/S45, version/context/availability/repeat guards and ACK. Does not claim a chronicle producer.
- `docs/implementation/M2-CLOSURE-20261102.md`: fresh domain/event/path/PF ownership audit. This is an audit and intended runner contract, not executed full-path evidence.

## Completed verification

`M2-CLOSURE-20261102-domains.log`: **199 tests passed, 0 failed, 0 skipped**, duration107618ms, exit0. Thirty focused engine files cover display/probabilities, traits/rivals, repertoire/XP, relations/history, achievements/goals/agents, college route/service/national, preparation/retry, KBO/US national, military, domestic return, year transitions, advice/awards, and E99. This includes the new E99 test; do not add its separate one-test run to199 as new coverage. These are domain assertions with mixed controlled/native prefixes, not24 path hashes.

Focused ESLint passed for both runner modules and the new E99 test after stopping the runner. No full check or Git action was run by this proof owner.

## Runner attempts and preserved limits

1. First attempt failed because deepStrictEqual treats a null-prototype injury map differently from its JSON object. Fixed the proof assertion to compare canonical state hashes. This was a runner assertion issue, not an engine failure.
2. Second attempt completed the native high-school216→college admission/year-entry function, then failed at controlled KBO advance because the runner passed `'ONE_GAME'` where `advanceKboCareer` requires integer `maxDays`. Corrected to1. This attempt did not write a report or retained command hashes; native execution reached that boundary, but no reproducible persisted hash can be cited.
3. Expanded paths-only attempt failed on missing `eventVersion` in the real draft acceptance command. Corrected signing input to `eventVersion:1` (and direct-US signing likewise).
4. Last paths-only attempt was still running when the user requested stop. Its only emitted line was the startup message. No final path report was written. It was terminated intentionally; no runtime PASS is inferred.

Runner sessions:19795 finished with the integer-maxDays runner error;61237 was interrupted by terminating its uniquely identified Node PID19880. Domain suite session47532 completed exit0 before stop. No owned Node worker remains running. PID19880 command line was `node --import tsx scripts/verify-m2-closure.mjs --paths-only`.

No persisted `M2-CLOSURE-20261102-runtime.json` exists. This absence is intentional and must remain visible. The runtime JSON must be generated by actual completion on a stable source tree, not handwritten.

## Immediate resume work

1. Run the existing paths-only runner and resolve proof-harness issues. In particular verify P15's fixed seeds produce one actual accepted and one rejected quote; verify income assertions match actual ledger fields. Do not change engine policy merely to satisfy fixture assumptions.
2. Add actual endpoint traces for P02 (pitcher role/learning), P08/P09 (posting success/defer/no-offer/remain), P11 (real selection→actual appearance→eligibility), P13 (injury→defer→recovery→one enhancement), P14 (same-game trait/goal outputs; M7 chronicle dependency explicit), P23 (immutable result/record precursor; M7 replay/export dependency explicit).
3. Integrate E68 owner's P10 scenario and E34/E35 owner's P16 exhaustion→actual retirement helper when those helpers are verified. `retry-completion-scenario.ts` was announced by its owner as added but **unverified**; it is not imported by this runner.
4. Re-run default native HS/KBO traces after paths-only scenarios work. Preserve initial fixtures and command hashes. Source-manifest equality intentionally rejects concurrent engine/rules/test changes; wait for a stable checkpoint or rerun after all sources settle.
5. Reconcile all99 event runtime assertions against the latest source. Source wrappers currently exist for career families beyond active E34/E35/E68/E70 work, but reference inventory is triage only. E85 is unread-trait reading surface; E83 FORM is not queued; E99 M7 producer remains external. Add specific missing domain assertions where tests do not exercise real occurrence predicates; do not manufacture ACK events to fill counts.

## Path and PF boundaries

P01–16 remain missing a complete verified per-path command-hash report. Existing scenarios disclose controlled prefixes and invoke real endpoint reducers; they do not claim native full careers. P17–21 are M6 club flows; P22's persistent/two-device proof is M3/M8; P24 mixes M2 caps and M6/UI flow. P23's M2 immutable-source precursor must be independently hashed; export/replay/backup is M7.

PF-D01–07 and D08/09/11/13 were included in the199 passing domain tests. D09 DB constraints remain M3. D10 actual19-year copy is M6, D12 no-mirror visual inspection is display/art, D14 actual staff card is M6/M5, D15 actual silhouette/palette rendering is M4/M5. M2 precursor identities/archive data do not close those external checks. FX01–04 remain separate balance experiments.

Docs72's worker leases, persistent generations, competing-worker transaction and cancellation proof remain M3/M6. M2 must still demonstrate its pure age/growth/record/XP/college/service carryover and multi-owner output invariants. No external dependency should conceal a missing M2 reducer.
