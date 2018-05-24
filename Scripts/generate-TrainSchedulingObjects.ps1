param(
  [Parameter(Mandatory=$False)]
    [switch] $NoStops = $false,

  [Parameter(Mandatory=$False)]
    [switch] $NoRoutes = $false,

  [Parameter(Mandatory=$False)]
    [switch] $NoServices = $false,

  [Parameter(Mandatory=$False)]
    [switch] $NoTrips = $false
)

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

if (-not $NoStops) {
  Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingStops.ps1 -ArgumentList $RootDir | Receive-Job -Wait
}

if (-not $NoRoutes) {
   Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingRoutes.ps1 -ArgumentList $RootDir | Receive-Job -Wait
}

if (-not $NoServices) {
   Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingServices.ps1 -ArgumentList $RootDir | Receive-Job -Wait
}

if (-not $NoTrips) {
   Start-Job -FilePath $RootDir\Scripts\generate-TrainSchedulingTrips.ps1 -ArgumentList $RootDir | Receive-Job -Wait
}
