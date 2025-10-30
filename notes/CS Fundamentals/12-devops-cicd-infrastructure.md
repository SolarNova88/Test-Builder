# DevOps / CI/CD / Infrastructure

## What They Are (Simple Terms)

Think of software development like a factory:

- **DevOps** = The entire process of building and shipping products
  - Development + Operations (building + running)
  - Automates everything: building, testing, deploying, monitoring
  
- **CI/CD** = The assembly line
  - **CI (Continuous Integration)**: Automatically test code when you push
  - **CD (Continuous Deployment)**: Automatically deploy code when tests pass
  
- **Infrastructure** = The factory itself (buildings, machinery, utilities)
  - Servers, databases, networks, cloud services
  - **IaC (Infrastructure as Code)**: Describe infrastructure with code (like a blueprint)

## Why This Matters

- **Speed**: Automate manual tasks (no more manual deployments)
- **Reliability**: Automated tests catch bugs before production
- **Consistency**: Same process every time (no human error)
- **Scalability**: Can deploy to hundreds of servers automatically
- **Visibility**: Monitor everything (know when something breaks)

## Real-World Example

**Before DevOps** (manual):
1. Developer writes code
2. Manually tests on their laptop
3. Emails code to ops team
4. Ops team manually deploys to server
5. Something breaks? Manually rollback

**With DevOps** (automated):
1. Developer pushes code to GitHub
2. **CI**: Tests run automatically
3. If tests pass, **CD**: Deploy automatically
4. Monitor: If errors spike, automatically rollback
5. All tracked: See who deployed what, when

**Time saved**: Days → Minutes

## DevOps

**DevOps** = Culture + tools that bridge development and operations

- **Goal**: Automate everything—from building code to deploying and monitoring
- **Key Tools**: Docker, Kubernetes, Terraform, Jenkins, GitHub Actions
- **Analogy**: Like a pit crew that keeps your car (software) running smoothly during a race

**DevOps practices**:
- **Automation**: No manual steps (everything scripted)
- **Monitoring**: Know when things break (before users complain)
- **Infrastructure as Code**: Servers defined in code (not clicking around UI)
- **Collaboration**: Dev and Ops work together (not separate teams)

**Why DevOps matters**:
- **Faster deployments**: Minutes instead of days
- **Fewer errors**: Automated tests catch bugs
- **Better reliability**: Consistent processes
- **Scalability**: Can handle growth (auto-scale servers)

## CI/CD

**CI (Continuous Integration)** = Automatically test and merge code

- **What it does**: Whenever you push code, run tests
- **Why it matters**: Catches bugs early (before they reach production)
- **Example**: Push code → GitHub Actions runs tests → If pass, merge automatically

**CD (Continuous Deployment)** = Automatically deploy tested code

- **What it does**: If tests pass, deploy to production automatically
- **Why it matters**: No manual deployment steps (faster, less error-prone)
- **Example**: Tests pass → Deploy to staging → If staging OK → Deploy to production

**Typical CI/CD pipeline**:
```
1. Developer pushes code
2. CI: Run tests (unit tests, integration tests)
3. CI: Build Docker image
4. CD: Deploy to staging
5. CD: Run smoke tests on staging
6. CD: Deploy to production (if staging OK)
7. Monitor: Watch for errors
```

**Common CI/CD tools**:
- **GitHub Actions**: Built into GitHub
- **GitLab CI**: Built into GitLab
- **Jenkins**: Self-hosted CI/CD server
- **CircleCI**: Cloud-based CI/CD

## Infrastructure

**Infrastructure** = The servers, networks, and systems that run your app

- Physical/virtual resources: Servers, databases, load balancers, networks
- **IaC (Infrastructure as Code)**: Describe infrastructure with code
  - Instead of clicking around AWS console, write code that describes your infrastructure
  - Like a blueprint that can be versioned, shared, and reused

**Traditional Infrastructure** (manual):
- Log into AWS console
- Click to create servers
- Manually configure each server
- Document what you did (so others can do it again)
- Problem: Hard to reproduce, easy to make mistakes

**Infrastructure as Code** (automated):
- Write code describing infrastructure:
  ```hcl
  resource "aws_instance" "web" {
    ami           = "ami-12345"
    instance_type = "t2.micro"
  }
  ```
- Run `terraform apply` → Creates infrastructure automatically
- Benefits: Version controlled, reproducible, testable

**Common IaC tools**:
- **Terraform**: Popular IaC tool (works with AWS, Azure, GCP)
- **CloudFormation**: AWS-specific IaC
- **Ansible**: Configuration management (automates server setup)
- **Pulumi**: IaC using real programming languages (Python, TypeScript)

**Cloud providers** (where infrastructure lives):
- **AWS**: Amazon Web Services (largest cloud provider)
- **Azure**: Microsoft's cloud
- **GCP**: Google Cloud Platform

## Common Pitfalls

**DevOps**:
- **Not automating everything**: Manual steps introduce errors
- **No monitoring**: Don't know when things break
- **Siloed teams**: Dev and Ops don't communicate

**CI/CD**:
- **Flaky tests**: Tests that randomly fail (waste time investigating)
- **No rollback plan**: Can't revert if deployment fails
- **Deploying on Friday**: Weekend outages are worse

**Infrastructure**:
- **Manual changes**: Someone changes infrastructure manually (breaks IaC)
- **No version control**: Infrastructure changes not tracked
- **Over-provisioning**: Paying for servers you don't need

## Best Practices

**DevOps**:
- Automate everything (no manual steps)
- Monitor everything (logs, metrics, alerts)
- Use version control (Git for code AND infrastructure)
- Document processes (how to deploy, how to rollback)

**CI/CD**:
- Run tests fast (slow tests = slow deployments)
- Deploy in stages (dev → staging → production)
- Always have rollback plan
- Monitor after deployment (watch for errors)

**Infrastructure**:
- Use Infrastructure as Code (never change manually)
- Version control infrastructure code
- Test infrastructure changes (in staging first)
- Use cloud provider features (auto-scaling, load balancing)

## Example Pipeline

**Complete DevOps pipeline**:

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions triggers CI
   ↓
3. CI: Run tests (unit, integration)
   ↓
4. CI: Build Docker image
   ↓
5. CI: Push image to registry
   ↓
6. CD: Deploy to staging (using Terraform)
   ↓
7. CD: Run smoke tests on staging
   ↓
8. If staging OK → CD: Deploy to production
   ↓
9. Monitor: Watch logs, metrics, alerts
   ↓
10. If errors → Auto-rollback
```

**All automated**:
- No manual steps
- Consistent every time
- Fast (minutes instead of days)
- Reliable (tests catch bugs)
