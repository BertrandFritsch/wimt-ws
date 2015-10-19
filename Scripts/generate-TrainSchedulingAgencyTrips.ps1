param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir,

  [Parameter(Mandatory=$true)]
    [string] $AgencyId='DUA852'
)

# filter no longer running trips
$Date = "{0:yyyyMMdd}" -f (Get-Date)

Write-Host "$AgencyId Trips"

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

$trips = gi $rootDir\Assets\export-TN-GTFS-LAST\trips.txt | & $rootDir\Scripts\load-GTFS2.ps1
$stop_times = gi $rootDir\Assets\export-TN-GTFS-LAST\stop_times.txt | & $rootDir\Scripts\load-GTFS2.ps1
$agencyColl = Create-IndexedCollectoin (gi $rootDir\Assets\export-TN-GTFS-LAST\agency.txt | & $rootDir\Scripts\load-GTFS2.ps1) agency_id
$calendar_dates = gi $rootDir\Assets\export-TN-GTFS-LAST\calendar_dates.txt | & $rootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.date }
$calendarDatesColl = @{}
$calendar_dates |% {
    if (-not $calendarDatesColl[$_.service_id]) {
        $calendarDatesColl[$_.service_id] = @{}
    }

    $calendarDatesColl[$_.service_id][$_.date] = $_
}
$servicesColl = Create-IndexedCollectoin (gi $rootDir\Assets\export-TN-GTFS-LAST\calendar.txt | & $rootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.end_date -or $calendarDatesColl[$_.service_id] }) service_id
$routesColl = Create-IndexedCollectoin (gi $rootDir\Assets\export-TN-GTFS-LAST\routes.txt | & $rootDir\Scripts\load-GTFS2.ps1) route_id
$tripIdGenerator = 0
$agencyTrips = $trips | %{ ++$tripIdGenerator; $_ } |
  ? { $routesColl[$_.route_id].agency_id -eq $AgencyId } |
    ? { $servicesColl[$_.service_id] -or $calendarDatesColl[$_.service_id] } |
    % { $_ | Add-Member -NotePropertyName idSeq -NotePropertyValue $tripIdGenerator -PassThru }
$agencyTripsColl = Create-IndexedCollectoin $agencyTrips trip_id
$agencyTripsStopTimes = $stop_times |
    ? { $agencyTripsColl[$_.trip_id] } |
      ? departure_time -NE '' |
        ? stop_id -Match '^StopPoint:DUA(\d{7})$' |
          %{ 
            [PSCustomObject] @{ 
              time=(parse-Hours $_.departure_time $true)
              stop_id=$_.stop_id -replace '^StopPoint:DUA(\d{7})$','$1'
              trip_id=$_.trip_id.Replace('-', '_')
              stop_time=$_ 
            } 
  }
$agencyTripsStopTimesColl = @{}
$agencyTripsStopTimes |% {
    if (-not $agencyTripsStopTimesColl[$_.trip_id]) {
        $agencyTripsStopTimesColl[$_.trip_id] = @()
    }

    $agencyTripsStopTimesColl[$_.trip_id] += $_
}

$TrueOrFalse = @{ '0' = 0; '1' = 1; '2' = 0 }

function generate-trips() {
$isFirstTrip = $true
$agencyTrips |? {
  $trip_id = $_.trip_id.Replace('-', '_')
  $agencyTripsStopTimesColl[$trip_id]
  } |% {
"
  $(if (-not ($isFirstTrip)) {","})`"$($_.idSeq)`": {
    i: `"$trip_id`", n: `"$($trip_id -replace 'DUASN(\d+).+','$1')`", s: $($_.service_id), m: `"$($_.trip_headsign)`", f: $($TrueOrFalse[$_.direction_id]),
    e: {
"  
      $isFirst = $true
      $calendarDatesColl[$_.service_id] |? { $_ -ne $null } |% { $_.GetEnumerator() } |% {
"      $(if (-not ($isFirst)) {","})`"$($_.Name -replace '(\d{4})(\d{2})(\d{2})','$3/$2/$1')`": $($TrueOrFalse[$_.Value.exception_type])"
       $isFirst = $false
      }
"
    },
    t: [
"
      $isFirst = $true
      $agencyTripsStopTimesColl[$trip_id] |% { 
"      $(if (-not ($isFirst)) {","}){ s: $($_.stop_id), d: $((parse-Hours $_.stop_time.departure_time $false).TotalMinutes) }" 
       $isFirst = $false
      }
"
    ]
  }
"
  $isFirstTrip = $false
}
}

$tmpFile = [IO.Path]::GetTempFileName()
generate-trips | Out-File $tmpFile -Encoding utf8

$tmpFile
