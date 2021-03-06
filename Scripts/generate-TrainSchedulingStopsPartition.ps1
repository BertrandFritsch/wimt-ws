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

$stations = Get-Content $RootDir\Assets\sncf-gares-et-arrets-transilien-ile-de-france.csv -Encoding UTF8 | ConvertFrom-Csv -Delimiter ';'
$stationsColl = @{}
$stations | %{ $stationsColl[$_.'Code UIC' -replace '.$'] = $_ }

$servicesColl = Create-IndexedCollectoin (gi $RootDir\Assets\gtfs-lines-last\calendar.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.end_date }) service_id
$calendarDatesColl = Create-IndexedCollectoin (gi $RootDir\Assets\gtfs-lines-last\calendar_dates.txt | & $RootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.date }) service_id

$tripIdGenerator = -1
$trips = gi $RootDir\Assets\gtfs-lines-last\trips.txt | &"$RootDir\Scripts\load-GTFS2.ps1" | %{ ++$tripIdGenerator; $_ } |
    ? { $servicesColl[$_.service_id] -or $calendarDatesColl[$_.service_id] } |
    % { $_ | Add-Member -NotePropertyName idSeq -NotePropertyValue $tripIdGenerator -PassThru }

$tripsColl = Create-IndexedCollectoin $trips trip_id

$stops = gi $RootDir\Assets\gtfs-lines-last\stops.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |? stop_id -Match '^StopPoint:DUA(\d{7})$' | Select-Object -Index @(($Partition.startIndex)..($Partition.endIndex))
$stopsColl = Create-IndexedCollectoin $stops stop_id

$sortedStopTimes = gi $RootDir\Assets\gtfs-lines-last\stop_times.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |
  ? { $stopsColl[$_.stop_id] } |
    ? { $tripsColl[$_.trip_id] } |
      ? departure_time -NE '' |
        ? stop_id -Match '^StopPoint:DUA(\d{7})$' |
          %{ 
            [PSCustomObject] @{ 
              time=(parse-Hours $_.departure_time $true)
              stop_id=$_.stop_id -replace '^StopPoint:DUA(\d{7})$','$1'
              trip_id=$tripsColl[$_.trip_id].idSeq
              stop_time=$_ 
            } 
          } | Sort-Object time


$sortedStopColl = @{}
$sortedStopTimes |% {
    if (-not $sortedStopColl[$_.stop_id]) {
        $sortedStopColl[$_.stop_id] = @()
    }

    $sortedStopColl[$_.stop_id] += $_
}

function generate-stops() {
  $isFirstStop = $true
  $stops |% {
    $stop_id = $_.stop_id -replace '^StopPoint:DUA(\d{7})$','$1'
    if ($stationsColl[$stop_id]) {
        $stop_UIC = $stationsColl[$stop_id].'Code UIC'
        $stop_name = $stationsColl[$stop_id]."Nom Gare"
    }
    else {
        $parent_station = $stopsColl["StopPoint:DUA$stop_id"].parent_station -replace '^StopArea:DUA(\d{7})$','$1'
        if ($stationsColl[$parent_station]) {
            $stop_UIC = $stationsColl[$parent_station].'Code UIC'
            $stop_name = $stationsColl[$parent_station]."Nom Gare"
        }
        else {
            $stop_UIC = $null
            $stop_name = $stopsColl["StopPoint:DUA$stop_id"].stop_name
        }
    }
#    if ($stop_UIC) {
"   
  $(if (-not ($isFirstStop)) {","})[ 
     $(if ($stop_UIC) { $stop_UIC } else { 'null' }),
     `"$stop_name`",
"
     if ($sortedStopColl[$stop_id]) {
"
     [ 
"
       $isFirst = $true
         $sortedStopColl[$stop_id] | %{ 
"         $(if (-not ($isFirst)) {","})[ $((parse-Hours $_.stop_time.departure_time $false).TotalMinutes), $($_.stop_time.stop_sequence), $($_.trip_id) ]"
          $isFirst = $false
         }
"
     ]
"
     }
     else {
"     null"
     }
"
  ]
"
      $isFirstStop = $false
#    }
  }
}

$tmpFile = [IO.Path]::GetTempFileName()
generate-stops | Out-File $tmpFile -Encoding utf8

$tmpFile
    