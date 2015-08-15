param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir,

  [Parameter(Mandatory=$false)]
    [HashTable] $Partition = @{ startIndex = 120; endIndex=121 }
)

# filter no longer running trips
$Date = "{0:yyyyMMdd}" -f (Get-Date)

Write-Host "Stops partition: $($Partition.startIndex) -  $($Partition.endIndex)"

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

$stations = Get-Content $RootDir\Assets\sncf-gares-et-arrets-transilien-ile-de-france.csv | ConvertFrom-Csv -Delimiter ';'
$stationsColl = @{}
$stations | %{ $stationsColl[$_.'Code UIC' -replace '.$'] = $_ }

$servicesColl = Create-IndexedCollectoin (gi $RootDir\Assets\export-TN-GTFS-LAST\calendar.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -lt $_.end_date }) service_id
$calendar_dates = gi $RootDir\Assets\export-TN-GTFS-LAST\calendar_dates.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -lt $_.date }
$calendarDatesColl = @{}
$calendar_dates |% {
    if (-not $calendarDatesColl[$_.service_id]) {
        $calendarDatesColl[$_.service_id] = @{}
    }

    $calendarDatesColl[$_.service_id][$_.date] = $_
}

$trips = gi $RootDir\Assets\export-TN-GTFS-LAST\trips.txt | &"$RootDir\Scripts\load-GTFS2.ps1"  |
    ? { $servicesColl[$_.service_id] -or $calendarDatesColl[$_.service_id] }
$tripsColl = Create-IndexedCollectoin $trips trip_id

$stops = gi $RootDir\Assets\export-TN-GTFS-LAST\stops.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |? stop_id -Match '^StopPoint:DUA(\d{7})$' | Select-Object -Index @(($Partition.startIndex - 1)..($Partition.endIndex - 1))
$stopsColl = Create-IndexedCollectoin $stops stop_id

$routes = gi $RootDir\Assets\export-TN-GTFS-LAST\routes.txt | &"$RootDir\Scripts\load-GTFS2.ps1"
$routesColl = Create-IndexedCollectoin $routes route_id

$sortedStopTimes = gi $RootDir\Assets\export-TN-GTFS-LAST\stop_times.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |
  ? { $stopsColl[$_.stop_id] } |
    ? { $tripsColl[$_.trip_id] } |
      ? departure_time -NE '' |
        ? stop_id -Match '^StopPoint:DUA(\d{7})$' |
          %{ 
            [PSCustomObject] @{ 
              time=(parse-Hours $_.departure_time $true)
              stop_id=$_.stop_id -replace '^StopPoint:DUA(\d{7})$','$1'
              trip_id=$_.trip_id.Replace('-', '_')
              agency_id=$routesColl[$tripsColl[$_.trip_id].route_id].agency_id
              stop_time=$_ 
            } 
          } | sort time


$sortedStopTimesColl = @{}
$sortedStopTimes |% {
    if (-not $sortedStopTimesColl[$_.stop_id]) {
        $sortedStopTimesColl[$_.stop_id] = @()
    }

    $sortedStopTimesColl[$_.stop_id] += $_
}
  
$TrueOrFalse = @{ '0' = 'false'; '1' = 'true'; '2' = 'false' }

function generate-stops() {
  $sortedStopTimesColl.GetEnumerator() |% {
    $stop_id = $_.Name
    if ($stationsColl[$stop_id]) {
        $stop_UIC = $stationsColl[$stop_id].'Code UIC'
        $stop_name = $stationsColl[$stop_id]."Libelle STIF (info voyageurs)"
    }
    else {
        $parent_station = $stopsColl["StopPoint:DUA$stop_id"].parent_station -replace '^StopArea:DUA(\d{7})$','$1'
        if ($stationsColl[$parent_station]) {
            $stop_UIC = $stationsColl[$parent_station].'Code UIC'
            $stop_name = $stationsColl[$parent_station]."Libelle STIF (info voyageurs)"
        }
        else {
            $stop_UIC = $null
            $stop_name = $stopsColl["StopPoint:DUA$stop_id"].stop_name
        }
    }
"   
    `"$($stop_id)`": { 
       id: `"$stop_id`",
       UICCode: `"$stop_UIC`",
       name: `"$stop_name`",
       getTrips: function() {
         if (me._trips_$($stop_id) === undefined) { 
           me._trips_$($stop_id) = [
"
             $_.Value | %{ 
"             $($_.agency_id)Trips[`"$($_.trip_id)`"], " 
             }
"
           ]
         }

         return me._trips_$($stop_id);
       },
       getStopTimes: function() {
         if (me._stopTimes_$($stop_id) === undefined) {
           me._stopTimes_$($stop_id) = [ 
"
             $_.Value | %{ 
"             { stop: this, time: $((parse-Hours $_.stop_time.departure_time $false).TotalMinutes), sequence: $($_.stop_time.stop_sequence), trip: $($_.agency_id)Trips[`"$($_.trip_id)`"] },"
             }
"
           ]
         }

         return me._stopTimes_$($stop_id);
       } 
    },
"
  }
}

$tmpFile = [IO.Path]::GetTempFileName()
generate-stops | Out-File $tmpFile -Encoding utf8

$tmpFile
    