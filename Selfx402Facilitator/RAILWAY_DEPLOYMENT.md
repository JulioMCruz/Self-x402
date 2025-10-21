# Railway Deployment Guide - Selfx402Facilitator

Complete step-by-step guide to deploy the Selfx402Facilitator to Railway.

## Why Railway?

✅ **Subdirectory support** - Can deploy from monorepo subdirectories
✅ **Simple setup** - No CLI required, web UI deployment
✅ **Free tier** - $5/month free credit
✅ **Auto HTTPS** - Automatic SSL certificates
✅ **GitHub integration** - Auto-deploy on push

## Prerequisites

1. **Railway Account**
   - Sign up: https://railway.app
   - Connect GitHub account

2. **Environment Variables Ready**
   - `CELO_MAINNET_PRIVATE_KEY` - Your Celo wallet private key
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Deployment Steps

### Method 1: Web UI (Recommended for Subdirectories)

#### Step 1: Create New Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your repository: `Self-x402`

#### Step 2: Configure Root Directory

🔥 **Critical for subdirectories**:

1. After selecting repo, Railway shows service configuration
2. Click **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Set to: `Selfx402Facilitator`
5. Click **"Save"**

#### Step 3: Set Environment Variables

1. Click **"Variables"** tab
2. Click **"+ New Variable"**
3. Add each variable:

**Required Variables**:
```
CELO_MAINNET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SUPABASE_URL=https://rjyydxtuwjwfovncovla.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

**Optional Variables**:
```
CELO_MAINNET_RPC_URL=https://forno.celo.org
SELF_ENDPOINT=https://your-app.up.railway.app/api/verify
SELF_SCOPE=self-x402-facilitator
SERVER_DOMAIN=https://your-app.up.railway.app
```

⚠️ **Railway automatically sets `PORT`** - Don't set it manually!

4. Click **"Deploy"** or **"Redeploy"**

#### Step 4: Wait for Deployment

Railway will:
1. Clone repository
2. Navigate to `Selfx402Facilitator` directory
3. Run `npm ci` (install dependencies)
4. Run `npx tsc` (build TypeScript)
5. Start with `node dist/index.js`
6. Run health check on `/health` endpoint

**Deployment time**: ~2-3 minutes

#### Step 5: Verify Deployment

1. **Get URL**:
   - Click **"Settings"** tab
   - Scroll to **"Domains"**
   - Copy **"Public Domain"**: `https://your-app.up.railway.app`

2. **Test Health Endpoint**:
   ```bash
   curl https://your-app.up.railway.app/health
   ```

   **Expected response**:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-15T...",
     "network": {
       "name": "Celo Mainnet",
       "chainId": 42220,
       "usdc": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"
     }
   }
   ```

3. **Check Logs**:
   - Click **"Deployments"** tab
   - Click latest deployment
   - Click **"View Logs"**

   **Expected logs**:
   ```
   🚀 Celo x402 Facilitator running on port 8080
   📡 Network: Celo Mainnet (Chain ID: 42220)
   💵 USDC: 0xcebA9300f2b948710d2653dD7B07f33A8B32118C
   🔐 Self Protocol: Enabled (proof-of-unique-human verification)
   💾 Database: Supabase (connected)
   ```

### Method 2: Railway CLI (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to facilitator directory
cd Selfx402Facilitator

# Initialize project
railway init

# Set variables
railway variables set CELO_MAINNET_PRIVATE_KEY=0xYOUR_KEY
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-key

# Deploy
railway up
```

## Post-Deployment Configuration

### Update Vendor API

Update `Vendors/Places-x402-Api/.env`:
```bash
FACILITATOR_URL=https://your-app.up.railway.app
```

### Update Frontend

Update `Selfx402Pay/.env`:
```bash
NEXT_PUBLIC_SELF_ENDPOINT=https://your-app.up.railway.app/api/verify
```

## Monitoring & Management

### View Logs (Real-time)

**Web UI**:
1. Go to Railway dashboard
2. Click your service
3. Click **"Deployments"** → Latest deployment
4. Click **"View Logs"**

**CLI**:
```bash
railway logs
```

### Check Resource Usage

**Web UI**:
1. Click **"Metrics"** tab
2. View CPU, RAM, Network usage

### Restart Service

**Web UI**:
1. Click **"Deployments"** tab
2. Click **⋯** (three dots) → **"Restart"**

**CLI**:
```bash
railway restart
```

## Updating the Facilitator

### Auto-Deploy (Recommended)

Railway auto-deploys on git push:

1. Make code changes
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update facilitator"
   git push
   ```
3. Railway automatically deploys changes

### Manual Deploy

**Web UI**:
1. Click **"Deployments"** tab
2. Click **"Redeploy"**

**CLI**:
```bash
railway up
```

### Update Environment Variables

**Web UI**:
1. Click **"Variables"** tab
2. Edit variable value
3. Click **"Redeploy"** to apply

**CLI**:
```bash
railway variables set VARIABLE_NAME=new_value
```

### Rollback

**Web UI**:
1. Click **"Deployments"** tab
2. Find previous successful deployment
3. Click **⋯** → **"Redeploy"**

## Troubleshooting

### Deployment Failed

**Check Build Logs**:
1. Click **"Deployments"** tab
2. Click failed deployment
3. Click **"View Logs"**

**Common Issues**:
- ❌ **Root directory not set**: Set to `Selfx402Facilitator` in Settings
- ❌ **TypeScript compilation failed**: Check `tsconfig.json`
- ❌ **Missing dependencies**: Ensure `package.json` is complete

### Health Check Failing

**Check Logs**:
```bash
railway logs
```

**Common Issues**:
- ❌ **Database connection failed**: Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- ❌ **Private key invalid**: Check `CELO_MAINNET_PRIVATE_KEY` format (0x prefix)
- ❌ **Port mismatch**: Railway sets `PORT` automatically - remove manual `PORT` variable

### Database Connection Issues

**Check Variables**:
1. Click **"Variables"** tab
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
3. Test connection in Supabase dashboard

**Verify in Logs**:
- ✅ `Database connection successful`
- ✅ `SelfVerificationService initialized with Supabase database`
- ❌ `Database connection failed` → Check credentials

### Performance Issues

**Check Metrics**:
1. Click **"Metrics"** tab
2. View CPU, RAM, Network usage

**Upgrade Plan** (if needed):
1. Click **"Settings"** tab
2. Scroll to **"Plan"**
3. Upgrade to higher tier

## Cost Estimate

**Starter Plan** (Free tier):
- $5/month credit included
- 512MB RAM, shared CPU
- Usually covers facilitator (~$3-5/month usage)

**Developer Plan** ($20/month):
- More resources and priority support

**Actual Usage**:
- Facilitator typically uses ~$3-5/month
- Free tier credit should cover it
- Monitor usage in **"Settings"** → **"Usage"**

See https://railway.app/pricing for current pricing.

## Custom Domain (Optional)

### Add Custom Domain

1. Click **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"+ Custom Domain"**
4. Enter domain: `api.yourdomain.com`
5. Copy CNAME record shown

### DNS Configuration

Add CNAME record to your DNS provider:
```
CNAME api.yourdomain.com your-app.up.railway.app
```

### Update Environment Variables

Update frontend/API to use custom domain:
```bash
FACILITATOR_URL=https://api.yourdomain.com
NEXT_PUBLIC_SELF_ENDPOINT=https://api.yourdomain.com/api/verify
```

## GitHub Auto-Deploy Setup

**Trigger Deploy on Push**:
1. Click **"Settings"** tab
2. Scroll to **"Deploy Triggers"**
3. Enable **"Deploy on Push"**
4. Select branch: `main` or `self-x402-pay`

**Watch Folders** (optional):
1. Click **"Root Directory"** → **"Watch Paths"**
2. Add: `Selfx402Facilitator/**`
3. Only deploys when files in this folder change

## Security Checklist

- ✅ Environment variables set via Railway UI (never committed)
- ✅ `.env` file in `.gitignore`
- ✅ Private key has sufficient CELO for gas
- ✅ Supabase service role key correct (not anon key)
- ✅ HTTPS automatic on Railway
- ✅ Health checks configured (`/health` endpoint)
- ✅ Database connection verified
- ✅ Auto-deploy enabled (optional)

## Railway Configuration Files

Railway auto-detects Node.js projects, but you can customize:

**`railway.json`** (optional):
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx tsc"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/health"
  }
}
```

**`nixpacks.toml`** (optional):
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npx tsc"]

[start]
cmd = "node dist/index.js"
```

These files are **optional** - Railway auto-detects from `package.json`.

## Next Steps

1. ✅ Deploy facilitator to Railway (Web UI)
2. ✅ Set root directory to `Selfx402Facilitator`
3. ✅ Add environment variables
4. ✅ Verify deployment (`/health` endpoint)
5. ✅ Update vendor API with Railway URL
6. ✅ Update frontend with Railway endpoint
7. ✅ Test complete payment flow
8. ✅ Enable auto-deploy (optional)
9. 📋 Monitor logs for 24 hours
10. 📋 Add custom domain (optional)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Selfx402 Docs: See [README.md](README.md)
