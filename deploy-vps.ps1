# deploy-vps.ps1 — Deploy MSC Control Center to Hostinger KVM VPS (24/7 via PM2)
# Usage: .\deploy-vps.ps1
# Requirements: git, ssh, scp in PATH; SSH key at ~/.ssh/id_ed25519

$ErrorActionPreference = "Stop"

$VPS_HOST   = "46.202.144.194"
$VPS_USER   = "root"
$SSH_KEY    = "$env:USERPROFILE\.ssh\id_ed25519"
$DEPLOY_DIR = "/opt/msc-control-center"
$PM2_NAME   = "msc-control-center"
$APP_PORT   = "3002"

$SSH_OPTS = @("-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-i", $SSH_KEY)

function Remote([string]$cmd) {
    Write-Host "» $cmd" -ForegroundColor Cyan
    & ssh @SSH_OPTS "${VPS_USER}@${VPS_HOST}" $cmd
    if ($LASTEXITCODE -ne 0) { throw "Remote command failed" }
}

Write-Host "`n=== MSC Control Center — VPS Deploy ===" -ForegroundColor Magenta

# ── 1. Create git archive ─────────────────────────────────────────────────────
Write-Host "`n[1/5] Creating deployment archive..." -ForegroundColor Yellow
$ARCHIVE = "$env:TEMP\msc-deploy.tar"
Push-Location $PSScriptRoot
git archive HEAD -o $ARCHIVE
if ($LASTEXITCODE -ne 0) { throw "git archive failed" }
Pop-Location
Write-Host "Archive: $ARCHIVE ($([int]((Get-Item $ARCHIVE).Length / 1KB)) KB)"

# ── 2. Upload archive to VPS ──────────────────────────────────────────────────
Write-Host "`n[2/5] Uploading to VPS..." -ForegroundColor Yellow
Remote "mkdir -p $DEPLOY_DIR"
& scp @SSH_OPTS "$ARCHIVE" "${VPS_USER}@${VPS_HOST}:/tmp/msc-deploy.tar"
if ($LASTEXITCODE -ne 0) { throw "SCP upload failed" }
Remove-Item $ARCHIVE
Remote "cd $DEPLOY_DIR && tar xf /tmp/msc-deploy.tar && rm /tmp/msc-deploy.tar"
Write-Host "Source extracted to $DEPLOY_DIR"

# ── 3. Write production .env on VPS ──────────────────────────────────────────
Write-Host "`n[3/5] Writing production .env on VPS..." -ForegroundColor Yellow
$localEnvPath = Join-Path $PSScriptRoot ".env"
$envLines = Get-Content $localEnvPath | ForEach-Object {
    # Use TCP (127.0.0.1) instead of Unix socket (localhost)
    $_ -replace "@localhost:", "@127.0.0.1:"
}
# Override/add production settings
$envLines = $envLines | Where-Object { $_ -notmatch "^NODE_ENV=" -and $_ -notmatch "^LOCAL_PROJECTS_PATH=" -and $_ -notmatch "^PORT=" }
$envLines += "NODE_ENV=production"
$envLines += "LOCAL_PROJECTS_PATH=/opt/projects"
$envLines += "PORT=$APP_PORT"

$envContent = $envLines -join "`n"
$envContent | & ssh @SSH_OPTS "${VPS_USER}@${VPS_HOST}" "cat > $DEPLOY_DIR/.env"
if ($LASTEXITCODE -ne 0) { throw "Failed to write .env on VPS" }
Write-Host ".env written"

# ── 4. Install dependencies & build ──────────────────────────────────────────
Write-Host "`n[4/5] Installing deps & building on VPS..." -ForegroundColor Yellow
Remote "cd $DEPLOY_DIR && npm ci --silent"
Remote "cd $DEPLOY_DIR && npm run build"
Write-Host "Build complete"

# ── 5. PM2 start/restart ─────────────────────────────────────────────────────
Write-Host "`n[5/5] Starting with PM2..." -ForegroundColor Yellow
Remote "pm2 describe $PM2_NAME > /dev/null 2>&1 && pm2 restart $PM2_NAME || pm2 start $DEPLOY_DIR/dist/index.js --name $PM2_NAME --cwd $DEPLOY_DIR"
Remote "pm2 save"

Write-Host "`n=== Deploy complete ===" -ForegroundColor Green
Write-Host "App URL:   http://${VPS_HOST}:$APP_PORT" -ForegroundColor White
Write-Host "PM2 logs:  ssh root@${VPS_HOST} pm2 logs $PM2_NAME" -ForegroundColor White
Write-Host "PM2 mon:   ssh root@${VPS_HOST} pm2 monit" -ForegroundColor White
