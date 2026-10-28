/** View models the web app reads. They are the app's own DTOs: the web bundle never imports the engine, API or DB
 * packages (lint-enforced); the server fills these from its views, and fixtures stand in until the API is connected. */
import type { PlayableScreenId } from './screen-states.js';

export interface SaveSummary {
  saveId: string; mode: 'CAREER' | 'CLUB'; title: string; seasonLabel: string; phaseLabel: string; savedAtLabel: string; revision: number;
}
export interface HomeData {
  saves: readonly SaveSummary[]; archiveCount: number; resume: { saveId: string; label: string } | null;
}

export type ProgressMode = 'NEXT_MAJOR_EVENT' | 'ONE_GAME' | 'ONE_WEEK';
export type NextActionKind = 'ADVANCE' | 'EVENT' | 'PLAN' | 'RECORDS' | 'OPEN_SCREEN';
/** Every call-to-action on S03 comes from this list; nothing is shown that the server did not offer. */
export interface NextAction { id: string; label: string; kind: NextActionKind; primary?: boolean; disabledReason?: string }
export interface CareerView {
  saveId: string;
  protagonist: { name: string; kindLabel: string; positionLabel: string; ageLabel: string };
  stage: { leagueLabel: string; teamName: string; seasonLabel: string; phaseLabel: string };
  progress: { mode: ProgressMode; alternatives: readonly ProgressMode[] };
  nextActions: readonly NextAction[];
  pendingEventTitle: string | null;
  recentRecords: readonly { label: string; value: string }[];
}
export const PROGRESS_LABELS: Readonly<Record<ProgressMode, string>> = {
  NEXT_MAJOR_EVENT: '다음 주요 사건까지', ONE_GAME: '1경기', ONE_WEEK: '1주일',
};

export interface CreationRequest {
  commandId: string; name: string; kind: 'HITTER' | 'PITCHER'; position: string; throws: 'R' | 'L'; bats: 'R' | 'L' | 'S';
  pitchForm: string | null; archetype: string; focus: readonly string[];
  secondaryPitch?: string;
}
export interface CreationReceipt { saveId: string }

/** Decision screens: M4 play set + M5 remainder (not home/create/career). */
export type PlayScreenId = PlayableScreenId;
export interface DecisionOption { id: string; label: string; primary?: boolean; disabledReason?: string }
export interface DecisionView {
  screenId: PlayScreenId; saveId: string;
  summary: readonly { label: string; value: string }[];
  options: readonly DecisionOption[];
  notice?: string | null;
}
export type ChooseNext =
  | { kind: 'career' }
  | { kind: 'home' }
  | { kind: 'screen'; screenId: PlayScreenId };
export interface ChooseReceipt { next: ChooseNext }

/** S13–S19 club shell. The server fills lines, links and commands; the web does not import the engine. */
export type ClubScreenId = 'S13' | 'S14' | 'S15' | 'S16' | 'S17' | 'S18' | 'S19';
export interface ClubScreen {
  screenId: ClubScreenId;
  title: string;
  lines: readonly { label: string; value: string }[];
  links: readonly { screenId: ClubScreenId; label: string }[];
  commands: readonly { id: string; label: string; type: string; payload: Record<string, unknown> }[];
}
export interface ClubCreateRequest { commandId: string; clubId: string }
