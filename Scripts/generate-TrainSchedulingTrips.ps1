param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir
)

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

$agencies = gi $RootDir\Assets\export-TN-GTFS-LAST\agency.txt | & $RootDir\Scripts\load-GTFS2.ps1

$paths = $agencies | foreach -Begin { $i = 0 } -Process { ++$i; [PSCustomObject] @{ Index=$i; Item=$_} } | group { [Math]::Floor(($_.Index - 1) / 6) } |% {
  $jobs = $_.Group |% { Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingAgencyTrips.ps1 -ArgumentList $RootDir,$_.Item.agency_id }
  $jobs | Receive-Job -Wait
}

function generate-trips($paths) {
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

Write-Host "Generate $RootDir\Sources\WIMT\SNCFData\trips.json"
generate-trips $paths | Out-File $RootDir\Sources\WIMT\SNCFData\trips.json -Encoding utf8
$paths | Remove-Item
