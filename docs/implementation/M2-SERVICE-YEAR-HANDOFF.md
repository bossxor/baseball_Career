# 실제 복무 연도별 검사 인계

Codex에서 1년차를 완료한 뒤 Claude Code에서 2년차를 실행할 수 있다. 같은 PC에서는 같은 체크아웃을 읽기 전용으로 사용해 검사만 실행하면 소스 manifest를 유지할 수 있다. 소스 수정과 Git 작업은 담당 브랜치에서 한다.

## 현재 위치

- 체크아웃은 `C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-m2`다.
- 공용 접두는 `%TEMP%/playball-native-service-20261119-staged/prefix`다.
- Node는 `v24.19.0`이며 소스 SHA는 `3c94729ded5ce982017f3f81f8d04b0ba296074c7f08cd12a1187b26f05e2ab8`다.
- 이전 1년차 118일·2,400스텝을 검증해 옮겼다. `stage-transition.json`은 원래 소스·파일 해시와 엔진·룰·빌드가 같음을 기록한다.
- 1년차 완료 캐시는 `prefix.service.json.year1`이다. 아직 1년차 완주를 통과로 판정하지 않았다.

## Codex의 1년차 명령

위 체크아웃에서 PowerShell로 실행한다. 진행 중인 실행과 중복 실행하지 않는다.

```powershell
$env:PLAYBALL_NATIVE_RETURN_PREFIX = Join-Path $env:TEMP 'playball-native-service-20261119-staged/prefix'
$env:PLAYBALL_NATIVE_SERVICE_YEAR = '1'
node --max-old-space-size=8192 --import tsx --test --test-name-pattern='native service year one completes separately' packages/engine/test/us-amateur-return-career.test.ts
```

1년차 정산과 미국 조기 복귀 거부를 확인하고 종료한다. 완료 캐시를 보관하므로 2년차에서 1년차를 반복하지 않는다.

## Claude Code의 2년차 명령

Codex의 1년차 종료 코드 0과 완료 캐시가 확인된 뒤 위와 같은 체크아웃에서 실행한다. Git 브랜치를 전환하거나 파일을 수정하지 않는다.

```powershell
$env:PLAYBALL_NATIVE_RETURN_PREFIX = Join-Path $env:TEMP 'playball-native-service-20261119-staged/prefix'
$env:PLAYBALL_NATIVE_SERVICE_YEAR = '2'
node --max-old-space-size=8192 --import tsx --test --test-name-pattern='re-signs after two native service years' packages/engine/test/us-amateur-return-career.test.ts
```

2년차는 1년차 완료 캐시가 없으면 시작을 거부한다. 복무 완료·재계약·프리시즌·일정을 확인한다. 각각의 프로세스는 같은 접두에 동시에 쓰지 않도록 잠금을 사용한다.

다른 체크아웃이나 PC에서는 캐시와 전환 근거를 함께 옮기고, Node·엔진·룰·테스트 파일·빌드의 manifest가 모두 일치해야 한다. 소스가 바뀌어 검사에서 거부되면 소스 해시를 임의 수정하지 않는다.
