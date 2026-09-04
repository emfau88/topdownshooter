Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$approved = Join-Path $projectRoot 'art\approved'
$atlasDirectory = Join-Path $projectRoot 'public\assets\atlases'
New-Item -ItemType Directory -Force -Path $atlasDirectory | Out-Null

function Copy-Atlas([string] $Source, [string] $Destination) {
  Copy-Item -LiteralPath (Join-Path $approved $Source) -Destination (Join-Path $atlasDirectory $Destination) -Force
}

Copy-Atlas 'character_blue_rifle_idle_v01.png' 'characters-b0-review.png'
Copy-Atlas 'pickup_medkit_idle_v01.png' 'gameplay-b0-review.png'

$wall = [System.Drawing.Bitmap]::new((Join-Path $approved 'environment_wall_straight_v01.png'))
$crate = [System.Drawing.Bitmap]::new((Join-Path $approved 'prop_crate_standard_v01.png'))
try {
  $environment = [System.Drawing.Bitmap]::new(768, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($environment)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.DrawImageUnscaled($wall, 0, 0)
      $graphics.DrawImageUnscaled($crate, 512, 0)
    } finally { $graphics.Dispose() }
    $environment.Save((Join-Path $atlasDirectory 'environment-b0-review.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $environment.Dispose() }
} finally {
  $wall.Dispose()
  $crate.Dispose()
}

@{
  atlas = 'environment-b0-review.png'
  frames = @{
    'environment.wall.straight' = @{ x = 0; y = 0; width = 512; height = 256 }
    'prop.crate.standard' = @{ x = 512; y = 0; width = 256; height = 256 }
  }
} | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $atlasDirectory 'b0-review-atlas.json')

Write-Output "Packed B0 review atlases in $atlasDirectory"
