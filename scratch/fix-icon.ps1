Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\saehk\Documents\Lumen Creativo Dev\TecnoSmart VZL\tecnosmart-app\public\isotipo-rojo.png"
$destPath = "c:\Users\saehk\Documents\Lumen Creativo Dev\TecnoSmart VZL\tecnosmart-app\public\apple-touch-icon.png"
$destPathMaskable = "c:\Users\saehk\Documents\Lumen Creativo Dev\TecnoSmart VZL\tecnosmart-app\public\icon-maskable-512.png"

$srcImage = [System.Drawing.Image]::FromFile($srcPath)

# Get src image dimensions to maintain aspect ratio
$srcRatio = $srcImage.Width / $srcImage.Height

$targetSize = 512
$padding = 90
$maxDrawSize = $targetSize - ($padding * 2)

if ($srcRatio -gt 1) {
    $drawWidth = $maxDrawSize
    $drawHeight = [int]($maxDrawSize / $srcRatio)
} else {
    $drawHeight = $maxDrawSize
    $drawWidth = [int]($maxDrawSize * $srcRatio)
}

$posX = [int](($targetSize - $drawWidth) / 2)
$posY = [int](($targetSize - $drawHeight) / 2)

$bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)

$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Background (white for Apple, and also useful for general maskable)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.FillRectangle($bgBrush, 0, 0, $targetSize, $targetSize)

$rect = New-Object System.Drawing.Rectangle($posX, $posY, $drawWidth, $drawHeight)
$graphics.DrawImage($srcImage, $rect)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($destPathMaskable, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bgBrush.Dispose()
$bmp.Dispose()
$srcImage.Dispose()

Write-Output "Image processed successfully!"
