
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

$outputDir = "$RootDir/Sources/src/assets"
$inputDir = "$RootDir/tmp/SNCFData"
if (-not(Test-Path $outputDir)) { New-Item -Force -Type Directory -Path $outputDir | Out-Null }
java -Xmx1024m -jar $RootDir/tools/closure-compiler.jar $inputDir/routes.js $inputDir/services.js $inputDir/trips.js $inputDir/stops.js --js_output_file $outputDir/SNCFData.min.js
