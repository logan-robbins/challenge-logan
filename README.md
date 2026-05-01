# challengelogan

Next.js app deployed to Google Cloud Run. Live at **https://challengelogan.com**.

## Pages

| Path | Description |
|---|---|
| `/` | Challenge listing |
| `/help` | Claude Managed Agent chat interface |
| `/admin` | Admin panel (GitHub login required) |
| `/agent-governance` | Agent governance demo |
| `/agent-workflows` | Agent workflow demo |

## Local dev

```bash
npm install
npm run dev
# → http://localhost:3000
```

Requires `.env.local` — copy `.env.example` and fill in values.

## Deployment

**Target:** Google Cloud Run — project `transformer-478002`, region `us-central1`, service `challengelogan`  
**Custom domain:** https://challengelogan.com

Deploy (builds via Cloud Build, then updates the service):

```bash
# 1. Build and push the image
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/transformer-478002/cloud-run-source-deploy/challengelogan:latest \
  --region us-central1

# 2. Deploy the new image
gcloud run deploy challengelogan \
  --image us-central1-docker.pkg.dev/transformer-478002/cloud-run-source-deploy/challengelogan:latest \
  --region us-central1 \
  --timeout 3600
```

To update environment variables:

```bash
gcloud run services update challengelogan \
  --region us-central1 \
  --update-env-vars KEY=VALUE
```

## Managed Agent setup (one-time)

The `/help` chat uses Anthropic Managed Agents. If `AGENT_ID` / `ENV_ID` are not set, run:

```bash
ANTHROPIC_API_KEY=... BRIGHTDATA_API_TOKEN=... npx tsx scripts/setup-managed-agent.ts
```

Then add the printed `AGENT_ID` and `ENV_ID` to `.env.local` and to Cloud Run:

```bash
gcloud run services update challengelogan \
  --region us-central1 \
  --update-env-vars AGENT_ID=...,ENV_ID=...
```

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Cloud Run + `.env.local` | Key in `DO_NOT_DELETE.txt` |
| `AGENT_ID` | Cloud Run + `.env.local` | From setup script |
| `ENV_ID` | Cloud Run + `.env.local` | From setup script |
| `CHAT_PASSWORD` | Cloud Run + `.env.local` | Password gates `/help` |
| `BRIGHTDATA_API_TOKEN` | Cloud Run + `.env.local` | BrightData MCP token |
| `AUTH_SECRET` | Cloud Run + `.env.local` | Auth.js secret |
| `AUTH_GITHUB_ID/SECRET` | Cloud Run + `.env.local` | GitHub OAuth app |
| `ADMIN_GITHUB_ID` | Cloud Run + `.env.local` | GitHub user ID for admin access |
