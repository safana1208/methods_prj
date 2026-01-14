# Alert Module – Design

## Overview
This document describes the design of the Alert module.
The module is responsible for managing alerts, including creation,
retrieval, status updates, and storage.

The design follows a layered architecture with clear separation of concerns.

---

## Main Components

### AlertManager (Service Layer)
AlertManager is responsible for the business logic of the system.

Responsibilities:
- Validate alert input (title, message, severity)
- Set default values (status = NEW, creation timestamp)
- Handle alert status updates (ACKNOWLEDGED, RESOLVED)
- Apply filtering logic
- Communicate with AlertRepository for data persistence

---

### AlertRepository (Data Access Layer)
AlertRepository is responsible for storing and retrieving alerts.

Responsibilities:
- Save alerts
- Retrieve alerts by ID
- Retrieve all alerts
- Update alert data
- Delete alerts if required

For the MVP implementation, the repository will be implemented
as an in-memory data structure.

---

## Architecture Rationale
The separation between AlertManager and AlertRepository allows:
- Better modularity
- Easier testing
- Clear separation between business logic and data access
- Future replacement of the repository (e.g., database instead of in-memory)

---

## High-Level Data Flow
1. Frontend sends an HTTP request to the Backend
2. Controller receives the request
3. Controller delegates the request to AlertManager
4. AlertManager applies business logic
5. AlertManager calls AlertRepository
6. Response is returned back to the client
