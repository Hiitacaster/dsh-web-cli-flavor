# ============================================================================
# install.ps1 - install dsh-web-cli-flavor into DSH web profile
# ----------------------------------------------------------------------------
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/install.ps1            # install
#   powershell -ExecutionPolicy Bypass -File scripts/install.ps1 -Uninstall # uninstall
#   powershell -ExecutionPolicy Bypass -File scripts/install.ps1 -NoDistPatch  # install without dist patch
#
# Does three things:
#   1. Copies the plugin package to profile node_modules\dsh-web-cli-flavor
#   2. Registers web-cli-flavor entry in profile cordis.patch.yml (idempotent)
#   3. (Default) Appends skin CSS to the frontend compiled index-*.css
#      - takes effect on page refresh without restarting dsh web service;
#        after next restart the client plugin takes over, dist patch can be
#        removed with -Uninstall
#
# NOTE: keep this file pure ASCII (English comments). Windows PowerShell 5.1
# reads .ps1 without BOM using the ANSI code page; non-ASCII comments become
# mojibake and can break parsing.
# ============================================================================
param(
  [switch]$Uninstall,
  [switch]$NoDistPatch,
  [string]$DistCss
)

$ErrorActionPreference = 'Stop'

$here       = Split-Path -Parent $MyInvocation.MyCommand.Path          # scripts/
$root       = Split-Path -Parent $here                                 # workspace root
$pkgDir     = Join-Path $root 'dsh-web-cli-flavor'
$profile    = Join-Path $env:USERPROFILE '.dsh\profiles\web'
$nmTarget   = Join-Path $profile 'node_modules\dsh-web-cli-flavor'
$patchFile  = Join-Path $profile 'cordis.patch.yml'

# ---------------------------------------------------------------------------
# Detect the frontend assets dir the running dsh web service actually serves.
# The service may be launched from a local install (e.g. E:\Deepseek\dsh\lib\
# bin.js web) or from npx; the frontend dist lives in different places. If we
# patch the wrong copy, the browser never sees the patch.
# ---------------------------------------------------------------------------
function Get-FrontendAssetsPath {
  # 1) Derive dsh install root from the running dsh web service process
  try {
    $nodeProcs = Get-CimInstance Win32_Process | Where-Object {
      $_.Name -match 'node' -and $_.CommandLine -match 'bin\.js.*\bweb\b'
    }
    foreach ($p in $nodeProcs) {
      $m = [regex]::Match($p.CommandLine, '("[^"]*dsh[^"]*\\lib\\bin\.js"|\S*dsh[^ ]*\\lib\\bin\.js)')
      if ($m.Success) {
        $bin = $m.Groups[1].Value -replace '"', ''
        $dshRoot = Split-Path -Parent (Split-Path -Parent $bin)   # lib/bin.js -> lib -> dsh root
        $candidate = Join-Path $dshRoot 'node_modules\@deepseek-ai\dsh-web-frontend\dist\assets'
        if (Test-Path $candidate) {
          return $candidate
        }
      }
    }
  } catch {
    # CIM probe failed; fall through to npx cache
  }

  # 2) Fallback: npx cache copy
  $npx = Join-Path $env:LOCALAPPDATA 'npm-cache\_npx\1e7f6d9597241db0\node_modules\@deepseek-ai\dsh-web-frontend\dist\assets'
  if (Test-Path $npx) { return $npx }

  return $null
}

$frontend = Get-FrontendAssetsPath
if ($DistCss) {
  # Explicit override (dev checkout layout: apps\web\dist\assets), bypass detection
  if (Test-Path $DistCss) {
    Write-Host "[ok] frontend css override: $DistCss"
    $distCss = $DistCss
  } else {
    Write-Warning "DistCss path not found: $DistCss - skipped dist patch (client plugin only)"
    $distCss = $null
  }
} elseif (-not $frontend) {
  Write-Warning "Could not detect dsh-web-frontend dist directory; use -DistCss <path> to patch it (skipping dist patch)"
  $distCss = $null
} else {
  Write-Host "[ok] frontend assets: $frontend"
  # find the actual index-*.css (hash filename may change between builds)
  $indexCss = Get-ChildItem (Join-Path $frontend 'index-*.css') -ErrorAction SilentlyContinue | Select-Object -First 1
  $distCss = if ($indexCss) { $indexCss.FullName } else { Join-Path $frontend 'index-CSGf6Qzd.css' }
}

$ENTRY_ID   = 'web-cli-flavor'
$MARK_START = "/* >>> dsh-web-cli-flavor:start <<< */"
$MARK_END   = "/* >>> dsh-web-cli-flavor:end <<< */"

if (!(Test-Path $pkgDir))     { Write-Error "Plugin dir not found: $pkgDir" }
if (!(Test-Path $profile))    { Write-Error "web profile not found: $profile (start dsh web once first)" }

# ---------------------------------------------------------------------------
# Uninstall: remove cordis entry, package dir, dist patch
# ---------------------------------------------------------------------------
if ($Uninstall) {
  # 1) Remove cordis.patch.yml entry
  if (Test-Path $patchFile) {
    $text = Get-Content $patchFile -Raw -Encoding UTF8
    # Remove "  - insert:\n    - id: web-cli-flavor ... " block (to next top-level - or EOF)
    $pattern = "(?ms)^\s*-\s*insert:\s*\n\s*-\s*id:\s*$ENTRY_ID\b.*?(?=^\s*-\s*insert:|\z)"
    $new = [regex]::Replace($text, $pattern, '')
    if ($new -ne $text) {
      Set-Content $patchFile $new -Encoding UTF8 -NoNewline
      Write-Host "[ok] Removed $ENTRY_ID entry from cordis.patch.yml"
    } else {
      Write-Host "[skip] $ENTRY_ID not present in cordis.patch.yml"
    }
  }
  # 2) Remove package dir
  if (Test-Path $nmTarget) {
    Remove-Item $nmTarget -Recurse -Force
    Write-Host "[ok] Removed $nmTarget"
  } else {
    Write-Host "[skip] package dir not present"
  }
  # 3) Remove dist patch
  if ($distCss -and (Test-Path $distCss)) {
    $css = Get-Content $distCss -Raw -Encoding UTF8
    $i = $css.IndexOf($MARK_START); $j = $css.IndexOf($MARK_END)
    if ($i -ge 0 -and $j -gt $i) {
      $jEnd = $j + $MARK_END.Length
      $css = $css.Remove($i, $jEnd - $i)
      Set-Content $distCss $css -Encoding UTF8 -NoNewline
      Write-Host "[ok] Removed dist patch"
    } else {
      Write-Host "[skip] dist patch not present"
    }
  }
  Write-Host "Uninstall done. Restart dsh web service for full removal if it is running."
  exit 0
}

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------
# 1) Copy package
if (Test-Path $nmTarget) { Remove-Item $nmTarget -Recurse -Force }
New-Item -ItemType Directory -Force -Path $nmTarget | Out-Null
Copy-Item (Join-Path $pkgDir 'package.json') $nmTarget
Copy-Item (Join-Path $pkgDir 'cordis.patch.yml') $nmTarget
Copy-Item (Join-Path $pkgDir 'lib') (Join-Path $nmTarget 'lib') -Recurse
Copy-Item (Join-Path $pkgDir 'styles') (Join-Path $nmTarget 'styles') -Recurse
Write-Host "[ok] Installed package to $nmTarget"

# 2) Register cordis entry (idempotent)
$entryBlock = @"

- insert:
    - id: $ENTRY_ID
      name: 'dsh-web-cli-flavor'
      config: {}
"@
if (Test-Path $patchFile) {
  $text = Get-Content $patchFile -Raw -Encoding UTF8
  if ($text -match "(?m)^\s*-\s*id:\s*$ENTRY_ID\b") {
    Write-Host "[skip] cordis.patch.yml already has $ENTRY_ID"
  } else {
    $text = $text.TrimEnd() + $entryBlock + "`n"
    Set-Content $patchFile $text -Encoding UTF8 -NoNewline
    Write-Host "[ok] Registered $ENTRY_ID in cordis.patch.yml"
  }
} else {
  Set-Content $patchFile ($entryBlock.TrimStart() + "`n") -Encoding UTF8 -NoNewline
  Write-Host "[ok] Created cordis.patch.yml and registered $ENTRY_ID"
}

# 3) Direct dist patch (takes effect on refresh; rollback via -Uninstall)
if (-not $NoDistPatch) {
  if (-not $distCss -or !(Test-Path $distCss)) {
    Write-Warning "dist stylesheet not found: $distCss - skipped dist patch (client plugin only)"
  } else {
    $css = Get-Content $distCss -Raw -Encoding UTF8
    if ($css.Contains($MARK_START)) {
      # Existing patch: strip it first, then re-append the latest CSS
      # (avoids the stale-patch trap where refresh never shows new rules)
      $i = $css.IndexOf($MARK_START); $j = $css.IndexOf($MARK_END)
      if ($i -ge 0 -and $j -gt $i) {
        $jEnd = $j + $MARK_END.Length
        $css = $css.Remove($i, $jEnd - $i)
        Write-Host "[ok] stripped previous dist patch"
      }
    }
    $patchCss = Get-Content (Join-Path $pkgDir 'styles\cli-flavor.css') -Raw -Encoding UTF8
    $patchCss = $patchCss.TrimEnd()
    $css = $css.TrimEnd() + "`n`n" + $MARK_START + "`n" + $patchCss + "`n" + $MARK_END + "`n"
    Set-Content $distCss $css -Encoding UTF8 -NoNewline
    Write-Host "[ok] Appended skin CSS to dist stylesheet (takes effect on page refresh)"
  }
} else {
  Write-Host "[skip] -NoDistPatch: no dist patch (restart dsh web for client plugin to take over)"
}

Write-Host ""
Write-Host "Install done."
Write-Host "  - Immediate (no restart): refresh browser (Ctrl+Shift+R recommended)."
Write-Host "  - Permanent: after dsh web service restart the client plugin takes over (dist patch can then be removed)."
