---
"@checkstack/healthcheck-jenkins-backend": minor
---

Add Jenkins health check strategy with 5 collectors

- **Jenkins Strategy**: Transport client for Jenkins REST API with Basic Auth (username + API token)
- **Server Info Collector**: Jenkins version, mode, executor count, job count
- **Job Status Collector**: Individual job monitoring, last build status, build duration
- **Build History Collector**: Analyze recent builds for trends (success rate, avg duration)
- **Queue Info Collector**: Monitor build queue length, wait times, stuck items
- **Node Health Collector**: Agent availability, executor utilization
