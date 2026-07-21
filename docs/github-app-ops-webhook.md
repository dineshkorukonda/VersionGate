# Ops: flip official GitHub App webhook to the relay

After deploying the website with Redis + `GITHUB_WEBHOOK_SECRET` + `RELAY_SECRET`:

1. Open **VersionGate-App** → General → Webhook
2. Set **Webhook URL** to:
   ```
   https://versiongate.tech/api/webhooks/github
   ```
3. Ensure webhook secret matches website `GITHUB_WEBHOOK_SECRET` and each VPS `GITHUB_WEBHOOK_SECRET`
4. Deliveries → Recent deliveries → confirm `ping` / `push` return 200
5. E2E: Connect GitHub on a VPS → push to a linked project branch → confirm fan-out in Vercel logs and deploy job on the VPS

Local relay smoke (without GitHub):

```bash
# After register mapping exists in Redis for installation 12345:
curl -sS -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -H "X-Hub-Signature-256: sha256=$(...)" \
  -d '{"zen":"test"}'
```

Signature must be computed with the real webhook secret over the raw body.
