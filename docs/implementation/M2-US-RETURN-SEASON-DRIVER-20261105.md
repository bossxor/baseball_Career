# 복무 후 미국 재계약 첫 정규시즌 검증 실행기 — 2026-11-05

## 범위
scripts/verify-us-return-season.mjs는 완료된 source-bound SERVICE_COMPLETE 캐시만 소비한다. 복무2년을 다시 생성하지 않는다. 기존 native 재계약→프리시즌→일정→정규경기 worker→일마감/급여 감사→연간 성장 정산을 수행한다. 테스트 선택은 승격 유예·콜업/강등 수락·특별강화 포기·유형 유지·특성 보기로 명시했다. 알 수 없는 사건/phase·인원 부족·엔진 한도에서는 멈춘다. 새 게임 규칙은 없다.

100명령마다 canonical SHA256과 source/runtime manifest·실행기 해시를 포함한 체크포인트를 저장한다. 재개할 때 완료 서비스 owner와 embedded history hash·선수 신원·다음 시즌·CANCELLED_US를 검증한다. 체크포인트는 임시 폴더에 남기며 저장소에 큰 캐시를 넣지 않는다. 기존 불변 기록 공유 함수를 재사용한다.

scripts/run-m2-us-return-season.ps1은 원래 복무 검사의 process 종료를 Wait-Process로 기다린 뒤 선택 테스트1/1·fail0·skip0·sourceUnchanged와 종료0을 요구한다. 폴링/중복 생성 없음. 이후 동일 source와 실행기 해시로 첫 정규시즌을 검증한다. 완료 proof와 실제 실행기 해시도 대조한다.

## 현재 증거
- 실행기 단위1/1·린트0, 잘못된 CLI 경로 종료1, PowerShell parse0.
- 독립 리뷰의 체크포인트 원본 hash 검증 및 실행기 최종 해시 대조를 보완했다.
- 전체 정규시즌 native 통과는 아직 없다. proof.json이 실제 PASS로 생성되기 전 완료로 세지 않는다.
- 실행 metadata: evidence/M2-20261105-us-return-season-launch.json, -run.run.json/.log/.exitcode.txt. WAITING_FOR_SERVICE는 검사 성공이 아니다.
- Windows PowerShell 백그라운드 두 차례는 Get-FileHash 미인식으로 시작 metadata 전 실패했다. launch-failed/failed2 및 stderr를 보존하고 pwsh로 다시 실행했다. 앞선 두 PID는 검사 실행 중으로 세지 않는다.

## 한계
원래 미국6시즌 계약 만료 출발점은 기존 controlled 접두다. 복무2년은 별도 실제 native 검사의 source-bound 결과이고 이 실행기는 그 뒤 첫 미국 정규시즌/급여/성장을 검증한다. 포스트시즌·잔여 사건 전체·전체24설계 경로 완료 증거가 아니며 fullDesignPathProven/postseasonProven은 false다. 일반 웹 연결과 전체 npm run check는 아직 실행하지 않았다.
