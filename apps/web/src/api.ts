import type {
  CareerView, ChooseReceipt, ClubCreateRequest, ClubScreen, ClubScreenId, CreationReceipt, CreationRequest, DecisionView, HomeData, PlayScreenId, ProgressMode,
} from './model.js';

/** The boundary M3 will implement over HTTP. Screens depend on this interface only; `fixtureApi` stands in until then.
 * Every mutating call carries a client `commandId`, and a retry with the same id must return the same result. */
export interface PlayballApi {
  home(): Promise<HomeData>;
  career(saveId: string): Promise<CareerView>;
  create(request: CreationRequest): Promise<CreationReceipt>;
  act(saveId: string, actionId: string, mode: ProgressMode, commandId: string): Promise<CareerView>;
  decision(saveId: string, screenId: PlayScreenId): Promise<DecisionView>;
  choose(saveId: string, screenId: PlayScreenId, optionId: string, commandId: string): Promise<ChooseReceipt>;
  createClub(request: ClubCreateRequest): Promise<CreationReceipt>;
  club(saveId: string, screenId: ClubScreenId, query?: { playerKey?: string; gameKey?: string }): Promise<ClubScreen>;
  clubCommand(saveId: string, commandId: string, type: string, payload: Record<string, unknown>): Promise<ClubScreen>;
}
