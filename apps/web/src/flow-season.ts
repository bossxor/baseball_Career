import type { FlowCommand, FlowView } from './model.js';

function regularSeasonCommand(command: FlowCommand): boolean {
  if (command.id !== 'adv-season' || command.confirm || command.sign) return false;
  if (command.type === 'CAREER_COLLEGE_ADVANCE') return command.payload.mode === 'SEASON';
  return (command.type === 'CAREER_SCHOOL_ADVANCE_SPAN'
    || command.type === 'CAREER_KBO_PLAY_ADVANCE_SPAN' || command.type === 'CAREER_US_PLAY_ADVANCE_SPAN')
    && command.payload.span === 'SEASON';
}

export async function runFlowCommands(
  initial: FlowCommand,
  send: (command: FlowCommand) => Promise<FlowView | null>,
  publish: (view: FlowView | null) => void,
  current: () => boolean,
): Promise<void> {
  let command = initial;
  while (current()) {
    const view = await send(command);
    if (!current()) return;
    publish(view);
    if (!regularSeasonCommand(command) || view?.stop !== 'BUDGET' || !view.canContinueSeason) return;
    const next = view.commands.find(candidate => candidate.type === command.type && regularSeasonCommand(candidate));
    const revision = command.payload.careerRevision, nextRevision = next?.payload.careerRevision;
    if (!next || typeof revision !== 'number' || typeof nextRevision !== 'number'
      || !Number.isSafeInteger(revision) || !Number.isSafeInteger(nextRevision) || nextRevision <= revision) return;
    command = next;
  }
}
