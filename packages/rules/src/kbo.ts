/** 37: approved team mapping; legacy logo IDs are distinct from display names. */
export const KBO_CLUBS=[
 {id:'LG',name:'LG 트윈스'},{id:'HH',name:'한화 이글스'},{id:'SK',name:'SSG 랜더스'},
 {id:'SS',name:'삼성 라이온즈'},{id:'NC',name:'NC 다이노스'},{id:'KT',name:'kt wiz'},
 {id:'LT',name:'롯데 자이언츠'},{id:'HT',name:'KIA 타이거즈'},{id:'OB',name:'두산 베어스'},{id:'WO',name:'키움 히어로즈'},
] as const;
export const KBO_ROSTER_LIMITS={initial:50,minimum:35,maximum:60,firstTeam:28} as const;
export const KBO_MONEY={minimumSalaryWon:30_000_000,maximumSalaryWon:3_000_000_000,annualBudgetWon:12_000_000_000,initialPayrollWon:9_000_000_000} as const;
