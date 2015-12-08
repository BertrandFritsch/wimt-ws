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

$routes = gi $RootDir\Assets\export-TN-GTFS-LAST\routes.txt | &"$RootDir\Scripts\load-GTFS2.ps1"

function generate-routes() {
"
Routes = {
"
  $isFirst = $true
  $routes |% {
"  $(if (-not ($isFirst)) {","})`"$($_.route_id)`": { n: `"$($_.route_long_name)`", s: `"$($_.route_short_name)`" }"
   $isFirst = $false
  }
"
}
"
}
$outputFilename = "$RootDir\tmp\SNCFData\routes.js"
Write-Host "Generate $outputFilename"
if (-not(Test-Path $outputFilename)) { New-Item -Force -Type File -Path $outputFilename | Out-Null }
generate-routes | Out-File $outputFilename -Encoding utf8
