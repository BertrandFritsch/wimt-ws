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

function convert-dateToDays($date) {
  ((Get-Date ($date -replace '(\d{4})(\d{2})(\d{2})','$1-$2-$3')) - (Get-Date "1970-01-01")).Days
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

# be aware that services may exist without exceptions -- but also services may not exist but still have exceptions

$TrueOrFalse = @{ '0' = 0; '1' = 1; '2' = 0 }
$calendar_dates = gi $rootDir\Assets\gtfs-lines-last\calendar_dates.txt | & $rootDir\Scripts\load-GTFS2.ps1 |? { $Date -le $_.date }
$calendarDatesColl = @{}
$calendar_dates |% {
    if (-not $calendarDatesColl[$_.service_id]) {
        $calendarDatesColl[$_.service_id] = [PSCustomObject] @{ Service = $null; Exceptions = @{} }
    }

    $calendarDatesColl[$_.service_id].Exceptions[$_.date] = $_
}

gi $RootDir\Assets\gtfs-lines-last\calendar.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |? { $Date -le $_.end_date } |% {
    if (-not $calendarDatesColl[$_.service_id]) {
        $calendarDatesColl[$_.service_id] = [PSCustomObject] @{ Service = $null; Exceptions = $null }
    }

    $calendarDatesColl[$_.service_id].Service = $_
}


function generate-services() {
"
Services = {
"
$isFirst = $true
$calendarDatesColl |% { $_.GetEnumerator() } |% {
  $service_id = $_.Name
  $value = $_.Value
"  $(if (-not ($isFirst)) {","})$($service_id): [
"
     if ($value.Service) {
"      
     $(convert-dateToDays $value.Service.start_date), $(convert-dateToDays $value.Service.end_date), [ $($TrueOrFalse[$value.Service.sunday]), $($TrueOrFalse[$value.Service.monday]), $($TrueOrFalse[$value.Service.tuesday]), $($TrueOrFalse[$value.Service.wednesday]), $($TrueOrFalse[$value.Service.thursday]), $($TrueOrFalse[$value.Service.friday]), $($TrueOrFalse[$value.Service.saturday]) ],
"
     }
     else {
"      
     null, null, null,
"
     }
    $serviceExceptions = $value.Exceptions |? { $_ -ne $null }
    if ($serviceExceptions.Length -gt 0) {
"
     [
"  
     $isFirst = $true
     $serviceExceptions |% { $_.GetEnumerator() } |
       % { [PSCustomObject] @{ Day=(convert-dateToDays $_.Name); Run=($TrueOrFalse[$_.Value.exception_type])  } } | 
         Sort-Object Day |
           %{ 
"      $(if (-not ($isFirst)) {","})[$($_.Day), $($_.Run)]"
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
   $isFirst = $false
}
"
}
"
}
$outputFilename = "$RootDir\tmp\SNCFData\services.js"
Write-Host "Generate $outputFilename"
if (-not(Test-Path $outputFilename)) { New-Item -Force -Type File -Path $outputFilename | Out-Null }
generate-services | Out-File $outputFilename -Encoding utf8
