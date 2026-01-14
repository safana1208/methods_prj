# Alert Module – API Contract

## Base URL
/api/alerts

---

## Alert Model
```json
{
  "id": "string",
  "title": "string",
  "message": "string",
  "severity": "LOW | MEDIUM | HIGH",
  "status": "NEW | ACKNOWLEDGED | RESOLVED",
  "createdAt": "ISO-8601 datetime"
}

