param([string]$CacheBase = '', [string]$EvidenceBase = '')
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $taskRoot
$node = (Get-Command node).Source
$manifestCode = "import {nativeReturnSource} from './packages/engine/test/native-return-cache.ts'; process.stdout.write(JSON.stringify(nativeReturnSource()));"
$manifestJson = & $node --import tsx --input-type=module -e $manifestCode
if($LASTEXITCODE -ne 0){throw 'NATIVE_SOURCE_MANIFEST_FAILED'}
$manifest = $manifestJson | ConvertFrom-Json
if(-not $CacheBase){$CacheBase = Join-Path $env:TEMP ('playball-native-return-' + $manifest.sha256.Substring(0,16) + '.json')}
if(-not $EvidenceBase){$EvidenceBase = Join-Path $taskRoot ('docs/implementation/evidence/M2-' + (Get-Date -Format yyyyMMdd-HHmmss) + '-native-service')}
if(Test-Path -LiteralPath ($EvidenceBase + '.run.json')){throw 'NATIVE_RUN_EVIDENCE_ALREADY_EXISTS'}
New-Item -ItemType Directory -Force -Path (Split-Path $EvidenceBase) | Out-Null
$testSource = Get-Content -LiteralPath 'packages/engine/test/us-amateur-return-career.test.ts' -Raw
if($testSource -notmatch 'two native service years' -or $testSource -notmatch 'nativeServiceUsReturn'){throw 'NATIVE_SERVICE_CACHE_TEST_WIP_MISSING'}
$env:PLAYBALL_NATIVE_RETURN_PREFIX = $CacheBase
$report = [ordered]@{schemaVersion=1;runnerSha256=(Get-FileHash -LiteralPath $PSCommandPath).Hash;status='RUNNING';pid=$PID;startedAt=[DateTime]::UtcNow.ToString('o');endedAt=$null;sourceCommit=(& git rev-parse HEAD);sourceDirtyPaths=@(& git status --short -- packages/engine packages/rules package.json package-lock.json);sourceSha256=$manifest.sha256;cacheBase=$CacheBase;serviceArtifact=($CacheBase+'.service.json');nodeCommand='node --max-old-space-size=4096 --import tsx --test --test-concurrency=1 --test-name-pattern=two native service years packages/engine/test/us-amateur-return-career.test.ts';nodeExitCode=$null;exitCode=$null;sourceUnchanged=$null;prefixInitiallyPresent=(Test-Path -LiteralPath ($CacheBase+'.service.json'));checkpointInitiallyPresent=(Test-Path -LiteralPath ($CacheBase+'.service.json.checkpoint'));tests=$null;pass=$null;fail=$null;skip=$null;error=$null}
$manifestJson | Set-Content -LiteralPath ($EvidenceBase + '.source.json') -Encoding utf8
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath ($EvidenceBase + '.run.json') -Encoding utf8
$code = 1
try {
 & $node --max-old-space-size=4096 --import tsx --test --test-concurrency=1 '--test-name-pattern=two native service years' packages/engine/test/us-amateur-return-career.test.ts > ($EvidenceBase + '.log') 2>&1
 $report.nodeExitCode = $LASTEXITCODE
 $finalJson = & $node --import tsx --input-type=module -e $manifestCode
 if($LASTEXITCODE -ne 0){throw 'NATIVE_FINAL_MANIFEST_FAILED'}
 $finalJson | Set-Content -LiteralPath ($EvidenceBase + '.final-source.json') -Encoding utf8
 $report.sourceUnchanged = (($finalJson | ConvertFrom-Json).sha256 -eq $manifest.sha256)
 $logText = Get-Content -LiteralPath ($EvidenceBase+'.log') -Raw
 foreach($field in @('tests','pass','fail','skipped')){if($logText -match ('(?m)^[^a-zA-Z0-9]*' + $field + ' ([0-9]+)')){$key=if($field -eq 'skipped'){'skip'}else{$field};$report[$key]=[int]$Matches[1]}}
 if($report.tests -ne 1 -or $report.pass -ne 1 -or $report.fail -ne 0 -or $report.skip -ne 0){$report.error='SELECTED_NATIVE_SERVICE_TEST_NOT_PASSED'}
 $code = if($report.sourceUnchanged -and -not $report.error){$report.nodeExitCode}else{1}
 $report.status = if($code -eq 0){'PASS'}else{'FAILED'}
} catch {$report.status='FAILED';$report.error=$_.Exception.Message; $code=1}
finally {$report.endedAt=[DateTime]::UtcNow.ToString('o');$report.exitCode=$code;$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath ($EvidenceBase+'.run.json') -Encoding utf8;Set-Content -LiteralPath ($EvidenceBase+'.exitcode.txt') -Value $code -Encoding utf8}
exit $code
