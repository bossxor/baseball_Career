/** Screen state texts from docs/design/screen-state-catalog.json (tests compare — no drift). */
import m5 from './m5-screens.json';

export type M4ScreenId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S22' | 'S23' | 'S28';
export type M5ScreenId =
  | 'S10' | 'S11' | 'S12' | 'S13' | 'S14' | 'S15' | 'S16' | 'S17' | 'S18' | 'S19' | 'S20' | 'S21'
  | 'S24' | 'S25' | 'S26' | 'S27' | 'S29' | 'S30' | 'S31' | 'S32' | 'S33' | 'S34' | 'S35' | 'S36'
  | 'S37' | 'S38' | 'S39' | 'S40' | 'S41' | 'S42' | 'S43' | 'S44' | 'S45';
export type ScreenId = M4ScreenId | M5ScreenId;
export type ScreenState = 'ready' | 'empty' | 'error' | 'saving' | 'conflict' | 'loading';
export type PlayableScreenId = Exclude<ScreenId, 'S01' | 'S02' | 'S03'>;
type Texts = Readonly<Record<Exclude<ScreenState, 'ready'>, string>>;

const COMMON = {
  saving: '처리 중입니다. 같은 선택을 다시 실행하지 않고 결과를 확인합니다.',
  conflict: '다른 기기의 진행 내용이 있습니다. 최신 저장을 불러온 뒤 선택하세요.',
  loading: '정보를 불러오는 중입니다. 확정 버튼은 잠시 사용할 수 없습니다.',
} as const;
const err = (conditions: string) => `처리할 수 없습니다. ${conditions} 조건과 최신 상태를 확인하세요. 입력은 유지합니다.`;
const t = (empty: string, conditions: string): Texts => ({ empty, error: err(conditions), ...COMMON });

const M4_PLAY = ['S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S22', 'S23', 'S28'] as const satisfies readonly PlayableScreenId[];
export const M5_IDS = m5.ids as readonly M5ScreenId[];
export const PLAY_SCREEN_IDS: ReadonlySet<string> = new Set<string>([...M4_PLAY, ...M5_IDS]);
export const isPlayScreen = (id: string): id is PlayableScreenId => PLAY_SCREEN_IDS.has(id);

const M4_TITLES: Readonly<Record<M4ScreenId, string>> = {
  S01: '홈', S02: '생성', S03: '커리어', S04: '고교결산', S05: '드래프트', S06: '사건',
  S07: '결산', S08: '계약', S09: '은퇴', S22: '스타일', S23: '강화', S28: '졸업진로',
};
const M4_STATES: Readonly<Record<M4ScreenId, Texts>> = {
  S01: {
    empty: '최근 세이브가 없습니다. 새 커리어나 구단으로 시작하세요.',
    error: '진행을 확인하지 못했습니다. 새로 시작하지 않고 연결과 저장 결과를 다시 확인하세요.',
    saving: '내부 결과 확인; 중단·복구 상태 문구나 별도 안내 카드 없음',
    conflict: '최신 저장으로 연결; 실제 재확인이 필요한 선택만 해당 화면에서 확인',
    loading: '이어하기 버튼 문구 유지; 중복 클릭 방지와 aria-busy만 적용',
  },
  S02: t('유형과 육성4개를 선택하면 생성 미리보기를 볼 수 있습니다.', '이름·좌투·투구폼검증, 초안취소'),
  S03: t('아직 출장 기록이 없습니다. 현재 소속 일정부터 시작하세요.', '명령결과유실/사건대기'),
  S04: t('출장 기록이 없어도 졸업 진로를 선택할 수 있습니다.', '성적0도 진행가능'),
  S05: t('이번에는 지명되지 않았습니다. 대학·복학·남은 재도전을 확인하세요.', '중복수락 금지'),
  S06: t('지금 선택할 사건이 없습니다. 현재 일정으로 돌아가세요.', '만료/조건불충족'),
  S07: t('이번 시즌 출장 기록이 없습니다. 복무·부상 기간을 확인하세요.', '국가대표/정규기록 분리'),
  S08: t('계약 제안이 없습니다. 남은 진로와 기한을 확인하세요.', '제안0,기한만료'),
  S09: t('보관 저장을 확인 중입니다. 같은 은퇴 결과를 다시 조회하세요.', '저장실패 재시도'),
  S22: t('유형 변경 기회가 없습니다. 현재 계획은 확인할 수 있습니다.', '부상/횟수/투타종류'),
  S23: t('강화 기회를 이미 사용했습니다. 사용 내역을 확인하세요.', '실패재추첨금지'),
  S28: t('진로 정보를 다시 불러오세요. 미국은 유효 제안이 있을 때만 표시됩니다.', '조회만으로진로고정안함'),
};

export const SCREEN_TITLES: Readonly<Record<ScreenId, string>> = {
  ...M4_TITLES,
  ...(m5.titles as Record<M5ScreenId, string>),
};
export const SCREEN_STATES: Readonly<Record<ScreenId, Texts>> = {
  ...M4_STATES,
  ...(m5.states as Record<M5ScreenId, Texts>),
};
export const stateText = (id: ScreenId, state: ScreenState): string | null => (state === 'ready' ? null : SCREEN_STATES[id][state]);
