Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$approvedDirectory = Join-Path $projectRoot 'art\approved'
New-Item -ItemType Directory -Force -Path $approvedDirectory | Out-Null

$assets = @(
  @{ Id = 'character.blue.rifle.idle'; File = 'character_blue_rifle_idle_v01.png'; Width = 384; Height = 384; Padding = 48 },
  @{ Id = 'environment.wall.straight'; File = 'environment_wall_straight_v01.png'; Width = 512; Height = 256; Padding = 32 },
  @{ Id = 'prop.crate.standard'; File = 'prop_crate_standard_v01.png'; Width = 256; Height = 256; Padding = 24 },
  @{ Id = 'pickup.medkit.idle'; File = 'pickup_medkit_idle_v01.png'; Width = 256; Height = 256; Padding = 32 }
)

function Get-AlphaBounds([System.Drawing.Bitmap] $Image) {
  $left = $Image.Width; $top = $Image.Height; $right = -1; $bottom = -1
  for ($y = 0; $y -lt $Image.Height; $y += 1) {
    for ($x = 0; $x -lt $Image.Width; $x += 1) {
      if ($Image.GetPixel($x, $y).A -eq 0) { continue }
      $left = [Math]::Min($left, $x); $top = [Math]::Min($top, $y)
      $right = [Math]::Max($right, $x); $bottom = [Math]::Max($bottom, $y)
    }
  }
  if ($right -lt $left -or $bottom -lt $top) { throw 'Source image contains no visible pixels.' }
  if ($left -eq 0 -or $top -eq 0 -or $right -eq ($Image.Width - 1) -or $bottom -eq ($Image.Height - 1)) {
    Write-Warning 'Source touches an edge; normalization will add the required runtime alpha margin.'
  }
  return [System.Drawing.Rectangle]::FromLTRB($left, $top, $right + 1, $bottom + 1)
}

$metadata = @()
foreach ($asset in $assets) {
  $sourcePath = Join-Path $projectRoot (Join-Path 'art\source' $asset.File)
  $targetPath = Join-Path $approvedDirectory $asset.File
  $source = [System.Drawing.Bitmap]::new($sourcePath)
  try {
    $bounds = Get-AlphaBounds $source
    $availableWidth = $asset.Width - 2 * $asset.Padding
    $availableHeight = $asset.Height - 2 * $asset.Padding
    $scale = [Math]::Min($availableWidth / $bounds.Width, $availableHeight / $bounds.Height)
    $drawWidth = [Math]::Max(1, [int][Math]::Round($bounds.Width * $scale))
    $drawHeight = [Math]::Max(1, [int][Math]::Round($bounds.Height * $scale))
    $destination = [System.Drawing.Rectangle]::new([int](($asset.Width - $drawWidth) / 2), [int](($asset.Height - $drawHeight) / 2), $drawWidth, $drawHeight)
    $output = [System.Drawing.Bitmap]::new($asset.Width, $asset.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($output)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.DrawImage($source, $destination, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $graphics.Dispose() }
      $output.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $output.Dispose() }
    $metadata += [ordered]@{ id = $asset.Id; source = "art/source/$($asset.File)"; approved = "art/approved/$($asset.File)"; canvas = @($asset.Width, $asset.Height); alphaBounds = @($bounds.X, $bounds.Y, $bounds.Width, $bounds.Height); padding = $asset.Padding }
    Write-Output "Normalized $($asset.Id) -> $targetPath"
  } finally { $source.Dispose() }
}

$metadata | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 (Join-Path $approvedDirectory 'b0-normalization.json')
