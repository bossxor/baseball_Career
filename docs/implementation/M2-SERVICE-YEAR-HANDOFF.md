# 실제 복무 연도별 검사 인계

Codex에서 1년차를 완료한 뒤 Claude Code에서 2년차를 실행할 수 있다. 같은 PC에서는 같은 체크아웃을 읽기 전용으로 사용해 검사만 실행하면 소스 manifest를 유지할 수 있다. 소스 수정과 Git 작업은 담당 브랜치에서 한다.

## 현재 위치

- 체크아웃은 `C:/Users/N-052/.codex/visualizations/2026/10/16/01a142f8-66ea-7782-ba3e-b52df94ae1be/baseball-career-m2`다.
- 공용 접두는 `%TEMP%/playball-native-service-20261119-staged/prefix`다.
- Node는 `v24.19.0`이며 소스 SHA는 `3c94729ded5ce982017f3f81f8d04b0ba296074c7f08cd12a1187b26f05e2ab8`다.
- 이전 1년차 118일·2,400스텝을 검증해 옮겼다. `stage-transition.json`은 원래 소스·파일 해시와 엔진·룰·빌드가 같음을 기록한다.
- 1년차는 실제 8,790경기와 조기 복귀 거부를 검사해 1/1 통과했다. 완료 캐시는 `prefix.service.json.year1`이다.
- 2년차는 2026-11-19 17:43 KST에 게임 날짜 80·1,400스텝 저장 뒤 중단했다. 기록 리비전은 65,115다. 복무 완료·미국 재계약 검증은 재개 후 판정한다.

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

## 다른 PC에서 재개

- Git 브랜치는 `codex/tf-fast-season`이며 검사를 실행한 코드 기준은 `aff75db`다. Node `v24.19.0`에서 `npm ci`를 실행한다.
- 실행 PC에서 만든 `playball-m2-1400-transfer.tar.gz`를 별도로 복사한다. 캐시는 두 파일 합계 약 2.16GB이며 Git 커밋에는 들어 있지 않다.
- 새 체크아웃에서 아래처럼 캐시는 임시 폴더에, 빌드와 로컬 검사 도구는 체크아웃에 푼다. 현재 실행 소스 manifest에는 로컬 `_prof` 파일 네 개와 엔진·룰의 빌드가 포함된다.

```powershell
$archive = (Resolve-Path .\playball-m2-1400-transfer.tar.gz).Path
$stage = Join-Path $env:TEMP 'playball-native-service-20261119-staged'
New-Item -ItemType Directory -Path $stage -Force | Out-Null
tar -xf $archive -C $stage prefix.service.json.year1 prefix.service.json.checkpoint stage-transition.json source-manifest.json
tar -xf $archive packages/engine/dist packages/rules/dist packages/engine/test/_prof/eq.ts packages/engine/test/_prof/parts.ts packages/engine/test/_prof/run.ts packages/engine/test/_prof/us.ts
Get-FileHash (Join-Path $stage "prefix.service.json.year1"), (Join-Path $stage "prefix.service.json.checkpoint")
node --import tsx --input-type=module -e 'import {nativeReturnSource} from "./packages/engine/test/native-return-cache.ts"; console.log(nativeReturnSource().sha256);'
```

`Resolve-Path`는 복사한 묶음의 실제 경로를 사용한다. 파일 해시와 소스 SHA를 아래 값 및 위의 소스 SHA와 비교한다. 일치하면 위 2년차 명령을 실행해 1,401스텝부터 재개한다. 다른 실행의 잠금이나 종료 코드 파일은 묶음에 없다.

| 파일 | SHA-256 |
|---|---|
| `prefix.service.json.year1` | `f0865259190cc23edb059555e5078d1c1f4535049a31f22027e1b83fa71bd586` |
| `prefix.service.json.checkpoint` | `2191c61a9a5cb4e06ac3e2b8da462bb03dc614118f3a76fc59db66c0b69bc849` |

## 실행 증거

```text
{"nativeServiceYearComplete":1,"games":8790}
✔ native service year one completes separately and keeps return blocked (8547908.9555ms)
ℹ tests 1 · pass 1 · fail 0 · skipped 0
TEST_EXIT=0
{"nativeServiceProgress":true,"year":2,"step":1400,"day":80,"recordRevision":65115,"sourceSha256":"3c94729ded5ce982017f3f81f8d04b0ba296074c7f08cd12a1187b26f05e2ab8"}
```

2년차 프로세스 종료 코드는 사용자가 요청한 중단으로 1이다. 1,400스텝 기록은 체크포인트 교체 후 출력됐고, 종료 직후 파일이 그대로 보존됐음을 확인했다. 로컬 원본은 `evidence/M2-20261119-service-year1.local.log`, `evidence/M2-20261119-service-year2.local.log`다.
