# Environment / Deployment / Instance

## What They Are (Simple Terms)

Think of software deployment like theater productions:

- **Environment** = The stage (Development = rehearsal, Staging = dress rehearsal, Production = opening night)
- **Deployment** = Actually putting the show on stage (moving code from your computer to live servers)
- **Instance** = One actor performing (one copy of your app running)
  - More instances = more actors (can handle more audience)

## Why This Matters

- **Safety**: Test in dev/staging before affecting real users
- **Rollback**: If new version breaks, quickly revert to last working version
- **Zero downtime**: Deploy new code without shutting down the site
- **Scaling**: Add more instances when traffic increases
- **Confidence**: Staging environment catches bugs before production

## Real-World Example

**Deploying a new feature to Instagram**:
1. **Development**: You code on your laptop, test locally
2. **Staging**: Push to staging server (identical to production), QA tests it
3. **Production**: Deploy to live servers (rolling deployment: replace servers one by one)
4. **Monitor**: Watch for errors, traffic, performance
5. **Rollback**: If something breaks, revert to previous version immediately

## Environments

**Environment** = Separate version of your system for different purposes

- **Development**: rapid iteration, verbose logging, feature flags
  - Your laptop or local Docker setup
  - Can break things, experiment freely
  - Lots of debug logs, error details
- **Staging**: production-like; final verification (migrations, perf smoke)
  - Exactly like production but not serving real users
  - Used for final testing before going live
  - Catches issues like "migration doesn't work on production DB"
- **Production**: monitored, scaled, SLO/SLA targets
  - The real thing serving actual users
  - Minimal logging (performance), error tracking only
  - Must be stable, fast, reliable

**Environment variables** separate configs:
- Dev: `DATABASE_URL=localhost:5432/mydb_dev`
- Staging: `DATABASE_URL=staging-db:5432/mydb_staging`
- Prod: `DATABASE_URL=prod-db:5432/mydb_prod`

## Deployment Strategies

**How to put new code live without breaking things**:

- **Rolling**: replace pods/instances gradually
  - Deploy to server 1, wait, deploy to server 2, wait, etc.
  - If something breaks, only affects one server, can stop deployment
  - **Use when**: Most common, safe, works well
  
- **Blue/Green**: two envs; switch traffic after validation
  - "Blue" = current production
  - "Green" = new version
  - Deploy to Green, test it, then switch all traffic from Blue to Green
  - **Use when**: Need instant rollback (just switch back to Blue)
  
- **Canary**: small % of traffic to new version first
  - 5% of users get new version, 95% get old version
  - Monitor errors, if good, gradually increase to 100%
  - **Use when**: Unsure about new version (gradual rollout)

**Which to use?**
- **Rolling**: Default choice, safe and tested
- **Blue/Green**: When you need instant rollback
- **Canary**: When deploying risky changes

## Instances

**Instance** = One running copy of your application

- Independent runtime copies; scale horizontally behind a load balancer
  - Like having multiple cashiers: more cashiers = serve more customers
  - Load balancer spreads traffic across instances
- Stateless is easier to scale; stateful requires replication and quorum
  - **Stateless**: Each request is independent (REST APIs) → easy to scale
  - **Stateful**: Server remembers things (sessions) → harder to scale

**Example**: If Instagram has 3 instances:
- User request → Load balancer → Instance 1, 2, or 3 (whichever is free)
- Each instance can handle 1000 requests/second
- Total capacity: 3000 requests/second

**Scaling**:
- **Horizontal**: Add more instances (easier, recommended)
- **Vertical**: Make instances bigger (harder, limited by hardware)

## Rollback & Health

- Health checks (liveness/readiness); automated rollback on failed checks
  - **Liveness**: "Is the app running?" (process check)
  - **Readiness**: "Can the app handle traffic?" (dependency check: is DB connected?)
  - If health check fails, automatically rollback
- Keep last stable artifact; version every deploy
  - Tag each deploy: `v1.2.3`, `v1.2.4`
  - Can instantly revert to `v1.2.3` if `v1.2.4` breaks

**Health check example**:
```bash
GET /health
→ 200 OK {"status": "healthy", "db": "connected"}
```

If health check fails (returns 500 or doesn't respond), deployment system automatically stops and rolls back.

## Common Pitfalls

- **Deploying directly to production**: Always test in staging first
- **No rollback plan**: What if deployment breaks? Have a plan!
- **Deploying on Friday**: Weekend outages are worse (deploy Tuesday-Thursday)
- **Not checking health checks**: App might be "running" but not actually working
- **Breaking migrations**: Database changes that fail in production (always test migrations in staging first)
- **Forgetting environment variables**: Code works locally but breaks in prod (different configs)

## Best Practices

- **Automate deployments**: Use CI/CD pipelines (GitHub Actions, GitLab CI)
- **Test in staging**: Production-like environment catches issues
- **Version everything**: Tags, database migrations, API versions
- **Monitor during deployment**: Watch error rates, response times
- **Have rollback ready**: Can revert in < 5 minutes
- **Deploy during low traffic**: Fewer users affected if something breaks
- **Feature flags**: Turn features on/off without redeploying

## Deployment Checklist

Before deploying:
- [ ] Tests pass locally
- [ ] Tests pass in CI/CD
- [ ] Staging deployment successful
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented
- [ ] Team notified (Slack, email)
- [ ] Monitoring dashboard open

During deployment:
- [ ] Watch health checks
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify key functionality works

After deployment:
- [ ] Verify no error spike
- [ ] Check logs for warnings
- [ ] Monitor for 30 minutes
- [ ] Update deployment log
