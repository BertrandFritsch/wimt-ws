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

# get filtered stops by valid trips
function getStopTimesColl() {

  $calendarDatesColl = Create-IndexedCollectoin (gi $RootDir\Assets\export-TN-GTFS-LAST\calendar_dates.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.date }) service_id
  $servicesColl = Create-IndexedCollectoin (gi $RootDir\Assets\export-TN-GTFS-LAST\calendar.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.end_date -or $calendarDatesColl[$_.service_id] }) service_id
  $tripsColl = Create-IndexedCollectoin (gi $RootDir\Assets\export-TN-GTFS-LAST\trips.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |? { $servicesColl[$_.service_id] -or $calendarDatesColl[$_.service_id] }) trip_id
  Create-IndexedCollectoin (gi $RootDir\Assets\export-TN-GTFS-LAST\stop_times.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $tripsColl[$_.trip_id] }) stop_id
}

$stops = gi $RootDir\Assets\export-TN-GTFS-LAST\stops.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |? stop_id -Match '^StopPoint:DUA(\d{7})$'
$stopTimesColl = getStopTimesColl

$partitionLen = 5
$partition = [Math]::Ceiling($stops.Length / $partitionLen)


$len = $stops.Length
$jobs = $(for ($i = 0; $i -lt $partitionLen; ++$i) {
    Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingStopsPartition.ps1 -ArgumentList $RootDir,@{ startIndex=$i * $partition + 1; endIndex = [Math]::Min(($i + 1) * $partition, $stops.Length) }
})
$paths = $jobs | Receive-Job -Wait

function generate-stops($paths) {
"
{
"
  $isFirstPath = $true
  $paths |% {
    $(if (-not ($isFirstPath)) {","}) 
    Get-Content $_
    $isFirstPath = $false 
  }
"
}
"
}

Write-Host "Generate $RootDir\Sources\src\SNCFData\stops.json"
generate-stops $paths | Out-File $RootDir\Sources\src\SNCFData\stops.json -Encoding utf8
$paths | Remove-Item
