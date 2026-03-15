# Architecture — AI-Assisted Journal System

## System Overview

```
┌───────────────┐     HTTPS      ┌──────────────────┐     SSL      ┌──────────────────┐
│   React SPA   │ ──────────────▶│  Express API     │ ───────────▶│  MySQL           │
│   (Vercel)    │                │  (Vercel Fn)     │             │  (Aiven Cloud)   │
└───────────────┘                │                  │             └──────────────────┘
                                 │  ┌────────────┐  │
                                 │  │ LRU Cache  │  │
                                 │  └────────────┘  │
                                 │         │        │
                                 │  ┌────────────┐  │
                                 │  │ Gemini API │  │
                                 │  └────────────┘  │
                                 └──────────────────┘
```

### Data Flow

1. **Write Entry**: Frontend → `POST /api/journal` → PostgreSQL INSERT
2. **View Entries**: Frontend → `GET /api/journal/:userId` → PostgreSQL SELECT
3. **Analyze**: Frontend → `POST /api/journal/analyze` → Check Cache → (miss) → Gemini API → Cache → Response
4. **Insights**: Frontend → `GET /api/journal/insights/:userId` → PostgreSQL aggregate queries → Response

---

## 1. How would you scale this to 100,000 users?

### Database Layer
- **Connection Pooling**: Use ProxySQL or Aiven's built-in connection pooling to handle thousands of concurrent connections without overwhelming MySQL.
- **Read Replicas**: Deploy read replicas for the `GET` endpoints (entries, insights) while directing writes to the primary. This splits the read/write load ~80/20.
- **Partitioning**: Partition `journal_entries` by `user_id` hash ranges for faster queries as the table grows to hundreds of millions of rows.
- **Indexing**: Composite index on `(user_id, created_at DESC)` for efficient per-user queries. JSON functions for keyword searching.

### Application Layer
- **Horizontal Scaling**: Vercel serverless functions auto-scale by default. For a self-hosted setup, deploy multiple Express instances behind a load balancer (e.g., AWS ALB).
- **Message Queue**: For LLM analysis, move to an async model. Accept the request, push to a queue (SQS/RabbitMQ/Redis Streams), process asynchronously, and notify the client via WebSocket or polling.
- **API Gateway**: Use an API gateway (e.g., AWS API Gateway, Kong) for centralized rate limiting, authentication, and request routing.

### Caching Layer
- **Redis**: Replace the in-memory LRU cache with Redis. This provides persistence across restarts, shared cache across instances, and supports TTL-based expiry.
- **CDN**: Serve the React frontend via a CDN (Vercel does this automatically) for global latency reduction.

### Estimated Capacity
| Metric | Target |
|---|---|
| Concurrent users | 100,000 |
| Entries/day | ~500,000 |
| LLM calls/day | ~50,000 (with 90% cache hit rate) |
| Database size (1yr) | ~50 GB |

---

## 2. How would you reduce LLM cost?

### Caching (Highest Impact)
- **Content-Hash Cache**: Hash the input text (SHA-256) and store results. Identical or near-identical texts reuse cached analysis. Current implementation achieves this in-memory; at scale, use Redis with 24-hour TTL.
- **Database-Level Cache**: Store `emotion`, `keywords`, `summary` directly on the `journal_entries` row. Once analyzed, never re-analyze.
- **Cache Hit Rate**: Expected 60-80% for a journaling app (users often describe similar feelings).

### Prompt Engineering
- **Minimal Prompts**: Keep prompts short and structured. Current prompt is ~150 tokens input. Avoid verbose system instructions.
- **JSON Mode**: Request structured JSON output to reduce response tokens (no prose, no markdown).
- **Max Tokens Limit**: Cap response at 200 tokens to prevent runaway costs.

### Model Selection
- **Tiered Models**: Use cheaper/faster models (Gemini Flash) for simple analysis. Reserve larger models for complex multi-paragraph entries.
- **Free Tier**: Google Gemini offers a generous free tier (60 RPM, 1500 RPD). Stay within limits for early users.

### Batching
- **Batch Processing**: Aggregate multiple analysis requests and process them in a single API call. Useful when users submit entries in bursts.

### Cost Estimation
| Scenario | Monthly Cost |
|---|---|
| 1,000 users, 50% cache hit | ~$0 (free tier) |
| 10,000 users, 70% cache hit | ~$5-15 |
| 100,000 users, 85% cache hit | ~$50-100 |

---

## 3. How would you cache repeated analysis?

### Current Implementation (In-Memory LRU)
```
Text → SHA-256 Hash → Check Map → Hit? Return cached → Miss? Call Gemini → Store in Map
```
- **LRU eviction** at 500 entries
- **Case-insensitive** and **whitespace-normalized** before hashing
- **Zero additional infrastructure** required

### Production-Grade Caching Strategy

#### Layer 1: Database Cache
- Store analysis results (`emotion`, `keywords`, `summary`) directly on `journal_entries` rows
- If the same text was analyzed before, SELECT from DB instead of calling LLM
- Query: `SELECT emotion, keywords, summary FROM journal_entries WHERE text = $1 AND emotion IS NOT NULL LIMIT 1`

#### Layer 2: Redis Cache
- Key: `analysis:{sha256(text)}`, Value: JSON result
- TTL: 24 hours (emotions don't change for the same text)
- Shared across all server instances
- Sub-millisecond lookups

#### Layer 3: Semantic Similarity (Advanced)
- Use text embeddings to find semantically similar entries
- If a new entry is 95%+ similar to an already-analyzed entry, reuse that analysis
- Requires vector database (Pinecone, pgvector)

### Cache Invalidation
- LLM analysis of static text is **idempotent** — the same input should always produce similar output
- No cache invalidation needed for identical text
- For semantic caching, use time-based TTL (7 days)

---

## 4. How would you protect sensitive journal data?

### Encryption

#### In Transit
- **TLS 1.3** enforced on all connections (Vercel provides this automatically)
- **SSL/TLS** for MySQL connection (Aiven requires it by default with CA certificate verification)
- **HTTPS-only** frontend with HSTS headers

#### At Rest
- **Database encryption**: Aiven encrypts all MySQL data at rest using AES-256
- **Column-level encryption**: For extra-sensitive fields (journal `text`), encrypt with AES-256-GCM using a per-user derived key before storing
- **Key management**: Use a KMS (AWS KMS, HashiCorp Vault) to manage encryption keys

### Access Control
- **Authentication**: Implement JWT-based authentication with refresh tokens
- **Authorization**: Users can only access their own entries (`WHERE user_id = $token.userId`)
- **API Key rotation**: Rotate Gemini API keys periodically
- **CORS**: Restrict to known frontend origins

### Data Minimization
- **LLM data handling**: Only send the journal text to Gemini — never user IDs, names, or metadata
- **Right to deletion**: Implement `DELETE /api/journal/:userId` for GDPR compliance
- **Data retention**: Auto-delete entries older than X months (configurable)

### Infrastructure Security
- **Rate limiting**: Prevent brute-force attacks (100 req/15min general, 20 req/15min for LLM)
- **Input validation**: Sanitize all inputs, limit text length to prevent prompt injection
- **Logging**: Audit log for data access (who accessed what, when). Never log journal text content.
- **Environment variables**: Never commit secrets to version control (`.env` in `.gitignore`)

### Compliance Considerations
| Standard | Approach |
|---|---|
| GDPR | Right to deletion, data portability, privacy by design |
| HIPAA | If health-related: BAA with cloud providers, PHI encryption |
| SOC 2 | Access controls, audit logging, encryption at rest & transit |
