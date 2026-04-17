# ITSM Agent — Complete End-to-End Guide

**Project:** ITSM Automation Agent v1.0.0  
**Stack:** NestJS · MongoDB Atlas · Kafka · Redis · OpenAI · 9 SaaS Adapters  
**Purpose:** Automatically provision and de-provision employee access to SaaS tools when they join or leave the company.

---

## Table of Contents

1. [What It Does (Plain English)](#1-what-it-does)
2. [High-Level Architecture Block Diagram](#2-high-level-architecture)
3. [Module Map](#3-module-map)
4. [Onboarding Flow — Step-by-Step](#4-onboarding-flow)
5. [Offboarding Flow — Step-by-Step](#5-offboarding-flow)
6. [Detailed Block Diagram — Onboarding](#6-detailed-onboarding-diagram)
7. [Detailed Block Diagram — Offboarding](#7-detailed-offboarding-diagram)
8. [All 9 SaaS Adapters](#8-saas-adapters)
9. [AI Tool Recommendation](#9-ai-recommendation)
10. [Database Schemas](#10-database-schemas)
11. [Kafka Event Architecture](#11-kafka-architecture)
12. [Security & Encryption](#12-security)
13. [Multi-Tenancy](#13-multi-tenancy)
14. [All API Endpoints](#14-api-endpoints)
15. [Environment Variables Reference](#15-environment-variables)
16. [Startup Sequence](#16-startup-sequence)
17. [Error Handling & Resilience](#17-error-handling)
18. [Live Creation Checklist](#18-live-creation-checklist)

---

## 1. What It Does

When an HR person creates a new employee record via API, the ITSM Agent:

1. **Auto-generates** a company email address (`john.doe@company.com`)
2. **Determines** which tools the employee needs (via AI or role-based rules)
3. **Creates accounts** in all required SaaS tools **in parallel** (GitHub, Slack, Google Workspace, Jira, etc.)
4. **Sends a welcome email** with login credentials and tool list
5. **Logs every action** (success or failure) to an audit trail

When an employee is offboarded:

1. **Removes or suspends** accounts across all tools
2. **Sends an offboarding confirmation email**
3. **Logs all removals** to the audit trail

Everything is multi-tenant (one instance serves multiple companies), encrypted at rest, and event-driven via Kafka.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ITSM AGENT SYSTEM                                     │
│                                                                                 │
│  ┌──────────────┐    REST API     ┌─────────────────────────────────────────┐  │
│  │   HR / Client │ ─────────────► │           NestJS Application            │  │
│  │  (HTTP Client)│                │              (Port 3000)                │  │
│  └──────────────┘                └─────────────────────────────────────────┘  │
│                                            │                                    │
│                          ┌─────────────────┼─────────────────┐                 │
│                          ▼                 ▼                  ▼                 │
│                  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│                  │  MongoDB     │  │    Kafka      │  │    Redis     │         │
│                  │  Atlas       │  │  (optional)   │  │  (optional)  │         │
│                  │  (Always On) │  │  localhost    │  │  localhost   │         │
│                  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                                 │
│                          ┌──────────────────────────────────┐                  │
│                          │        9 SAAS ADAPTERS           │                  │
│                          │  GitHub  Slack  Google  M365     │                  │
│                          │  Jira  Salesforce  Zoom          │                  │
│                          │  ServiceNow  SAP                 │                  │
│                          └──────────────────────────────────┘                  │
│                                                                                 │
│                          ┌──────────────────────────────────┐                  │
│                          │     AI LAYER (OpenAI GPT-4o)     │                  │
│                          │  Tool Recommendation per role    │                  │
│                          └──────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Map

```
src/
│
├── app.module.ts                    ← Root: wires everything together
├── main.ts                          ← Entry: starts HTTP + Kafka consumer
│
├── config/
│   └── configuration.ts            ← Maps .env → typed config object
│
├── modules/
│   ├── employee/                   ← CREATE / OFFBOARD employees
│   │   ├── employee.controller.ts  ← HTTP: POST /employees, PATCH /employees/:id/offboard
│   │   ├── employee.service.ts     ← Business logic: email gen, status change
│   │   └── schemas/employee.schema.ts
│   │
│   ├── provisioning/               ← MAIN ORCHESTRATOR
│   │   ├── provisioning.controller.ts ← Kafka consumers + HTTP triggers
│   │   └── provisioning.service.ts    ← Calls adapters, logs, emails
│   │
│   ├── itsm/                       ← INTEGRATION CONFIG (per-tenant)
│   │   ├── itsm-integrations.controller.ts
│   │   ├── itsm-integrations.service.ts  ← Upsert, enable/disable, metrics
│   │   └── schemas/itsm-integration.schema.ts
│   │
│   ├── logs/                       ← AUDIT TRAIL
│   │   ├── logs.controller.ts
│   │   ├── logs.service.ts
│   │   └── schemas/log.schema.ts
│   │
│   ├── ai-recommendation/          ← AI TOOL SELECTION
│   │   └── ai-recommendation.service.ts  ← OpenAI + rule-based fallback
│   │
│   ├── email/                      ← SMTP EMAIL
│   │   └── email.service.ts        ← Welcome / deactivation emails
│   │
│   └── tenant-config/              ← PER-TENANT SETTINGS
│       └── tenant-config.service.ts
│
├── adapters/                       ← 9 SAAS CONNECTORS
│   ├── adapters.module.ts
│   ├── github.adapter.ts
│   ├── slack.adapter.ts
│   ├── google.adapter.ts
│   ├── microsoft365.adapter.ts
│   ├── jira.adapter.ts
│   ├── salesforce.adapter.ts
│   ├── zoom.adapter.ts
│   ├── servicenow.adapter.ts
│   └── sap.adapter.ts
│
├── kafka/                          ← EVENT BUS
│   ├── kafka.module.ts
│   ├── kafka.producer.service.ts   ← publishOnboarded / publishOffboarded
│   └── kafka.constants.ts
│
├── cache/                          ← REDIS WRAPPER
│   ├── cache.module.ts
│   └── cache.service.ts            ← get / set / del (best-effort)
│
├── utils/
│   ├── encryption.util.ts          ← AES-256-GCM encrypt/decrypt
│   ├── password.ts                 ← Crypto-random password
│   ├── helpers.ts                  ← Email address generation
│   └── winston.logger.ts           ← File + console logging
│
└── common/
    ├── filters/http-exception.filter.ts
    ├── interceptors/logging.interceptor.ts
    └── interfaces/adapter.interface.ts  ← IAdapter contract
```

---

## 4. Onboarding Flow — Step-by-Step

```
Step 1:  HR calls  POST /employees
         Body: { tenantId, firstName, lastName, role, department }

Step 2:  EmployeeController → EmployeeService.create()
         - Generates email: john.doe@company.com (collision-safe)
         - Saves Employee doc to MongoDB (status = ACTIVE)
         - Builds EmployeeEvent { employeeId, tenantId, firstName, lastName, email, role }

Step 3:  KAFKA_ENABLED?
         YES → KafkaProducerService.publishOnboarded(event)
               → Topic: itsm.employee.onboarded
               → (Async) ProvisioningController.handleEmployeeOnboarded(@Payload)
         NO  → ProvisioningService.provisionEmployee(event) [synchronous]

Step 4:  ProvisioningService.provisionEmployee()
         a. ItsmIntegrationsService.getEnabledTools(tenantId)
            → Try Redis cache (key: itsm:integrations:{tenantId})
            → Cache MISS → MongoDB query → cache for 5 min
         b. ItsmIntegrationsService.getCredentials(tenantId)
            → Returns decrypted credentials for all integrations
         c. AiRecommendationService.recommendTools(role, department, enabledTools)
            → Try OpenAI GPT-4o-mini
            → Fallback: ROLE_TOOLS lookup table
            → Intersect with tenant-enabled tools
         d. generatePassword() → 12-char crypto-random hex

Step 5:  Invoke all recommended adapters via Promise.allSettled() [PARALLEL]
         Each adapter:  inviteUser(email, credentials, password?)
         ├── GitHubAdapter     → POST api.github.com/orgs/{org}/invitations
         ├── SlackAdapter      → POST slack.com/api/users.admin.invite
         ├── GoogleAdapter     → POST admin.googleapis.com/admin/directory/v1/users
         ├── Microsoft365      → POST graph.microsoft.com/v1.0/users
         ├── JiraAdapter       → POST {host}/rest/api/3/user/bulk/new
         ├── SalesforceAdapter → POST {instance}/services/data/v59.0/sobjects/User
         ├── ZoomAdapter       → POST api.zoom.us/v2/users
         ├── ServiceNowAdapter → POST {instance}/api/now/table/sys_user
         └── SAPAdapter        → POST accounts.ondemand.com/service/scim/Users

Step 6:  Per adapter result → LogsService.create()
         MongoDB insert: { employeeId, tenantId, email, tool, action:PROVISION, status:SUCCESS|FAILED }

Step 7:  EmailService.sendOnboardingEmail()
         → SMTP: HTML email with welcome message, temp password, tool list with URLs
         → Fallback: console log (dev/missing SMTP)
```

---

## 5. Offboarding Flow — Step-by-Step

```
Step 1:  HR calls  PATCH /employees/:id/offboard

Step 2:  EmployeeController → EmployeeService.offboard(id)
         - Updates status = OFFBOARDED in MongoDB
         - Builds EmployeeEvent

Step 3:  Kafka or direct (same as onboarding)
         Topic: itsm.employee.offboarded
         Handler: ProvisioningController.handleEmployeeOffboarded()

Step 4:  ProvisioningService.deprovisionEmployee()
         - Get enabled tools + credentials (same as onboarding)
         - No AI needed — remove from all enabled tools

Step 5:  Invoke all adapters via Promise.allSettled() [PARALLEL]
         Each adapter:  removeUser(email, credentials)
         ├── GitHub     → DELETE /orgs/{org}/members/{username}
         ├── Slack      → POST /users.admin.setInactive
         ├── Google     → PATCH /users/{email}  { suspended: true }
         ├── M365       → PATCH /users/{email}  { accountEnabled: false }
         ├── Jira       → DELETE /user?accountId={id}
         ├── Salesforce → PATCH /sobjects/User/{id}  { IsActive: false }
         ├── Zoom       → PATCH /users/{email}/status  { action: deactivate }
         ├── ServiceNow → PATCH /sys_user/{sys_id}  { active: false }
         └── SAP        → PATCH /scim/Users/{id}  { active: false }

Step 6:  Log every result → LogsService.create() [action: DEPROVISION]

Step 7:  EmailService.sendOffboardingEmail()
         → Sends confirmation: "Access removed from: GitHub, Slack, ..."
```

---

## 6. Detailed Block Diagram — Onboarding

```
                            POST /employees
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   EmployeeController    │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   EmployeeService       │
                    │  • Generate email       │
                    │  • Save to MongoDB      │
                    │  • Build EmployeeEvent  │
                    └─────────────────────────┘
                                  │
                   ┌──────────────┴──────────────┐
              KAFKA_ENABLED?                 KAFKA_ENABLED?
                  YES                            NO
                   │                             │
                   ▼                             │
    ┌──────────────────────────┐                 │
    │  KafkaProducerService    │                 │
    │  publishOnboarded(event) │                 │
    └──────────────────────────┘                 │
                   │                             │
                   ▼ (async)                     │
    ┌──────────────────────────┐                 │
    │  ProvisioningController  │                 │
    │  handleEmployeeOnboarded │                 │
    └──────────────────────────┘                 │
                   │                             │
                   └──────────────┬──────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  ProvisioningService    │
                    │  provisionEmployee()    │
                    └─────────────────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ItsmIntegrations  │  │ItsmIntegrations  │  │ AiRecommendation │
  │ getEnabledTools()│  │ getCredentials() │  │ recommendTools() │
  │                  │  │                  │  │                  │
  │ Redis Cache ──►  │  │ MongoDB          │  │ OpenAI GPT-4o OR │
  │ MongoDB fallback │  │ (decrypted       │  │ Role lookup table│
  └──────────────────┘  │  AES-256-GCM)   │  └──────────────────┘
                        └──────────────────┘
                                  │
                         (all results merged)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   generatePassword()    │
                    │   12-char crypto-random │
                    └─────────────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────────┐
              │      Promise.allSettled([...adapters])    │
              │              PARALLEL EXECUTION           │
              └───────────────────────────────────────────┘
                │         │         │         │         │
                ▼         ▼         ▼         ▼         ▼
          ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
          │GitHub│  │Slack │  │Google│  │ M365 │  │ Jira │
          └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
                │         │         │         │         │
                ▼         ▼         ▼         ▼         ▼
          ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
          │Sales-│  │ Zoom │  │Serv- │  │ SAP  │
          │force │  │      │  │iceNow│  │      │
          └──────┘  └──────┘  └──────┘  └──────┘
                                  │
                    (all results collected)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   LogsService.create()  │
                    │   Per tool, per result  │
                    │   → MongoDB insert      │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  EmailService           │
                    │  sendOnboardingEmail()  │
                    │  → SMTP or console log  │
                    └─────────────────────────┘
                                  │
                                  ▼
                           DONE ✓
```

---

## 7. Detailed Block Diagram — Offboarding

```
                     PATCH /employees/:id/offboard
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  EmployeeService        │
                    │  offboard(id)           │
                    │  status = OFFBOARDED    │
                    └─────────────────────────┘
                                  │
                     (Kafka or direct — same as onboarding)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  ProvisioningService    │
                    │  deprovisionEmployee()  │
                    └─────────────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────────┐
              │   removeUser() on all enabled adapters    │
              │           PARALLEL (allSettled)           │
              └───────────────────────────────────────────┘
                │         │         │         │         │
                ▼         ▼         ▼         ▼         ▼
          GitHub:    Slack:      Google:    M365:     Jira:
          DELETE     setInactive suspend    disable   DELETE
          member     user        user       account   user
                │         │         │         │         │
                         (same for Salesforce, Zoom, ServiceNow, SAP)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  LogsService            │
                    │  action: DEPROVISION    │
                    │  status: SUCCESS|FAILED │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  EmailService           │
                    │  sendOffboardingEmail() │
                    └─────────────────────────┘
```

---

## 8. SaaS Adapters

All adapters implement the `IAdapter` interface:

```typescript
interface IAdapter {
  inviteUser(email: string, credentials?: AdapterCredentials, password?: string): Promise<void>;
  removeUser(email: string, credentials?: AdapterCredentials): Promise<void>;
  assignRoleOrAccess(email: string, role: string, credentials?: AdapterCredentials): Promise<void>;
}
```

| Adapter | Auth Method | Invite Action | Remove Action | File |
|---------|-------------|---------------|---------------|------|
| **GitHub** | Bearer Token | POST /orgs/{org}/invitations | DELETE /orgs/{org}/members/{user} | github.adapter.ts |
| **Slack** | Bearer Token | POST /users.admin.invite | POST /users.admin.setInactive | slack.adapter.ts |
| **Google Workspace** | OAuth2 Bearer | POST /admin/directory/v1/users | PATCH /users/{email} {suspended:true} | google.adapter.ts |
| **Microsoft 365** | OAuth2 Client Creds | POST /v1.0/users | PATCH /v1.0/users/{id} {accountEnabled:false} | microsoft365.adapter.ts |
| **Jira** | Basic Auth | POST /api/3/user/bulk/new | DELETE /api/3/user?accountId={id} | jira.adapter.ts |
| **Salesforce** | Bearer Token | POST /sobjects/User | PATCH /sobjects/User/{id} {IsActive:false} | salesforce.adapter.ts |
| **Zoom** | OAuth2 Server-to-Server | POST /v2/users | PATCH /v2/users/{id}/status {action:deactivate} | zoom.adapter.ts |
| **ServiceNow** | Basic Auth | POST /api/now/table/sys_user | PATCH sys_user/{id} {active:false} | servicenow.adapter.ts |
| **SAP** | SCIM 2.0 Basic Auth | POST /scim/Users | PATCH /scim/Users/{id} {active:false} | sap.adapter.ts |

---

## 9. AI Recommendation

```
AiRecommendationService.recommendTools(role, department, enabledTools)
          │
          ▼
  OpenAI API key configured?
          │
   YES ───┴─── NO
    │              │
    ▼              ▼
  GPT-4o-mini   ROLE_TOOLS lookup
  Temperature:0
  Returns JSON
  array of tools
          │
          ▼
  Intersect with tenant's enabledTools
          │
          ▼
  Return filtered tool list


ROLE_TOOLS (fallback rules):
  developer        → github, slack, jira
  hr               → slack, google, microsoft365
  testing          → jira, slack, zoom
  it               → github, slack, google, servicenow
  cybersecurity    → github, jira, servicenow
  salesforce_team  → salesforce, slack
  manager          → slack, microsoft365, zoom
  finance          → sap, slack
  engineering_lead → github, slack, jira, zoom
  devops           → github, slack, servicenow
  support          → slack, servicenow, jira
  marketing        → slack, microsoft365, salesforce
  default          → slack
```

---

## 10. Database Schemas

### Employee Collection (`employees`)
```
{
  _id:          ObjectId
  tenantId:     String       ← which company
  firstName:    String
  lastName:     String
  name:         String       ← "firstName lastName"
  email:        String       ← unique, auto-generated
  role:         String       ← e.g. "developer", "hr"
  department:   String?
  status:       "ACTIVE" | "OFFBOARDED"
  createdAt:    Date
  updatedAt:    Date
}
```

### Audit Log Collection (`itsm_provisioning_logs`)
```
{
  _id:          ObjectId
  employeeId:   String
  tenantId:     String
  email:        String
  tool:         String       ← "github", "slack", etc.
  action:       "PROVISION" | "DEPROVISION"
  status:       "SUCCESS" | "FAILED"
  message:      String
  createdAt:    Date
}
Indexes: { tenantId, employeeId }, { tenantId, email }
```

### ITSM Integration Collection (`itsm_integrations`)
```
{
  _id:              ObjectId
  tenantId:         String
  service:          String       ← "github", "slack", etc.
  enabled:          Boolean
  credentials:      Object       ← AES-256-GCM encrypted at rest
  status:           "active" | "inactive" | "error"
  lastTestedAt:     Date?
  lastErrorMessage: String?
  deletedAt:        Date?        ← soft delete
}
Unique Index: { tenantId, service }
```

### Tenant Config Collection (`tenant_configs`)
```
{
  _id:               ObjectId
  tenantId:          String      ← unique
  companyEmailDomain: String     ← "terralogic.com"
  enabledTools:      String[]    ← ["github", "slack", "jira"]
  credentials:       Object      ← per-tenant credential overrides
}
```

---

## 11. Kafka Architecture

```
                    ┌─────────────────────────────────────┐
                    │           KAFKA BROKER               │
                    │         localhost:9092               │
                    │                                     │
                    │  Topic: itsm.employee.onboarded     │
                    │  Topic: itsm.employee.offboarded    │
                    └─────────────────────────────────────┘
                           │              ▲
                     consume              │ publish
                           │              │
                           ▼              │
              ┌────────────────────────────────────────┐
              │         NestJS Application             │
              │                                        │
              │  PRODUCER: KafkaProducerService        │
              │    publishOnboarded(EmployeeEvent)     │
              │    publishOffboarded(EmployeeEvent)    │
              │                                        │
              │  CONSUMER: ProvisioningController      │
              │    @EventPattern('itsm.employee.       │
              │      onboarded') → provisionEmployee() │
              │    @EventPattern('itsm.employee.       │
              │      offboarded') → deprovision()      │
              └────────────────────────────────────────┘

EmployeeEvent schema:
{
  employeeId: string
  tenantId:   string
  firstName:  string
  lastName:   string
  email:      string
  role:       string
  department: string (optional)
}

If KAFKA_ENABLED=false:
  → ProvisioningService called directly (synchronous, no broker needed)
```

---

## 12. Security & Encryption

```
Credentials Flow:

  PUT /itsm/integrations  (raw credentials in request)
            │
            ▼
  Mongoose pre-save hook
  encryptCredentials()
  AES-256-GCM with 32-byte key from .env
  Format stored: "iv:tag:ciphertext" (all hex)
            │
            ▼
  MongoDB Atlas — all credentials encrypted at rest
            │
            ▼
  Mongoose post-find hook
  decryptCredentials()
            │
            ▼
  ProvisioningService gets plain credentials
```

**Other Security Controls:**
- JWT for authentication (ACCESS_SECRET, REFRESH_SECRET)
- Password generation: `crypto.randomBytes(6).toString('hex')` → 12-char
- Email domain enforced per tenant
- Soft-delete for integrations (no hard deletes)
- `Promise.allSettled()` — one adapter failure never exposes another's credentials

---

## 13. Multi-Tenancy

```
Each request carries tenantId.

MongoDB isolation:
  employees.tenantId          ← all queries filtered by tenantId
  itsm_integrations.tenantId  ← per-company credentials
  tenant_configs.tenantId     ← per-company settings
  logs.tenantId               ← per-company audit trail

Redis isolation:
  Cache key: itsm:integrations:{tenantId}   ← tenant-scoped

Credential resolution order:
  1. itsm_integrations collection (per-tenant, encrypted)
  2. tenant_configs.credentials (per-tenant override)
  3. .env defaults (shared fallback)
```

---

## 14. API Endpoints

### Employee Management
```
POST   /employees
       Body: { tenantId, firstName, lastName, role, department? }
       Response: Created employee with generated email

GET    /employees
       Response: Array of all employees

GET    /employees/:id
       Response: Single employee

PATCH  /employees/:id/offboard
       Response: Updated employee (status=OFFBOARDED)
```

### Provisioning (HTTP triggers — no Kafka needed for testing)
```
POST   /provisioning/trigger
       Body: EmployeeEvent
       Response: Provision result

POST   /provisioning/trigger/offboard
       Body: EmployeeEvent
       Response: De-provision result
```

### ITSM Integration Configuration
```
PUT    /itsm/integrations
       Body: { tenantId, service, credentials, enabled }
       Response: Upserted integration

GET    /itsm/integrations?tenantId=xxx
       Response: All integrations for tenant

GET    /itsm/integrations/metrics?tenantId=xxx
       Response: { total, enabled, disabled, errored }

GET    /itsm/integrations/:service?tenantId=xxx
       Response: Single integration

POST   /itsm/integrations/:service/test?tenantId=xxx
       Response: Updated integration (lastTestedAt set)

DELETE /itsm/integrations/:service?tenantId=xxx
       Response: Soft-deleted (deletedAt set)
```

### Audit Logs
```
GET    /logs/employee/:id          ← Logs for an employee (by MongoDB _id)
GET    /logs/tenant/:tenantId      ← All logs for a company
GET    /logs/:email                ← Logs for a specific email address
```

---

## 15. Environment Variables

```bash
# === Server ===
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# === MongoDB ===
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/itsm-agent

# === JWT ===
JWT_SECRET=your-secret
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# === Kafka ===
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=itsm-agent
KAFKA_CONSUMER_GROUP_ID=itsm-consumer-group
KAFKA_ENABLED=true
KAFKA_TOPIC_ONBOARDED=itsm.employee.onboarded
KAFKA_TOPIC_OFFBOARDED=itsm.employee.offboarded

# === Redis (optional) ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# === Email ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@company.com
SMTP_PASS=app-specific-password
SMTP_FROM=ITSM Agent <noreply@company.com>

# === Security ===
ENCRYPTION_KEY=your-32-byte-hex-key-here-64-chars

# === AI ===
OPENAI_API_KEY=sk-...

# === Company ===
EMAIL_DOMAIN=company.com
FEATURE_PROVISIONING=true
FEATURE_NOTIFICATIONS=true

# === GitHub ===
GITHUB_TOKEN=ghp_...
GITHUB_ORG=your-org

# === Slack ===
SLACK_BOT_TOKEN=xoxb-...

# === Google ===
GOOGLE_ACCESS_TOKEN=ya29...
GOOGLE_ADMIN_EMAIL=admin@company.com

# === Microsoft 365 ===
M365_TENANT_ID=xxx
M365_CLIENT_ID=xxx
M365_CLIENT_SECRET=xxx
M365_DOMAIN=company.onmicrosoft.com

# === Jira ===
JIRA_HOST=https://company.atlassian.net
JIRA_EMAIL=admin@company.com
JIRA_API_TOKEN=ATATT3...
JIRA_PROJECT_KEY=OPS

# === Salesforce ===
SALESFORCE_INSTANCE_URL=https://company.my.salesforce.com
SALESFORCE_ACCESS_TOKEN=xxx

# === Zoom ===
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx

# === ServiceNow ===
SERVICENOW_INSTANCE=company.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=xxx

# === SAP ===
SAP_SCIM_BASE_URL=https://accounts.ondemand.com/service/scim
SAP_CLIENT_ID=xxx
SAP_CLIENT_SECRET=xxx
```

---

## 16. Startup Sequence

```
npm start
    │
    ▼
nest start → main.ts bootstrap()
    │
    ├─ 1. Load .env configuration
    ├─ 2. Create NestJS app (AppModule)
    ├─ 3. Apply global:
    │       • ValidationPipe (whitelist, transform)
    │       • HttpExceptionFilter
    │       • LoggingInterceptor
    ├─ 4. Connect MongoDB (Mongoose)
    ├─ 5. Initialize Redis (graceful fail if unavailable)
    ├─ 6. Register all modules (DI graph)
    ├─ 7. If KAFKA_ENABLED:
    │       connectMicroservice(KafkaOptions)
    │       startAllMicroservices()
    │       → Now listening on itsm.employee.onboarded
    │       → Now listening on itsm.employee.offboarded
    └─ 8. app.listen(PORT)
          → "ITSM Agent running on port 3000"
```

---

## 17. Error Handling & Resilience

| Failure Scenario | Behavior |
|-----------------|----------|
| One adapter throws | `Promise.allSettled()` — other adapters still run, failure logged |
| Redis unavailable | Cache miss every time, DB queried directly — no crash |
| Kafka unavailable | Warning logged, provisioning falls back to HTTP-trigger mode |
| OpenAI API error | Falls back to deterministic `ROLE_TOOLS` rules |
| SMTP unavailable | Email logged to console — provisioning still completes |
| MongoDB credential decryption error | Returns plaintext (forward compatible) |
| Adapter credentials missing | Warning logged, adapter skipped gracefully |

---

## 18. Live Creation Checklist

Follow these steps to set up a working instance from scratch:

### Phase 1 — Infrastructure Setup

```bash
# 1. Clone and install
git clone <repo>
cd itsm-agent
npm install

# 2. Start Kafka locally (via Docker)
docker-compose up -d
# Starts: Zookeeper (:2181) + Kafka (:9092)

# 3. Start Redis (optional, for caching)
docker run -d -p 6379:6379 redis:alpine

# 4. MongoDB Atlas
# → Create cluster at mongodb.com/atlas
# → Get connection string
# → Whitelist your IP
```

### Phase 2 — Configure Environment

```bash
cp .env.example .env
# Edit .env with:
# - MONGO_URI         (Atlas connection string)
# - ENCRYPTION_KEY    (generate: openssl rand -hex 32)
# - EMAIL_DOMAIN      (your company domain)
# - SMTP_*            (your email server)
# - OPENAI_API_KEY    (optional, for AI)
# - KAFKA_ENABLED     (true for event-driven, false for sync)
```

### Phase 3 — Register Tenant and Integrations

```bash
# 3a. Register tenant configuration
curl -X PUT http://localhost:3000/itsm/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "service": "github",
    "enabled": true,
    "credentials": {
      "token": "ghp_your_token",
      "org": "your-github-org"
    }
  }'

# 3b. Repeat for each tool: slack, google, jira, zoom, etc.

# 3c. Verify integrations registered
curl http://localhost:3000/itsm/integrations?tenantId=tenant-001
```

### Phase 4 — Start the Application

```bash
npm run build
npm start

# OR development mode:
npm run start:dev
```

### Phase 5 — Create First Employee (Full Flow Test)

```bash
# Create employee → triggers full provisioning
curl -X POST http://localhost:3000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "firstName": "John",
    "lastName": "Doe",
    "role": "developer",
    "department": "Engineering"
  }'

# Expected:
# 1. Employee created with email john.doe@company.com
# 2. Provisioned in: github, slack, jira (developer role)
# 3. Onboarding email sent with credentials
# 4. Logs written to MongoDB
```

### Phase 6 — Verify Results

```bash
# Check employee was created
curl http://localhost:3000/employees

# Check audit logs
curl http://localhost:3000/logs/tenant/tenant-001

# Check logs for specific email
curl http://localhost:3000/logs/john.doe@company.com
```

### Phase 7 — Test Offboarding

```bash
# Replace <employee_id> with _id from creation response
curl -X PATCH http://localhost:3000/employees/<employee_id>/offboard

# Expected:
# 1. Employee status = OFFBOARDED
# 2. Removed from: github, slack, jira
# 3. Offboarding email sent
# 4. DEPROVISION logs written
```

### Phase 8 — Monitor

```bash
# Application logs (Winston)
tail -f logs/application-$(date +%Y-%m-%d).log

# Error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Integration metrics
curl http://localhost:3000/itsm/integrations/metrics?tenantId=tenant-001
```

---

## Quick Reference Card

```
ONBOARDING:   POST /employees  →  Kafka/Direct  →  9 Adapters (parallel)  →  Log  →  Email
OFFBOARDING:  PATCH /employees/:id/offboard  →  Kafka/Direct  →  9 Adapters  →  Log  →  Email
CONFIGURE:    PUT /itsm/integrations  →  encrypted in MongoDB
AUDIT:        GET /logs/tenant/:tenantId
AI FALLBACK:  Role → tool mapping if OpenAI unavailable
ENCRYPTION:   AES-256-GCM on all credentials at rest
MULTI-TENANT: tenantId on all collections, Redis cache scoped per tenant
```
