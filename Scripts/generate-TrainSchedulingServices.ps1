param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir
)

function Create-IndexedCollectoin($coll, $props) {
  $collIndexed = @{}
  $coll |% { 
    $e = $_
    $name = ($props |% { $e.$_ }) -join '_'
   
    # assume if the same element is there twice, just overwrite it
    $collIndexed.$name = $_;
  }
  return $collIndexed
}

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

$TrueOrFalse = @{ '0' = 0; '1' = 1; '2' = 0 }
$calendarDatesColl = Create-IndexedCollectoin (gi $RootDir\Assets\export-TN-GTFS-LAST\calendar_dates.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.date }) service_id
$calendar = gi $RootDir\Assets\export-TN-GTFS-LAST\calendar.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |
  ? { $Date -le $_.end_date -or $calendarDatesColl[$_.service_id] }

function generate-services() {
"
Services = {
"
$isFirst = $true
$calendar |% {
"  $(if (-not ($isFirst)) {","})$($_.service_id): [`"$($_.start_date -replace '(\d{4})(\d{2})(\d{2})','$1-$2-$3')`", `"$($_.end_date -replace '(\d{4})(\d{2})(\d{2})','$1-$2-$3')`", [ $($TrueOrFalse[$_.sunday]), $($TrueOrFalse[$_.monday]), $($TrueOrFalse[$_.tuesday]), $($TrueOrFalse[$_.wednesday]), $($TrueOrFalse[$_.thursday]), $($TrueOrFalse[$_.friday]), $($TrueOrFalse[$_.saturday]) ] ]"
   $isFirst = $false
}
"
}
"
}
$outputFilename = "$RootDir\Sources\src\SNCFData\services.js"
Write-Host "Generate $outputFilename"
generate-services | Out-File $outputFilename -Encoding utf8
