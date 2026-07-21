# CyclesGuard Ingestion Service

Medical-grade GPS telemetry ingestion for female soccer players.

## Features
- HMAC-SHA256 Webhook Authentication
- Durable Postgres outbox queue (survives restarts)
- Data cleansing (HR limits, GPS jump filtering, EMA, interpolation)
- Quarantine + `UNKNOWN_PLAYER` when registry is enforced
- Internal management APIs (player delete, registry, session aggregates)

## Running Locally
```bash
mvn clean package -DskipTests
docker-compose up --build
```

## Tests
```bash
mvn test
```

## Internal APIs (X-Management-Key)
- `DELETE /api/v1/internal/players/{playerId}` — Art. 17 GPS wipe
- `POST /api/v1/internal/players/registry` — known player IDs
- `GET /api/v1/internal/session-aggregates?since=` — coach-safe aggregates

## Example Telemetry cURL
```bash
curl -X POST http://localhost:8080/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <hmac-sha256-hex>" \
  -d '{
    "dataPoints": [
      {
        "playerId": "123e4567-e89b-12d3-a456-426614174000",
        "sessionId": "123e4567-e89b-12d3-a456-426614174001",
        "recordedAt": "2026-07-18T10:00:00Z",
        "latitude": 50.123,
        "longitude": 10.456,
        "heartRate": 120,
        "speedKmh": 15.5
      }
    ]
  }'
```
