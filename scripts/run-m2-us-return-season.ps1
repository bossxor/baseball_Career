param([Parameter(Mandatory=$true)][string]$ServiceEvidenceBase,[Parameter(Mandatory=$true)][string]$EvidenceBase,[int]$ServiceRunnerPid=0)
$ErrorActionPreference='Stop'
$PSNativeCommandUseErrorActionPreference=$false
Set-Location -LiteralPath ([IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')))
if(Test-Path -LiteralPath ($EvidenceBase+'.run.json')){throw 'CONTINUATION_EVIDENCE_ALREADY_EXISTS'}
$report=[ordered]@{schemaVersion=1;status='WAITING_FOR_SERVICE';pid=$PID;startedAt=[DateTime]::UtcNow.ToString('o');endedAt=$null;sourceCommit=(& git rev-parse HEAD);sourceSha256=$null;serviceEvidenceBase=$ServiceEvidenceBase;runnerSha256=(Get-FileHash -LiteralPath $PSCommandPath).Hash;nodeRunnerSha256=(Get-FileHash -LiteralPath 'scripts/verify-us-return-season.mjs').Hash;nodeExitCode=$null;exitCode=$null;error=$null}
$report | ConvertTo-Json | Set-Content -LiteralPath ($EvidenceBase+'.run.json') -Encoding utf8
$code=1
try {
 # Wait for the owning process to finish; no log polling and no duplicate generator.
 if($ServiceRunnerPid -gt 0){$owner=Get-Process -Id $ServiceRunnerPid -ErrorAction SilentlyContinue;if($owner){Wait-Process -InputObject $owner}}
 $service=Get-Content -LiteralPath ($ServiceEvidenceBase+'.run.json') -Raw | ConvertFrom-Json
 if($service.status -ne 'PASS' -or $service.exitCode -ne 0 -or $service.sourceUnchanged -ne $true -or $service.tests -ne 1 -or $service.pass -ne 1 -or $service.fail -ne 0 -or $service.skip -ne 0){throw 'NATIVE_SERVICE_PASS_REQUIRED'}
 if((Get-FileHash -LiteralPath 'scripts/verify-us-return-season.mjs').Hash -ne $report.nodeRunnerSha256){throw 'CONTINUATION_RUNNER_CHANGED_WHILE_WAITING'}
 $manifestCode="import {nativeReturnSource} from './packages/engine/test/native-return-cache.ts'; process.stdout.write(JSON.stringify(nativeReturnSource()));"
 $manifestJson=& node --import tsx --input-type=module -e $manifestCode
 if($LASTEXITCODE -ne 0){throw 'CONTINUATION_MANIFEST_FAILED'}
 $manifest=$manifestJson | ConvertFrom-Json
 if($manifest.sha256 -ne $service.sourceSha256){throw 'CONTINUATION_SOURCE_CHANGED'}
 $manifestJson | Set-Content -LiteralPath ($EvidenceBase+'.source.json') -Encoding utf8
 $report.status='RUNNING';$report.sourceSha256=$manifest.sha256
 $report | ConvertTo-Json | Set-Content -LiteralPath ($EvidenceBase+'.run.json') -Encoding utf8
 $env:PLAYBALL_NATIVE_RETURN_PREFIX=$service.cacheBase
 & node --max-old-space-size=4096 --import tsx scripts/verify-us-return-season.mjs ($EvidenceBase+'.proof.json') > ($EvidenceBase+'.log') 2>&1
 $report.nodeExitCode=$LASTEXITCODE
 if($report.nodeExitCode -ne 0){throw 'NATIVE_US_RETURN_SEASON_FAILED'}
 $proof=Get-Content -LiteralPath ($EvidenceBase+'.proof.json') -Raw | ConvertFrom-Json
 if($proof.runnerSha256 -ne $report.nodeRunnerSha256 -or (Get-FileHash -LiteralPath 'scripts/verify-us-return-season.mjs').Hash -ne $report.nodeRunnerSha256 -or (Get-FileHash -LiteralPath $PSCommandPath).Hash -ne $report.runnerSha256){throw 'CONTINUATION_RUNNER_CHANGED'}
 if($proof.status -ne 'PASS' -or $proof.source.sha256 -ne $service.sourceSha256 -or $proof.regularGames -lt 1 -or $proof.closedDays -lt 1 -or -not $proof.growthReceipt){throw 'NATIVE_US_RETURN_SEASON_PROOF_REQUIRED'}
 $code=0;$report.status='PASS'
}catch{$report.status='FAILED';$report.error=$_.Exception.Message}
finally{$report.exitCode=$code;$report.endedAt=[DateTime]::UtcNow.ToString('o');$report | ConvertTo-Json | Set-Content -LiteralPath ($EvidenceBase+'.run.json') -Encoding utf8;Set-Content -LiteralPath ($EvidenceBase+'.exitcode.txt') -Value $code -Encoding utf8}
exit $code
