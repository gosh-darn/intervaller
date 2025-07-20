# Convert all .wav files in the current directory to .opus format using ffmpeg
$bitrate = "128k"  # You can change this to another common value like 96k or 128k

Get-ChildItem -Filter *.wav | ForEach-Object {
    $input = $_.FullName
    $output = [System.IO.Path]::ChangeExtension($_.FullName, ".opus")

    Write-Host "Converting $input to $output..."
    ffmpeg -i "$input" -c:a libopus -b:a $bitrate "$output"
}
