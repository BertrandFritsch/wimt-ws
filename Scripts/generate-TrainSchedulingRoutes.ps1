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
  $routes |% {
"  `"$($_.route_id)`": { id: `"$($_.route_id)`", name: `"$($_.route_long_name)`", shortName: `"$($_.route_short_name)`" },"
  }
"
};
"
}

Write-Host "Generate $RootDir\Sources\WIMT\SNCFData\Routes.js"
generate-routes | Out-File $RootDir\Sources\WIMT\SNCFData\Routes.js -Encoding utf8
