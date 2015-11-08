param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir,

  [Parameter(Mandatory=$false)]
    [HashTable] $Partition = @{ startIndex = 120; endIndex=121 }
)

# filter no longer running trips
$Date = "{0:yyyyMMdd}" -f (Get-Date)

Write-Host "Trips partition: $($Partition.startIndex) -  $($Partition.endIndex)"

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

function parse-Hours($stopTime, $base24) {
  # be aware of times after midnight
  $base = [int] '0'[0]
  $hours = ([int] $stopTime[0] - $base) * 10 + ([int] $stopTime[1] - $base)
  $minutes = ([int] $stopTime[3] - $base) * 10 + ([int] $stopTime[4] - $base)
  if ($base24 -and $hours -gt 23) {
    [TimeSpan]::FromHours($hours - 24) + [TimeSpan]::FromMinutes($minutes)
  }
  else {
    [TimeSpan]::FromHours($hours) + [TimeSpan]::FromMinutes($minutes)
  }
}

function convert-dateToDays($date) {
  ((Get-Date ($date -replace '(\d{4})(\d{2})(\d{2})','$1-$2-$3')) - (Get-Date "1970-01-01")).Days
}

if (-not $RootDir) {
    $rootDir = $(
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

$trips = gi $rootDir\Assets\export-TN-GTFS-LAST\trips.txt | & $rootDir\Scripts\load-GTFS2.ps1 | Select-Object -Index @(($Partition.startIndex)..($Partition.endIndex))

$stop_times = gi $rootDir\Assets\export-TN-GTFS-LAST\stop_times.txt | & $rootDir\Scripts\load-GTFS2.ps1
$calendar_dates = gi $rootDir\Assets\export-TN-GTFS-LAST\calendar_dates.txt | & $rootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.date }
$calendarDatesColl = @{}
$calendar_dates |% {
    if (-not $calendarDatesColl[$_.service_id]) {
        $calendarDatesColl[$_.service_id] = @{}
    }

    $calendarDatesColl[$_.service_id][$_.date] = $_
}
$servicesColl = Create-IndexedCollectoin (gi $rootDir\Assets\export-TN-GTFS-LAST\calendar.txt | & $rootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.end_date }) service_id
$routesColl = Create-IndexedCollectoin (gi $rootDir\Assets\export-TN-GTFS-LAST\routes.txt | & $rootDir\Scripts\load-GTFS2.ps1) route_id
$tripIdGenerator = 0
$tripsColl = Create-IndexedCollectoin ($trips |? { $servicesColl[$_.service_id] -or $calendarDatesColl[$_.service_id] }) trip_id
$tripsStopTimes = $stop_times |
    ? { $tripsColl[$_.trip_id] } |
      ? departure_time -NE '' |
        ? stop_id -Match '^StopPoint:DUA(\d{7})$' |
          %{ 
            [PSCustomObject] @{ 
              time=(parse-Hours $_.departure_time $true)
              stop_id=$_.stop_id -replace '^StopPoint:DUA(\d{7})$','$1'
              trip_id=$_.trip_id
              stop_time=$_ 
            } 
  }
$tripsStopTimesColl = @{}
$tripsStopTimes |% {
    if (-not $tripsStopTimesColl[$_.trip_id]) {
        $tripsStopTimesColl[$_.trip_id] = @()
    }

    $tripsStopTimesColl[$_.trip_id] += $_
}

$TrueOrFalse = @{ '0' = 0; '1' = 1; '2' = 0 }

function generate-trips() {
$isFirstTrip = $true
$trips |% {
  $trip_id = $_.trip_id
"
  $(if (-not ($isFirstTrip)) {","})$(if ($tripsStopTimesColl[$trip_id]) { "[ 
    '$trip_id', '$($trip_id -replace 'DUASN(\d+).+','$1')', $($_.service_id), '$($_.trip_headsign)', $($TrueOrFalse[$_.direction_id]),
"
    $serviceExceptions = $calendarDatesColl[$_.service_id] |? { $_ -ne $null }
    if ($serviceExceptions.Length -gt 0) {
"
    {
"  
      $isFirst = $true
      $serviceExceptions |% { $_.GetEnumerator() } | %{
"      $(if (-not ($isFirst)) {","})$(convert-dateToDays $_.Name): $($TrueOrFalse[$_.Value.exception_type])"
       $isFirst = $false
      }
"
    },
"
    }
    else {
"    null,"
    }
"
    [
"
      $isFirst = $true
      $tripsStopTimesColl[$trip_id] | %{ 
"      $(if (-not ($isFirst)) {","})[ $((parse-Hours $_.stop_time.departure_time $false).TotalMinutes), $($_.stop_id) ]" 
       $isFirst = $false
      }
"
    ]
  ]

"  
  } else { 'null' })
"
  $isFirstTrip = $false
}
}

$tmpFile = [IO.Path]::GetTempFileName()
generate-trips | Out-File $tmpFile -Encoding utf8

$tmpFile
