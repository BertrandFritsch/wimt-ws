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

$trips = gi $RootDir\Assets\export-TN-GTFS-LAST\trips.txt | &"$RootDir\Scripts\load-GTFS2.ps1"

$partitionLen = 5
$partition = [Math]::Ceiling($trips.Length / $partitionLen)

$len = $trips.Length
$jobs = $(for ($i = 0; $i -lt $partitionLen; ++$i) {
    Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingTripsPartition.ps1 -ArgumentList $RootDir,@{ startIndex=$i * $partition; endIndex = [Math]::Min(($i + 1) * $partition - 1, $trips.Length - 1) }
})
# get the jobs result in the same order they have been created
$paths = $jobs | %{ Receive-Job -Id $_.Id -Wait }

function generate-trips($paths) {
"
Trips = [
"
  $isFirstPath = $true
  $paths |% {
    $(if (-not ($isFirstPath)) {","}) 
    Get-Content $_
    $isFirstPath = $false 
  }
"
]
"
}
$outputFilename = "$RootDir\tmp\SNCFData\trips.js"
Write-Host "Generate $outputFilename"
if (-not(Test-Path $outputFilename)) { New-Item -Force -Type File -Path $outputFilename | Out-Null }
generate-trips $paths | Out-File $outputFilename -Encoding utf8
$paths | Remove-Item
