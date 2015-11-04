
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

java -Xmx1024m -jar $RootDir\tools\closure-compiler.jar $RootDir\Sources\src\SNCFData\routes.js $RootDir\Sources\src\SNCFData\services.js $RootDir\Sources\src\SNCFData\trips.js $RootDir\Sources\src\SNCFData\stops.js --js_output_file $RootDir\Sources\dist\SNCFData.min.js
