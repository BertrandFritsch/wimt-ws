param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir
)

# filter no longer running trips
$Date = "{0:yyyyMMdd}" -f (Get-Date)

if (-not $RootDir) {
  $RootDir = $(
    $dir = Convert-Path .
    while (-not (Test-Path $dir\.git)) {
        $dir = Split-Path $dir -Parent
        if ($dir -eq '') {
          throw "The root of the disk has been reached without finding the root project directory.`nPlease go to a directory of the project"
        }
    }
    $dir
  )
}

$TrueOrFalse = @{ '0' = 'false'; '1' = 'true'; '2' = 'false' }

$calendar = gi $RootDir\Assets\export-TN-GTFS-LAST\calendar.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |
  ? { $Date -lt $_.end_date }

function generate-services() {
"
{
"
$isFirst = $true
$calendar |% {
"  $(if (-not ($isFirst)) {","})`"$($_.service_id)`": { `"id`": `"$($_.service_id)`", `"startDate`": `"$($_.start_date -replace '(\d{4})(\d{2})(\d{2})','$1-$2-$3')`", `"endDate`": `"$($_.end_date -replace '(\d{4})(\d{2})(\d{2})','$1-$2-$3')`", `"days`": [ $($TrueOrFalse[$_.sunday]), $($TrueOrFalse[$_.monday]), $($TrueOrFalse[$_.tuesday]), $($TrueOrFalse[$_.wednesday]), $($TrueOrFalse[$_.thursday]), $($TrueOrFalse[$_.friday]), $($TrueOrFalse[$_.saturday]) ] }"
   $isFirst = $false
}
"
}
"
}

Write-Host "Generate $RootDir\Sources\WIMT\SNCFData\services.json"
generate-services | Out-File $RootDir\Sources\WIMT\SNCFData\services.json -Encoding utf8
