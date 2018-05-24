
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

$outputFile = "$rootDir/Assets/sncf-gares-et-arrets-transilien-ile-de-france.csv"

Invoke-RestMethod 'https://data.sncf.com/explore/dataset/sncf-gares-et-arrets-transilien-ile-de-france/download/?format=csv&timezone=Europe/Paris' -OutFile $outputFile
