param(
    [Parameter(Mandatory=$True,ValueFromPipeline=$True)]
    [System.IO.FileInfo[]] $InputObject,

    [Parameter(Mandatory=$False)]
    [String] $Prefix
)

process
{
    foreach ($file in $InputObject)
    {
        # Write-Host "Set up $Prefix$($file.BaseName)"
        Get-Content $file.FullName -Encoding UTF8 | ConvertFrom-Csv -Delimiter ','
    }
}
