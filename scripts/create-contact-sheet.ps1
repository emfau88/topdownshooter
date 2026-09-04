Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourceDirectory = Join-Path $projectRoot 'art\approved'
$reviewDirectory = Join-Path $projectRoot 'art\review'
New-Item -ItemType Directory -Force -Path $reviewDirectory | Out-Null

$assets = @(
  @{ Label = 'BLUE RIFLE SOLDIER'; File = 'character_blue_rifle_idle_v01.png' },
  @{ Label = 'STRAIGHT WALL'; File = 'environment_wall_straight_v01.png' },
  @{ Label = 'STANDARD CRATE'; File = 'prop_crate_standard_v01.png' },
  @{ Label = 'MEDKIT'; File = 'pickup_medkit_idle_v01.png' }
)
$canvas = [System.Drawing.Bitmap]::new(1280, 450, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
try {
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#151812'))
    $titleFont = [System.Drawing.Font]::new('Arial', 24, [System.Drawing.FontStyle]::Bold)
    $labelFont = [System.Drawing.Font]::new('Arial', 13, [System.Drawing.FontStyle]::Bold)
    try {
      $graphics.DrawString('B0 STYLE LOCK - APPROVED MASTER REVIEW', $titleFont, [System.Drawing.Brushes]::Khaki, 28, 24)
      for ($index = 0; $index -lt $assets.Count; $index += 1) {
        $asset = $assets[$index]
        $image = [System.Drawing.Bitmap]::new((Join-Path $sourceDirectory $asset.File))
        try {
          $slotX = 28 + $index * 310
          $slot = [System.Drawing.Rectangle]::new($slotX, 92, 280, 280)
          $scale = [Math]::Min($slot.Width / $image.Width, $slot.Height / $image.Height)
          $width = [int]($image.Width * $scale); $height = [int]($image.Height * $scale)
          $destination = [System.Drawing.Rectangle]::new($slot.X + [int](($slot.Width - $width) / 2), $slot.Y + [int](($slot.Height - $height) / 2), $width, $height)
          $graphics.DrawImage($image, $destination)
          $graphics.DrawString($asset.Label, $labelFont, [System.Drawing.Brushes]::Gainsboro, $slotX, 390)
        } finally { $image.Dispose() }
      }
    } finally { $titleFont.Dispose(); $labelFont.Dispose() }
  } finally { $graphics.Dispose() }
  $canvas.Save((Join-Path $reviewDirectory 'b0-contact-sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $canvas.Dispose() }

Write-Output "Created art/review/b0-contact-sheet.png"
