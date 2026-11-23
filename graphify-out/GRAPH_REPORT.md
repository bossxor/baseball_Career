# Graph Report - packages  (2026-11-23)

## Corpus Check
- 461 files · ~142,619 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3325 nodes · 21437 edges · 84 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6a3d450`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Kbo Career Version
- Fixtures
- Player
- Kbo Draft
- High School Career
- Kbo Career Entry
- Us Career Entry
- Events
- Kbo Club Progress
- Records
- Career Agent
- National Progress
- Fixtures
- Us Preseason
- Kbo Progress
- College Cup
- Kbo Windows
- Save State
- Kbo Club Command
- Us Career Entry
- Us Return Retry
- Game
- Season Goals
- Career Achievements
- Kbo Service Payroll
- Kbo Us Activation Tests
- Pro Career Advice
- Kbo Free Agents
- College Year
- Career Us
- Us Amateur Return Career
- Us Amateur Return
- Career Preparation
- College National
- Kbo Club Import
- Us Direct
- Game
- Kbo National
- Native Return Cache
- Index
- High School Game
- Stats
- Repertoire
- Us Season
- Kbo Career Fa
- Us Postseason Progress
- Index
- National Progress Tests
- Us National
- Us Relations
- Career Pro Retry
- High School Traits
- Us Military Plan Tests
- Kbo Posting
- Types
- Lineup
- Traits Tests
- Game Pitch Xp Tests
- Kbo Npc Military Tests
- Us Amateur Return Career
- Kbo Overseas Fa
- Kbo World
- Career Alias
- Stats
- Repertoire Events
- High School World
- Career Record Correction
- Us Windows
- Pro Career Results
- Retry Completion Scenario
- Pro Trait Notices
- Engine Package
- Relationships
- Pitcher Rival
- Preparation Season
- Schedule
- Rules Package
- 0000 M3 Core
- Kbo Sangmu
- Relationship History
- Engine Package
- Db Package
- Pro Trait Summary
- Rules Package

## God Nodes (most connected - your core abstractions)
1. `canonicalJson()` - 435 edges
2. `KboCareer` - 165 edges
3. `assertKboCareerRevision()` - 155 edges
4. `createWorldEvent()` - 130 edges
5. `eventDefinition()` - 120 edges
6. `abilityKeys()` - 118 edges
7. `enteredKboCareer()` - 117 edges
8. `assertUsCareerRevision()` - 112 edges
9. `emptyBatting()` - 110 edges
10. `UsCareer` - 103 edges

## Surprising Connections (you probably didn't know these)
- `sum()` --calls--> `abilityKeys()`  [EXTRACTED]
  engine/src/relationships.ts → rules/src/index.ts
- `request()` --calls--> `abilityKeys()`  [EXTRACTED]
  engine/test/kbo-club-import.test.ts → rules/src/index.ts
- `writeNativeReturnCache()` --calls--> `encodeStateParts()`  [EXTRACTED]
  engine/test/native-return-cache.ts → db/src/state-codec.ts
- `reconcileAssessment()` --calls--> `abilityKeys()`  [EXTRACTED]
  engine/src/assessment.ts → rules/src/index.ts
- `assessmentView()` --calls--> `abilityKeys()`  [EXTRACTED]
  engine/src/assessment.ts → rules/src/index.ts

## Import Cycles
- 2-file cycle: `engine/src/career-preparation.ts -> engine/src/career-route-notices.ts -> engine/src/career-preparation.ts`
- 2-file cycle: `engine/src/career-preparation.ts -> engine/src/career-us.ts -> engine/src/career-preparation.ts`
- 2-file cycle: `engine/src/career-preparation.ts -> engine/src/high-school-route.ts -> engine/src/career-preparation.ts`
- 2-file cycle: `engine/src/college-graduation.ts -> engine/src/college-result.ts -> engine/src/college-graduation.ts`
- 2-file cycle: `engine/src/college-national.ts -> engine/src/high-school-career.ts -> engine/src/college-national.ts`
- 2-file cycle: `engine/src/high-school-career.ts -> engine/src/relation-notices.ts -> engine/src/high-school-career.ts`
- 2-file cycle: `engine/src/high-school-career.ts -> engine/src/repertoire-events.ts -> engine/src/high-school-career.ts`
- 2-file cycle: `engine/src/high-school-career.ts -> engine/src/season-goals.ts -> engine/src/high-school-career.ts`
- 2-file cycle: `engine/src/kbo-draft.ts -> engine/src/kbo-remainder-pay.ts -> engine/src/kbo-draft.ts`
- 2-file cycle: `engine/src/kbo-draft.ts -> engine/src/kbo-service-payroll.ts -> engine/src/kbo-draft.ts`
- 2-file cycle: `engine/src/career-kbo.ts -> engine/src/career-preparation.ts -> engine/src/career-kbo.ts`
- 2-file cycle: `engine/src/career-kbo.ts -> engine/src/college-route.ts -> engine/src/career-kbo.ts`
- 2-file cycle: `engine/src/career-kbo.ts -> engine/src/kbo-entry.ts -> engine/src/career-kbo.ts`
- 2-file cycle: `engine/src/career-pro-retry.ts -> engine/src/kbo-career-version.ts -> engine/src/career-pro-retry.ts`
- 2-file cycle: `engine/src/career-record-correction.ts -> engine/src/high-school-career.ts -> engine/src/career-record-correction.ts`
- 2-file cycle: `engine/src/career-record-correction.ts -> engine/src/kbo-career-version.ts -> engine/src/career-record-correction.ts`
- 2-file cycle: `engine/src/career-record-correction.ts -> engine/src/us-career-entry.ts -> engine/src/career-record-correction.ts`
- 2-file cycle: `engine/src/career-us.ts -> engine/src/college-graduation.ts -> engine/src/career-us.ts`
- 2-file cycle: `engine/src/career-us.ts -> engine/src/college-route.ts -> engine/src/career-us.ts`
- 2-file cycle: `engine/src/career-us.ts -> engine/src/high-school-route.ts -> engine/src/career-us.ts`

## Communities (84 total, 0 thin omitted)

### Community 0 - "Kbo Career Version"
Cohesion: 0.06
Nodes (112): careerAgentOffseasonOffer(), confirmKboActiveService(), eligible(), kboActiveServicePreview(), programFor(), assertKboCareerRevision(), closeKboMilitaryCalendarDay(), kboMilitaryCompletionDays() (+104 more)

### Community 1 - "Fixtures"
Cohesion: 0.07
Nodes (83): kboCareerEntryView(), SANGMU_TEAM_KEY, enlistInSangmu(), activateKboNpcMilitaryContracts(), assertKboOpeningRoster(), basis(), club(), confirmKboOpeningRoster() (+75 more)

### Community 2 - "Player"
Cohesion: 0.07
Nodes (82): allocateCapped(), applyAging(), applyGrowthBudget(), GrowthPeriod, naturalGrowthBudgetUnits(), positiveGrowthMultiplier(), settleNaturalGrowth(), EmergencyCandidate (+74 more)

### Community 3 - "Kbo Draft"
Cohesion: 0.07
Nodes (85): HealthGame, kboRenewalSalaryWon(), assertKboRecruitmentWorld(), expectedResult(), KboDraftResult, slots(), applyKboFinanceRebuild(), archiveKboSettledContract() (+77 more)

### Community 4 - "High School Career"
Cohesion: 0.08
Nodes (68): CareerKboRecruitment, CareerRouteNoticeLedger, setCollegePreseasonArchetype(), CollegeCup, CollegeYearEnd, CollegeGraduation, CollegeSeasonResult, CollegeNpcGrowth (+60 more)

### Community 5 - "Kbo Career Entry"
Cohesion: 0.06
Nodes (74): CareerAliasSnapshot, KboRetryPro, CollegeNationalSession, GrowthPolicy, SeasonGrowthLedger, HealthLedger, Injury, SchoolDayLedger (+66 more)

### Community 6 - "Us Career Entry"
Cohesion: 0.09
Nodes (61): acceptKboRetryOffer(), createSeasonGrowthLedger(), KboPostingReturnRights, activateKboUsCareer(), sealedRelationIdentities(), signedOffer(), schoolNationalInheritance(), emptyPitchXpLedger() (+53 more)

### Community 7 - "Events"
Cohesion: 0.08
Nodes (59): AmateurRetirement, amateurRetirementView(), basis(), checked(), context(), farewell(), makeEvent(), openAmateurArchive() (+51 more)

### Community 8 - "Kbo Club Progress"
Cohesion: 0.07
Nodes (53): EngineTimingCategory, EngineTimingObserver, measureEngineClone(), setEngineTimingObserver(), SchoolDayResult, applyKboClubLineup(), autoClubLineup(), createKboClubGame() (+45 more)

### Community 9 - "Records"
Cohesion: 0.07
Nodes (45): canonicalGame(), createHealthLedger(), injuryProbability(), key(), advanceAthleteDutySeason(), confirmAthleteService(), queueDutyNotice(), acceptKboReturnOffer() (+37 more)

### Community 10 - "Career Agent"
Cohesion: 0.10
Nodes (58): acceptCareerRolePromise(), addTrust(), AgentCareer, AgentClubRelationship, AgentIncome, AgentRoleRequest, archivedAgentUsSalary(), assert() (+50 more)

### Community 11 - "National Progress"
Cohesion: 0.08
Nodes (53): NationalMedal, NationalTournament, kboNationalCandidates(), kboNationalSelectionView(), openKboNationalSelection(), replaceNationalInjuryWithEmergency(), ephemeralBook(), ledger() (+45 more)

### Community 12 - "Fixtures"
Cohesion: 0.15
Nodes (44): basis(), careerKboDraftView(), current(), decideCareerKboDraft(), prepareCareerKboDraft(), resolveCareerKboDraft(), route(), careerPreparationDraftScore() (+36 more)

### Community 13 - "Us Preseason"
Cohesion: 0.11
Nodes (44): usCareerEntryView(), initialUsRecruitmentInventory(), UsRecruitmentAllocation, assertUsMilitaryPlayable(), usMinorMarketView(), assertSource(), basis(), beginUsPreseasonPitchLearning() (+36 more)

### Community 14 - "Kbo Progress"
Cohesion: 0.09
Nodes (51): enqueueWorldEvent(), projectKboCompetitionGameWorld(), advanceKboCareerRun(), advanceKboCareerStep(), buildKboGameContext(), contractDecisionRequired(), firstDay(), KboProgressStop (+43 more)

### Community 15 - "College Cup"
Cohesion: 0.09
Nodes (48): AssessmentProgress, ownAssessmentLevel(), advanceCollegeCareer(), confirmCollegePreseason(), pauseCollegeCareer(), trainCollegeCareer(), advanceCollegeCup(), bracket() (+40 more)

### Community 16 - "Kbo Windows"
Cohesion: 0.11
Nodes (44): competitionScore(), competitionTotals(), futuresTeamGames(), kboCompetitionScore(), pick(), resolveKboCallup(), reviewKboAiRosters(), reviewKboCallup() (+36 more)

### Community 17 - "Save State"
Cohesion: 0.05
Nodes (45): dependencies, drizzle-orm@^0.44.7, pg@^8.16.3, devDependencies, drizzle-kit@^0.31.5, @electric-sql/pglite@^0.3.14, @types/pg@^8.15.5, exports (+37 more)

### Community 18 - "Kbo Club Command"
Cohesion: 0.08
Nodes (50): applyBullpen(), applyKboClubCommand(), CLUB_SCREEN_IDS, ClubScreenCommand, ClubScreenId, ClubScreenLine, ClubScreenView, DIFFICULTY (+42 more)

### Community 19 - "Us Career Entry"
Cohesion: 0.11
Nodes (45): careerRetirementEventId(), retirementConfirmationId(), assertUsCareerRevision(), auditUsClosedDays(), settleOwnedUsGrowth(), settleUsSeasonGrowth(), usGrowthPeriods(), completeUsMajorFaWindow() (+37 more)

### Community 20 - "Us Return Retry"
Cohesion: 0.12
Nodes (53): AmateurRetryExit, KboDraftProgram, RetryCareerLedger, mergeUsReturnRecords(), advanceUsAmateurReturnRetryPreparation(), assertDraft(), assertExhaustion(), assertImmutableOrigin() (+45 more)

### Community 21 - "Game"
Cohesion: 0.10
Nodes (48): AgentSalaryRequest, canonicalJson(), usCareerView(), UsContractOrigin, usContractOrigin(), assertUsRecruitmentWorld(), UsRecruitmentWorld, openingUsMajorYear() (+40 more)

### Community 22 - "Season Goals"
Cohesion: 0.09
Nodes (51): AppearanceProof, assertProCareerAwards(), AwardCareer, AwardGame, calculateProSeasonAwards(), Candidate, CareerProAwardLedger, compareId() (+43 more)

### Community 23 - "Career Achievements"
Cohesion: 0.09
Nodes (44): canonicalSeal(), encoder, matchesCanonicalSeal(), AchievementCareer, candidates(), CareerAchievementEvidence, CareerAchievementId, careerAchievementsView() (+36 more)

### Community 24 - "Kbo Service Payroll"
Cohesion: 0.10
Nodes (43): applyKboClubRosterPlan(), releaseToPool(), swapClub(), assertRevision(), startNextKboClubSeason(), assertKboContractPaymentLedger(), assertSnapshot(), createKboContractPaymentLedger() (+35 more)

### Community 25 - "Kbo Us Activation Tests"
Cohesion: 0.11
Nodes (37): UsKboReturnAuthority, LEVELS, recordUsMinorOptionChoice(), resolveUsLevelEvent(), resolveUsLevelEventResult(), reviewUsLevel(), settleUsMinorOptions(), openUsMajorFaWindow() (+29 more)

### Community 26 - "Pro Career Advice"
Cohesion: 0.10
Nodes (47): CompetitionGameWorld, ClubLineupDraft, FieldPosition, AdviceCareer, adviceDayClosed(), AdviceId, assertRevision(), beginProPreseasonPositionFitPlan() (+39 more)

### Community 27 - "Kbo Free Agents"
Cohesion: 0.12
Nodes (36): group(), kboAiCandidatePriority(), kboAiRoleNeed(), prepareKboAiRenewals(), refreshKboAiAssessments(), required(), clamp(), KBO_RENEWAL_SAMPLE (+28 more)

### Community 28 - "College Year"
Cohesion: 0.18
Nodes (35): resolveCareerAchievementEvent(), assertCareerKboSigning(), archiveSchoolSeason(), closeHighSchoolSeasonForCollege(), matchesSchoolYearEndBasis(), schoolYearEndBasis(), schoolYearEndRepertoire(), startAdmittedCollegeSeason() (+27 more)

### Community 29 - "Career Us"
Cohesion: 0.13
Nodes (41): advanceCareerUsNegotiation(), assertCareerUsSigning(), assertIndependentSource(), assertRoute(), basis(), CareerUsRecruitment, carryCollegeUsComparison(), current() (+33 more)

### Community 30 - "Us Amateur Return Career"
Cohesion: 0.15
Nodes (39): prepareKboDraft(), resolveKboDraft(), PreparationWorld, advanceUsAmateurReturn(), authority(), closeReturnMarketEvent(), decideUsAmateurReturnDraft(), event() (+31 more)

### Community 31 - "Us Amateur Return"
Cohesion: 0.12
Nodes (42): assertPreparationSeason(), preparationSeasonView(), startPreparationSeason(), acknowledgeRetryPreparationResult(), assertAuthority(), assertRetryCareerLedger(), assertRetryCareerRevision(), assertReturnedUsDraftProof() (+34 more)

### Community 32 - "Career Preparation"
Cohesion: 0.14
Nodes (40): active(), advanceCareerPreparation(), assertCareerPreparation(), authority(), careerPreparationRoutes(), careerPreparationView(), commandPreparation(), confirmPreparationPreseason() (+32 more)

### Community 33 - "College National"
Cohesion: 0.16
Nodes (38): advanceCollegeNationalMatch(), assertCollegeNationalResponseDeadline(), assertCollegeNationalState(), closeCollegeNationalDay(), closeEvent(), collegeNationalCandidates(), CollegeNationalResume, commitPitchXp() (+30 more)

### Community 34 - "Kbo Club Import"
Cohesion: 0.09
Nodes (36): archivedPlayerOf(), ArchivedPlayerSnapshot, ClubImportRequest, importArchivedPlayers(), importedPlayerOf(), importReplacementCandidates(), assignNationalPresets(), Candidate (+28 more)

### Community 35 - "Us Direct"
Cohesion: 0.11
Nodes (34): assessmentMidpointScore(), assessmentOffset(), assessmentView(), observeAssessmentProgress(), PotentialRange, potentialRange(), reconcileAssessment(), canShowUsDirect() (+26 more)

### Community 36 - "Game"
Cohesion: 0.14
Nodes (31): advanceBases(), activePitcher(), appearanceOf(), calculatePitcherDecisions(), finish(), processPlateAppearance(), reviewPitcher(), selectRepresentativePitch() (+23 more)

### Community 37 - "Kbo National"
Cohesion: 0.11
Nodes (33): KboNationalResume, assertNationalLedger(), closeNationalTask(), confirmNationalEligibility(), ledger(), nationalAthleteEligible(), NationalBenefitReceipt, NationalCallup (+25 more)

### Community 38 - "Native Return Cache"
Cohesion: 0.10
Nodes (21): readSaveState(), encodeStateParts(), visit(), Event, Frame, invalid(), jsonValue(), primitive() (+13 more)

### Community 39 - "Index"
Cohesion: 0.12
Nodes (33): CAREER_ACHIEVEMENT_DEFINITIONS, CareerAliasReceipt, CareerPreparationLedger, CollegeNationalLedger, CollegeNationalPhase, CollegeNationalSources, advanceCollegeLeagueHost(), advanceNpcLeagueHost() (+25 more)

### Community 40 - "High School Game"
Cohesion: 0.14
Nodes (29): advanceHighSchoolGame(), commitHighSchoolGame(), commitSchoolCompetitionGame(), HighSchoolGameContext, HighSchoolGameJob, lookup(), manualAssignment(), prepareHighSchoolGame() (+21 more)

### Community 41 - "Stats"
Cohesion: 0.15
Nodes (32): consumeCareerRoleReview(), candidate(), collegeCareerDraftEvaluation(), draftBaseScore(), evaluation(), pickLine(), recommendClubCallup(), kboForcedRetirementReview() (+24 more)

### Community 42 - "Repertoire"
Cohesion: 0.14
Nodes (31): validateGamePitchDevelopment(), sealKboLearningCalendars(), Calendar, inferCalendar(), registerPitchLearning(), registerPitchLearningCalendar(), settleRegisteredPitchLearning(), validateCalendar() (+23 more)

### Community 43 - "Us Season"
Cohesion: 0.12
Nodes (32): CareerAchievementLedger, UsCareer, UsCareerPublicView, UsDirectSigning, UsLevelMove, UsLevelReview, usMilitaryReturnConditionMultiplier(), UsMilitaryYearArchive (+24 more)

### Community 44 - "Kbo Career Fa"
Cohesion: 0.17
Nodes (30): acceptKboCareerFaOffer(), activateKboCareerFa(), active(), assertAcceptedKboCareerFa(), assertKboCareerFaLedger(), ClubQuoteBasis, context(), contract() (+22 more)

### Community 45 - "Us Postseason Progress"
Cohesion: 0.13
Nodes (29): apply(), assertMlbPostseason(), createMlbPostseason(), initial(), leagues, MlbLeague, MlbPostseason, MlbPostseasonGame (+21 more)

### Community 46 - "Index"
Cohesion: 0.08
Nodes (22): careerSeasonGrowthSummary(), createCollegeWorld(), createStreams(), create(), ABILITY_LABELS, ABILITY_MIN_UNITS, ABILITY_SCHEMA_VERSION, AbilityKey (+14 more)

### Community 47 - "National Progress Tests"
Cohesion: 0.17
Nodes (27): appearanceFatigue(), advanceNationalMatch(), assertNationalBracket(), competitionId(), createNationalBracket(), nationalMatchesOnDay(), nationalNationPreset(), nextNationalMatch() (+19 more)

### Community 48 - "Us National"
Cohesion: 0.18
Nodes (29): HealthResult, nationalInviteDeadlines(), nationalUsCandidates(), usNationalNpcOwner(), actualP12Timing(), advanceUsAthleteDutySeason(), assertUsNationalResponseDeadline(), assertUsNationalState() (+21 more)

### Community 49 - "Us Relations"
Cohesion: 0.17
Nodes (26): RelationNoticeReadInput, RelationNoticeReadSource, Identity, identity(), relationSource(), resolveUsRelationNotice(), unreadUsRelationNotices(), usRelationDetailView() (+18 more)

### Community 50 - "Career Pro Retry"
Cohesion: 0.23
Nodes (27): advanceKboRetryPreparation(), archiveRetryRetirement(), assertKboRetryState(), authority(), close(), command(), confirmKboRetryExhaustion(), confirmKboRetryPreseason() (+19 more)

### Community 51 - "High School Traits"
Cohesion: 0.13
Nodes (26): CareerRecordCorrectionCommand, RecordCorrectionCareer, GeneralTraitCard, cachedTotals(), careerScopes(), collectStarterEvidence(), createCareerTraitLedger(), empty() (+18 more)

### Community 52 - "Us Military Plan Tests"
Cohesion: 0.17
Nodes (24): chooseUsMilitaryPlan(), completeUsMilitaryService(), confirmUsMilitaryReturn(), declineUsMilitaryReturn(), declineUsMilitaryReturnOffer(), recordUsMilitaryClosedDay(), serving(), startUsMilitaryServiceSeason() (+16 more)

### Community 53 - "Kbo Posting"
Cohesion: 0.17
Nodes (27): acceptKboPostingOffer(), activeContract(), buildOffers(), current(), expireOrRejectKboPosting(), KBO_POSTING_APPROVAL_SCORE, KBO_POSTING_FEE_RATE, KBO_POSTING_FX_KRW_PER_USD (+19 more)

### Community 54 - "Types"
Cohesion: 0.14
Nodes (21): BasePlayInput, Bases, Runner, RunningAttempt, Distribution, CareerRepertoireLedger, PitchLevelReceipt, Streams (+13 more)

### Community 55 - "Lineup"
Cohesion: 0.18
Nodes (21): assertFirstTeam(), repairTransferClub(), selectKboDualLeagueRoster(), stable(), weak(), selectKboFirstTeamRoster(), Assignment, automaticFieldLineup() (+13 more)

### Community 56 - "Traits Tests"
Cohesion: 0.14
Nodes (17): ability(), careerSum(), careerTraitView(), GENERAL, HIDDEN_DETAIL, TraitProgressPart, defenseTraitTemporary(), HIDDEN_META (+9 more)

### Community 57 - "Game Pitch Xp Tests"
Cohesion: 0.18
Nodes (18): assertGameInvariants(), createGame(), gameVersion(), runGameChunk(), finish(), play(), splitPitchingRates(), hitters (+10 more)

### Community 58 - "Kbo Npc Military Tests"
Cohesion: 0.17
Nodes (20): closeKboNpcMilitaryCalendarDay(), advanceKboCareer(), signKboRequiredReplacement(), finishDay(), armyGrowthGame(), cache, closeFirst(), finishDay() (+12 more)

### Community 59 - "Us Amateur Return Career"
Cohesion: 0.27
Nodes (19): assertHealthPrefix(), assertRecordPrefix(), assertUsAmateurReturnCareer(), same(), assertUsReturnRetirement(), basis(), canRequestUsReturnRetirement(), check() (+11 more)

### Community 60 - "Kbo Overseas Fa"
Cohesion: 0.19
Nodes (17): acceptKboOverseasFaOffer(), buildOffers(), current(), expireOrRejectKboOverseasFa(), KBO_OVERSEAS_FA_WINDOW_DAYS, kboOverseasFaEligibility(), offseason(), openKboOverseasFaOffers() (+9 more)

### Community 61 - "Kbo World"
Cohesion: 0.20
Nodes (13): assertInitialKboWorld(), balanced(), createKboRosterWorld(), H_POSITIONS, initialKboSalaries(), KboClub, kboInitialAbilities(), P_POSITIONS (+5 more)

### Community 62 - "Career Alias"
Cohesion: 0.27
Nodes (17): AliasCareer, aliasEqual(), AliasGoalId, assertCareerAliases(), CareerAliasLedger, careerAliasView(), CareerRecordAlias, keyOf() (+9 more)

### Community 63 - "Stats"
Cohesion: 0.26
Nodes (14): batting(), compare(), kboRetirementArchiveView(), pitching(), candidates(), battingRates(), inningsDisplay(), pitchingRates() (+6 more)

### Community 64 - "Repertoire Events"
Cohesion: 0.36
Nodes (17): append(), assertRevision(), availableEventCommands(), careerBattingApproaches(), careerRepertoireEventsView(), empty(), isKbo(), isUs() (+9 more)

### Community 65 - "High School World"
Cohesion: 0.23
Nodes (11): assertHighSchoolWorld(), assertSchoolWorldRoster(), HighSchoolWorld, RngState, HITTER_POSITIONS, PITCHER_POSITIONS, SeasonCalendar, fixture() (+3 more)

### Community 66 - "Career Record Correction"
Cohesion: 0.31
Nodes (15): assertOpen(), assertReplacement(), assertRoot(), auditCareerRecordCorrections(), CareerRecordCorrectionLedger, CareerRecordCorrectionReceipt, correctCareerGameContribution(), isKbo() (+7 more)

### Community 67 - "Us Windows"
Cohesion: 0.24
Nodes (15): CareerTrainingResult, TrainingChoice, TrainingContext, US_SEASON_GAMES, applyUsSeasonTraining(), changeUsMidseasonArchetype(), idle(), previewUsTraining() (+7 more)

### Community 68 - "Pro Career Results"
Cohesion: 0.28
Nodes (15): append(), CareerProResultLedger, injuryId(), isUs(), ledger(), order(), played(), proCareerResultEventsView() (+7 more)

### Community 69 - "Retry Completion Scenario"
Cohesion: 0.26
Nodes (11): createKboPostseason(), KboRound, KboSeries, nextKboPostseasonGame(), PLAN, assertKboPostseasonProgress(), recordKboPostseasonGame(), play() (+3 more)

### Community 70 - "Pro Trait Notices"
Cohesion: 0.25
Nodes (14): assertBoundary(), HIDDEN, isUs(), KboProTraitResume, ProCareer, ProTraitChoice, ProTraitResolution, ProTraitResume (+6 more)

### Community 71 - "Engine Package"
Cohesion: 0.16
Nodes (13): dependencies, @noble/hashes@2.4.0, @playball/rules@0.1.0, exports, name, private, scripts, build (+5 more)

### Community 72 - "Relationships"
Cohesion: 0.22
Nodes (13): duelKey(), formedBefore(), pairKey(), PitcherRivalFormationReceipt, rate(), RelationMilestone, RelationScope, RelationType (+5 more)

### Community 73 - "Pitcher Rival"
Cohesion: 0.45
Nodes (10): actor(), formPitcherRivalFromGame(), noticeReceipt(), pitcherRivalFormationKey(), preparePitcherRivalNoticeRead(), resolvePitcherRivalNotice(), slotKey(), unreadPitcherRivalNotices() (+2 more)

### Community 74 - "Preparation Season"
Cohesion: 0.45
Nodes (11): advancePreparationSeason(), assertRevision(), bump(), calendarMonth(), completePreparationSeason(), confirmPreparationPreseason(), count(), safeDay() (+3 more)

### Community 75 - "Schedule"
Cohesion: 0.38
Nodes (8): balanceVenues(), createEvenLeagueSchedule(), createRoundRobinSchedule(), createSingleRoundRobinSchedule(), materialize(), pairRounds(), ScheduleInput, teams()

### Community 76 - "Rules Package"
Cohesion: 0.18
Nodes (11): unicode-segmenter, dependencies, unicode-segmenter@0.17.3, exports, name, private, scripts, build (+3 more)

### Community 77 - "0000 M3 Core"
Cohesion: 0.22
Nodes (6): "auth_allowed_subjects", "command_receipts", "game_saves", game_saves_owner_updated_idx, "profiles", game_save_parts

### Community 78 - "Kbo Sangmu"
Cohesion: 0.28
Nodes (8): fnv(), KBO_SANGMU_CLUB_CAP, KBO_SANGMU_FIELD_POSITIONS, KBO_SANGMU_MIN_ROLES, pick(), SangmuApplicant, SangmuSelection, selectSangmuCohort()

### Community 79 - "Relationship History"
Cohesion: 0.42
Nodes (8): careerRelationDetailView(), careerRelationshipListView(), findPlayer(), playerView(), RelationHistoryWorld, STAGES, validateRelation(), relationDetailView()

### Community 80 - "Engine Package"
Cohesion: 0.22
Nodes (8): compilerOptions, declaration, lib, outDir, rootDir, types, extends, include

### Community 81 - "Db Package"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, rootDir, types, extends, include

### Community 82 - "Pro Trait Summary"
Cohesion: 0.43
Nodes (7): validateCareerTraitLedger(), acknowledgeProTraitSummary(), HIDDEN, isUs(), ProCareer, sourceReceipts(), unreadProTraitSummary()

### Community 83 - "Rules Package"
Cohesion: 0.29
Nodes (6): compilerOptions, declaration, outDir, rootDir, extends, include

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Which parts of career progression depend on `canonicalJson()` for stable state and record comparisons?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Should `Kbo Career Version` be split into smaller, more focused modules?**
  _Cohesion score 0.05992593423858153 - nodes in this community are weakly interconnected._
- **Why does `createWorldEvent()` connect `Events` to `Kbo Career Version`, `Fixtures`, `Kbo Draft`, `High School Career`, `Us Career Entry`, `Records`, `Career Agent`, `National Progress`, `Fixtures`, `Us Preseason`, `Kbo Progress`, `College Cup`, `Kbo Windows`, `Us Career Entry`, `Us Return Retry`, `Season Goals`, `Career Achievements`, `Kbo Us Activation Tests`, `Pro Career Advice`, `College Year`, `Career Us`, `Us Amateur Return Career`, `Career Preparation`, `College National`, `Kbo National`, `High School Game`, `Kbo Career Fa`, `Us National`, `Us Relations`, `Career Pro Retry`, `Kbo Posting`, `Us Amateur Return Career`, `Career Alias`, `Repertoire Events`, `Us Windows`, `Pro Career Results`, `Pro Trait Notices`, `Pitcher Rival`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `Fixtures` be split into smaller, more focused modules?**
  _Cohesion score 0.07320894459478706 - nodes in this community are weakly interconnected._
- **Why does `abilityKeys()` connect `Player` to `Fixtures`, `Kbo Draft`, `High School Career`, `Us Career Entry`, `Records`, `National Progress`, `Fixtures`, `College Cup`, `Kbo Windows`, `Kbo Club Command`, `Pro Career Advice`, `Kbo Free Agents`, `College Year`, `Us Amateur Return`, `College National`, `Kbo Club Import`, `Us Direct`, `Game`, `Kbo National`, `Repertoire`, `Index`, `National Progress Tests`, `Us National`, `Lineup`, `Traits Tests`, `Kbo World`, `Stats`, `High School World`, `Relationships`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `Player` be split into smaller, more focused modules?**
  _Cohesion score 0.07189324437030858 - nodes in this community are weakly interconnected._
- **Should `Kbo Draft` be split into smaller, more focused modules?**
  _Cohesion score 0.07061266874350987 - nodes in this community are weakly interconnected._
## Scope and extraction checks

Git-tracked code under `packages/`, including the two SQL migrations. Graph paths are relative to `packages/`. Application code, design documents, and local profiling files are outside this graph. Structural extraction used no model tokens.

The parser found no symbols in 37 scanned files, including configuration and some test entry points.

Raw extraction reported 3 dangling edges and 7 self-loops. The undirected graph can combine 1,312 edges that share endpoints. Use the source when import or call-site multiplicity matters.
