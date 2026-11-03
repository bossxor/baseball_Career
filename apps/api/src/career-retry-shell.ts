import {
  openKboUncontractedRetry, reviewKboUncontractedRoutes, kboRetryRoutesView, startKboRetryPreparation,
  confirmKboRetryPreseason, advanceKboRetryPreparation, trainKboRetryPreparation, settleKboRetryPreparation,
  kboRetryPreparationView, acceptKboRetryOffer, openKboRetryExhaustion, requestKboRetryRetirement,
  confirmKboRetryRetirement, kboRetryRetirementView, assertKboRetryState,
  openAmateurRetryExhaustion, confirmAmateurRetryExhaustion,
  requestAmateurRetirement, resolveAmateurRetirement, amateurRetirementView, openAmateurArchive,
} from '@playball/engine';
import type { KboCareer, HighSchoolCareer } from '@playball/engine';
import type { AppliedCommand, CommandBody, SaveState } from './engine-command.js';

export const RETRY_SCREEN_IDS = ['RETRY_ROUTES', 'RETRY_PREP', 'RETRY_RETIREMENT', 'AMATEUR_RETIREMENT'] as const;

function fail(code: string): never {
  throw Object.assign(new Error(code), { code });
}
function codeOf(err: unknown): never {
  fail(err instanceof Error && /^[A-Z_]+/.test(err.message) ? err.message.split(/[\s:]/)[0]! : 'INVALID_REQUEST');
}

/** The KBO career lives whole on the save document (`state.career`); its own revision is the CAS. */
export function readCareer(state: SaveState): KboCareer | null {
  const c = state.career;
  return c && typeof c === 'object' ? (c as KboCareer) : null;
}

type Payload = Record<string, unknown>;
const str = (p: Payload, k: string) => (typeof p[k] === 'string' ? (p[k] as string) : fail('INVALID_PAYLOAD'));
const num = (p: Payload, k: string) => (typeof p[k] === 'number' ? (p[k] as number) : fail('INVALID_PAYLOAD'));

/** CAREER_RETRY_* — thin dispatch over the E34/E35/E36 engine owners. Engine guards stay authoritative. */
export function applyCareerRetry(state: SaveState, command: CommandBody): AppliedCommand {
  const career = readCareer(state);
  if (!career) fail('CAREER_NOT_FOUND');
  const p = (command.payload && typeof command.payload === 'object' ? command.payload : fail('INVALID_PAYLOAD')) as Payload;
  const rev = num(p, 'careerRevision');
  const exit = () => ({ eventKey: typeof p.eventKey === 'string' ? p.eventKey : '', eventVersion: typeof p.eventVersion === 'number' ? p.eventVersion : 0, command: 'CONFIRM_RETIRE' as const });
  if (command.type.startsWith('CAREER_RETRY_AMATEUR_')) return applyAmateurExit(state, command, p, rev, exit());
  let next: KboCareer;
  let stopReason: string | undefined;
  try {
    switch (command.type) {
      case 'CAREER_RETRY_OPEN': next = openKboUncontractedRetry(career!, rev); break;
      case 'CAREER_RETRY_REVIEW': next = reviewKboUncontractedRoutes(career!, rev, num(p, 'eventVersion')); break;
      case 'CAREER_RETRY_START': next = startKboRetryPreparation(career!, rev, { routePreviewId: str(p, 'routePreviewId') }); break;
      case 'CAREER_RETRY_PRESEASON': next = confirmKboRetryPreseason(career!, rev); break;
      case 'CAREER_RETRY_ADVANCE': {
        const out = advanceKboRetryPreparation(career!, rev, p.mode === 'ONE_MONTH' ? 'ONE_MONTH' : 'ONE_GAME');
        next = out.career; stopReason = (out as { stopReason?: string }).stopReason; break;
      }
      case 'CAREER_RETRY_TRAIN': next = trainKboRetryPreparation(career!, rev, p.choice as never); break;
      case 'CAREER_RETRY_SETTLE': next = settleKboRetryPreparation(career!, rev, p.forfeitUnusedTraining === true); break;
      case 'CAREER_RETRY_ACCEPT': next = acceptKboRetryOffer(career!, rev, { routePreviewId: str(p, 'routePreviewId'), offerKey: str(p, 'offerKey') }); break;
      case 'CAREER_RETRY_EXHAUST': next = openKboRetryExhaustion(career!, rev); break;
      case 'CAREER_RETRY_REQUEST_RETIRE': next = requestKboRetryRetirement(career!, rev); break;
      case 'CAREER_RETRY_CONFIRM_RETIRE': next = confirmKboRetryRetirement(career!, rev, exit()); break;
      default: fail('UNSUPPORTED_COMMAND');
    }
    assertKboRetryState(next!);
  } catch (err) {
    codeOf(err);
  }
  return {
    nextState: { ...state, schemaVersion: state.schemaVersion ?? 1, career: next! },
    summary: {
      type: command.type, phase: next!.phaseContext.phase, careerRevision: next!.revision,
      retryStatus: next!.retryPro?.status, ...(stopReason ? { stopReason } : {}),
    },
    eventIds: [],
    phase: next!.phaseContext.phase,
  };
}

export function retryScreenOf(state: SaveState, screenId: string): unknown {
  const career = readCareer(state);
  if (!career) fail('CAREER_NOT_FOUND');
  try {
    if (screenId === 'AMATEUR_RETIREMENT') return amateurRetirementView(state.career as HighSchoolCareer);
    if (screenId === 'RETRY_ROUTES') return kboRetryRoutesView(career!);
    if (screenId === 'RETRY_PREP') return kboRetryPreparationView(career!);
    return kboRetryRetirementView(career!);
  } catch (err) {
    codeOf(err);
  }
}

/** Amateur (HighSchoolCareer) E35 exit: same save slot, different engine owner. */
function applyAmateurExit(state: SaveState, command: CommandBody, p: Payload, rev: number, confirm: { eventKey: string; eventVersion: number; command: 'CONFIRM_RETIRE' }): AppliedCommand {
  const career = state.career as HighSchoolCareer;
  let next: HighSchoolCareer;
  let navigation: unknown;
  try {
    if (command.type === 'CAREER_RETRY_AMATEUR_EXHAUST') next = openAmateurRetryExhaustion(career, rev);
    else if (command.type === 'CAREER_RETRY_AMATEUR_CONFIRM_RETIRE') next = confirmAmateurRetryExhaustion(career, rev, confirm);
    else if (command.type === 'CAREER_RETRY_AMATEUR_REQUEST_RETIRE') next = requestAmateurRetirement(career, rev, p.eventKey === undefined && p.eventVersion === undefined ? undefined : { eventKey: str(p, 'eventKey'), eventVersion: num(p, 'eventVersion') });
    else if (command.type === 'CAREER_RETRY_AMATEUR_RESOLVE_RETIRE') {
      if (p.decision !== 'CONFIRM_RETIRE' && p.decision !== 'CANCEL_RETIRE') fail('INVALID_PAYLOAD');
      next = resolveAmateurRetirement(career, rev, { eventKey: str(p, 'eventKey'), eventVersion: num(p, 'eventVersion'), command: p.decision });
    }
    else if (command.type === 'CAREER_RETRY_AMATEUR_OPEN_ARCHIVE') {
      const out = openAmateurArchive(career, rev, { eventKey: str(p, 'eventKey'), eventVersion: num(p, 'eventVersion') });
      next = out.career; navigation = out.navigation;
    }
    else fail('UNSUPPORTED_COMMAND');
  } catch (err) {
    codeOf(err);
  }
  return {
    nextState: { ...state, schemaVersion: state.schemaVersion ?? 1, career: next! },
    summary: { type: command.type, phase: next!.phaseContext.phase, careerRevision: next!.revision, retryExit: next!.retryExit?.status, amateurRetirement: next!.amateurRetirement?.status, ...(navigation === undefined ? {} : { navigation }) },
    eventIds: [],
    phase: next!.phaseContext.phase,
  };
}
