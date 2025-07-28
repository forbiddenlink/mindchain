# 🧠 MindChain – Real-Time Multi-Agent AI Debate Engine

**MindChain** is a real-time AI policy debate simulator powered by Redis. Each AI agent is capable of:
- Holding a persistent profile (RedisJSON)
- Logging and recalling memories (Redis Streams)
- Evolving positions in real-time (RedisTimeSeries)
- Verifying statements semantically (Redis Vector Search)
- Communicating via shared debates (Streams)

---

## ✅ Core Features & Redis Architecture

### 1. Redis Connection
Connection string stored in `.env`:
```env
REDIS_URL=redis://default:<password>@<host>:<port>
```
Connected in `index.js`:
```js
const client = createClient({{ url: process.env.REDIS_URL }});
```

---

### 2. Agent Profiles (RedisJSON)
Each profile lives at:
```
agent:{{agent_id}}:profile
```
Example:
```json
{{
  "name": "SenatorBot",
  "role": "Moderate US Senator",
  "tone": "measured",
  "stance": {{
    "climate_policy": 0.4,
    "economic_risk": 0.8
  }},
  "biases": ["fiscal responsibility", "bipartisan compromise"]
}}
```

---

### 3. Shared Debate Messages (Stream)
Stored at:
```
debate:{{debate_id}}:messages
```
Example:
```json
{{
  "agent_id": "senatorbot",
  "message": "We must balance environmental protection with economic growth."
}}
```

---

### 4. Private Agent Memory (Stream)
Key format:
```
debate:{{debate_id}}:agent:{{agent_id}}:memory
```
Example:
```json
{{
  "type": "statement",
  "content": "We’ve seen carbon tax legislation fail in the past."
}}
```

---

### 5. Stance Tracking (TimeSeries)
Stored as:
```
debate:{{debate_id}}:agent:{{agent_id}}:stance:{{topic}}
```
Redis command:
```
TS.ADD debate:climatebill2025:agent:senatorbot:stance:climate_policy * 0.4
```

---

### 6. Fact Checking (Vector Search)
Uses Redis Vector embedding keys:
- `fact:001`
- Stored and queried via HNSW + FT

Insertion:
```js
await client.hSet("fact:001", {{
  content: "CO2 emissions hit record highs in 2023.",
  embedding: Buffer.from(vector)
}});
```
Search:
```js
await client.ft.search("facts-index", "*=>[KNN 1 @embedding $vec]", {{
  PARAMS: {{ vec: embedding }},
  RETURN: ["content", "__score"],
  DIALECT: 2
}});
```

---

## 🧠 Redis Key Summary

| Key | Purpose |
|-----|---------|
| `agent:senatorbot:profile` | Agent’s identity & beliefs |
| `debate:climatebill2025:messages` | Public messages |
| `debate:climatebill2025:agent:senatorbot:memory` | Private stream |
| `debate:climatebill2025:agent:senatorbot:stance:climate_policy` | TimeSeries position |
| `fact:001` | Semantic fact object |

---

## 🛠️ Dev Usage

```js
// Add memory
client.xAdd("debate:climatebill2025:agent:senatorbot:memory", "*", {{
  type: "observation",
  content: "Opposition lacks viable plan."
}});

// Add stance
client.ts.add("debate:climatebill2025:agent:senatorbot:stance:climate_policy", "*", 0.6);

// Get profile
const profile = await client.json.get("agent:senatorbot:profile");
```

---

## 🚀 Modules & Next Features

| Module | Description |
|--------|-------------|
| ✅ JSON | Profile system |
| ✅ Streams | Memory and messaging |
| ✅ TimeSeries | Live stance evolution |
| ✅ Vector | Fact checker |
| 🔜 Pub/Sub | Multiplayer agent debates |
| 🔜 Dashboard | Real-time charting and control |

---

_Last updated: 2025-07-28_
