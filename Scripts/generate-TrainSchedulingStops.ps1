param(
  [Parameter(Mandatory=$false)]
    [string] $RootDir
)

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

$stops = gi $RootDir\Assets\export-TN-GTFS-LAST\stops.txt | &"$RootDir\Scripts\load-GTFS2.ps1" |? stop_id -Match '^StopPoint:DUA(\d{7})$'

$partitionLen = 5
$partition = [Math]::Ceiling($stops.Length / $partitionLen)


$len = $stops.Length
$jobs = $(for ($i = 0; $i -lt $partitionLen; ++$i) {
    Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingStopsPartition.ps1 -ArgumentList $RootDir,@{ startIndex=$i * $partition; endIndex = [Math]::Min(($i + 1) * $partition - 1, $stops.Length - 1) }
})
# get the jobs result in the same order they have been created
$paths = $jobs | %{ Receive-Job -Id $_.Id -Wait }

function generate-stops($paths) {
"
Stops = [
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
$outputFilename = "$RootDir\tmp\SNCFData\stops.js"
Write-Host "Generate $outputFilename"
if (-not(Test-Path $outputFilename)) { New-Item -Force -Type File -Path $outputFilename | Out-Null }
generate-stops $paths | Out-File $outputFilename -Encoding utf8
$paths | Remove-Item
