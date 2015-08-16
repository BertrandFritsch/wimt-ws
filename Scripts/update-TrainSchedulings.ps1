param(
    [Parameter(Mandatory=$False)]
    [switch] $Check = $false
)

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

$tmpFile = [IO.Path]::GetTempFileName()
$outputDir = $( if ($Check ) { "$tmpFile.dir" } else { "$rootDir\Assets\export-TN-GTFS-LAST" } )

Write-Host "Get the remote assets"
Invoke-RestMethod 'https://ressources.data.sncf.com/api/datasets/1.0/sncf-transilien-gtfs/attachments/export_tn_gtfs_last_zip/' -OutFile "$tmpFile.zip"

Remove-Item $tmpFile

if (-not $Check -and (Test-Path $outputDir))
{
    Write-Host "Remove previous asset files"
    Remove-Item $outputDir -Recurse
}

7z x "-o$outputDir" "$tmpFile.zip" | Out-Null

if ($Check)
{
    $outDatedFiles = Get-Item  $outputDir\* |? { -not(Test-Path "$rootDir\Assets\export-TN-GTFS-LAST\$($_.Name)") -or (Get-Item "$rootDir\Assets\export-TN-GTFS-LAST\$($_.Name)").LastWriteTime -lt $_.LastWriteTime }
    if ($outDatedFiles )
    {
        Write-Host "Some assets are not up to date:"
        $outDatedFiles |% { Write-Host "  - $($_.Name)" }
    }
    else
    {
        Write-Host "Assets are up to date!"
    }
}

Remove-Item "$tmpFile.zip"

if ($Check)
{
    Remove-Item $outputDir -Recurse
}
