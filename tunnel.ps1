# tunnel.ps1 — Opens SSH tunnel: localhost:5432 -> VPS Postgres:5432
# Run ONCE before `npm run dev`. Keep this window open (or run as job).
# Usage: .\tunnel.ps1  OR  Start-Job { .\tunnel.ps1 }

# Read VPS_HOST and VPS_PORT from .env (falls back to defaults)
$envFile = Join-Path $PSScriptRoot ".env"
$vpsHost = "46.202.144.194"
$vpsPort = "22"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*VPS_HOST\s*=\s*(.+)$") { $vpsHost = $Matches[1].Trim() }
        if ($_ -match "^\s*VPS_PORT\s*=\s*(.+)$") { $vpsPort = $Matches[1].Trim() }
    }
}

Write-Host "Opening SSH tunnel: localhost:5432 -> ${vpsHost}:5432 ..."
Write-Host "Press Ctrl+C to close."

$key = "$env:USERPROFILE\.ssh\id_ed25519"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -i $key -p $vpsPort -L 5432:localhost:5432 -N "root@${vpsHost}"
