import { randomUUID } from 'node:crypto';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
  authAllowedSubjects, gameSaves, readSaveState, seasonJobs,
  type SeasonJob, type SeasonJobProgress,
} from '@playball/db';
import type { HighSchoolCareer, KboCareer, UsCareer } from '@playball/engine';
import type { AuthDb } from './auth.js';
import { careerFlowScreen, flowApplies } from './career-flow-screen.js';
import { isUs } from './career-us-flow.js';
import { executeCommandTransaction } from './commands.js';
import type { SaveState } from './engine-command.js';

export function seasonAdvanceCommand(state: SaveState) {
  if (!flowApplies(state)) return undefined;
  return careerFlowScreen(state).commands.find(command => {
    if (command.id !== 'adv-season' || command.confirm || command.sign) return false;
    switch (command.type) {
      case 'CAREER_COLLEGE_ADVANCE': return command.payload.mode === 'SEASON';
      case 'CAREER_SCHOOL_ADVANCE_SPAN':
      case 'CAREER_KBO_PLAY_ADVANCE_SPAN':
      case 'CAREER_US_PLAY_ADVANCE_SPAN': return command.payload.span === 'SEASON';
      default: return false;
    }
  });
}

function seasonProgress(state: SaveState): SeasonJobProgress {
  const career = state.career as HighSchoolCareer | KboCareer | UsCareer;
  const seasonKey = career.world.seasonKey;
  const schedule = isUs(career)
    ? Object.values(career.seasonSchedule?.leagues ?? {}).flat()
    : 'protagonistClubId' in career
      ? Object.values(career.competitionSchedule?.leagues ?? {}).flat()
      : career.world.schedule;
  const regular = schedule.filter(game => game.seasonKey === seasonKey && !game.phase);
  const completedGames = regular.filter(game => Object.hasOwn(career.records.games, game.simulationKey)).length;
  return { seasonKey, phase: career.phaseContext.phase, completedGames, scheduledGames: regular.length };
}

export function publicSeasonJob(job: SeasonJob) {
  return { runId: job.runId, status: job.status, stopReason: job.stopReason, progress: job.progress };
}

export async function startSeasonJob(db: AuthDb, subject: string, saveId: string, requestId: string, expectedRevision: bigint) {
  return db.transaction(async tx => {
    const [save] = await tx.select().from(gameSaves)
      .where(and(eq(gameSaves.id, saveId), eq(gameSaves.ownerId, subject), isNull(gameSaves.deletedAt))).for('update');
    if (!save) return { status: 404, code: 'SAVE_NOT_FOUND' } as const;
    const [existing] = await tx.select().from(seasonJobs).where(eq(seasonJobs.saveId, saveId)).for('update');
    if (existing?.requestId === requestId) {
      if (existing.nextExpectedRevision - BigInt(existing.stepOrdinal) !== expectedRevision) {
        return { status: 409, code: 'COMMAND_ID_REUSED' } as const;
      }
      return { status: 200, job: publicSeasonJob(existing) } as const;
    }
    if (save.revision !== expectedRevision || existing?.status === 'RUNNING') return { status: 409, code: 'REVISION_CONFLICT' } as const;
    const state = await readSaveState(tx, saveId, save.revision, save.state, save.stateFormat) as SaveState;
    if (save.mode !== 'CAREER' || !seasonAdvanceCommand(state)) return { status: 400, code: 'SEASON_NOT_READY' } as const;
    const next = {
      saveId, runId: randomUUID(), requestId, status: 'RUNNING' as const,
      nextExpectedRevision: save.revision, stepOrdinal: 0, stopReason: null,
      progress: seasonProgress(state), createdAt: new Date(), updatedAt: new Date(),
    };
    const [job] = await tx.insert(seasonJobs).values(next).onConflictDoUpdate({
      target: seasonJobs.saveId, set: next,
    }).returning();
    return { status: 200, job: publicSeasonJob(job!) } as const;
  });
}

export async function advanceNextSeasonJob(db: AuthDb): Promise<boolean> {
  const [candidate] = await db.select({ saveId: seasonJobs.saveId }).from(seasonJobs)
    .where(eq(seasonJobs.status, 'RUNNING')).orderBy(asc(seasonJobs.updatedAt), asc(seasonJobs.saveId)).limit(1);
  if (!candidate) return false;
  return db.transaction(async tx => {
    const [save] = await tx.select({ ownerId: gameSaves.ownerId, revision: gameSaves.revision, deletedAt: gameSaves.deletedAt })
      .from(gameSaves).where(eq(gameSaves.id, candidate.saveId)).for('update', { skipLocked: true });
    if (!save) return false;
    const [job] = await tx.select().from(seasonJobs).where(eq(seasonJobs.saveId, candidate.saveId)).for('update');
    if (!job || job.status !== 'RUNNING') return false;
    const [allowed] = await tx.select({ subject: authAllowedSubjects.subject }).from(authAllowedSubjects)
      .where(and(eq(authAllowedSubjects.subject, save.ownerId), eq(authAllowedSubjects.status, 'ACTIVE')));
    const update = (patch: Partial<SeasonJob>) => tx.update(seasonJobs)
      .set({ ...patch, updatedAt: new Date() }).where(eq(seasonJobs.saveId, job.saveId));
    if (save.deletedAt || !allowed || save.revision !== job.nextExpectedRevision) {
      await update({ status: 'STOPPED', stopReason: 'CANCELLED' });
      return true;
    }

    const response = await executeCommandTransaction(tx, {
      saveId: job.saveId, subject: save.ownerId,
      command: ({ state }) => {
        const action = seasonAdvanceCommand(state);
        if (!action) return undefined;
        return { commandId: `season:${job.runId}:${job.stepOrdinal}`, expectedRevision: job.nextExpectedRevision.toString(), type: action.type, payload: action.payload };
      },
      onCommit: async (_tx, { result, applied }) => {
        const stop = result.summary.spanStop;
        await update({
          status: stop === 'BUDGET' ? 'RUNNING' : 'STOPPED',
          stopReason: stop === 'BUDGET' || stop === 'SEASON_END' ? stop : 'EVENT',
          nextExpectedRevision: BigInt(result.revision), stepOrdinal: job.stepOrdinal + 1,
          progress: seasonProgress(applied.nextState),
        });
      },
    });
    if (response.status !== 200 && response.code === 'SEASON_NOT_READY') {
      await update({ status: 'STOPPED', stopReason: 'EVENT' });
    } else if (response.status !== 200 || response.replayed) {
      await update({ status: 'FAILED', stopReason: 'FAILED' });
    }
    return true;
  });
}

export async function readSeasonJob(db: AuthDb, subject: string, saveId: string) {
  const [row] = await db.select({ job: seasonJobs }).from(gameSaves)
    .leftJoin(seasonJobs, eq(seasonJobs.saveId, gameSaves.id))
    .where(and(eq(gameSaves.id, saveId), eq(gameSaves.ownerId, subject), isNull(gameSaves.deletedAt)));
  return row ? { job: row.job ? publicSeasonJob(row.job) : null } : null;
}
