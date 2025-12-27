# System Architecture & Flow

This document outlines the high-level architecture and user flows of the **UOLJudge** platform. It is designed to provide developers and system administrators with a clear understanding of how data moves through the system.

## High-Level Architecture

The platform is built on a modern stack ensuring high availability, real-time synchronization, and zero-trust security.

```mermaid
graph TD
    subgraph Client_Layer [Client Layer]
        Browser[Web Browser]
        Mobile[Mobile Device]
    end

    subgraph Application_Layer [Application Layer]
        LB[Load Balancer / Nginx]
        NextJS[Next.js App Server]
        WS[WebSocket Server]
    end

    subgraph Data_Layer [Data Layer]
        Postgres[(PostgreSQL Database)]
        Redis[(Redis / In-Memory Cache)]
        Storage[File Storage]
    end

    Browser -->|HTTPS| LB
    Mobile -->|HTTPS| LB
    LB -->|HTTP| NextJS
    LB -->|WS| WS
    NextJS -->|Query| Postgres
    NextJS -->|Read/Write| Storage
    WS -->|Sub/Pub| Postgres
    NextJS -.->|Notify| WS
```

---

## Core User Flows

### 1. Authentication & Session Management

Strict role-based access control (RBAC) ensures isolation between Admins, Jury, and Participants.

```mermaid
sequenceDiagram
    participant User
    participant Auth as Auth System
    participant DB as Database
    participant Session as Session Manager

    User->>Auth: Login Credentials
    Auth->>DB: Validate User & Hash
    DB-->>Auth: User Profile

    alt Invalid Credentials
        Auth-->>User: Error: Invalid Login
    else Valid Credentials
        Auth->>Session: Create Session (JWT)
        Session->>DB: Log Device & IP
        Session-->>User: Set Secure Cookie
        User->>User: Redirect to Dashboard
    end
```

### 2. Submission & Judging Pipeline

The core loop of the contest: Submission -> Validation -> Judging -> Scoring.

```mermaid
stateDiagram-v2
    [*] --> Pending: User Submits Code
    Pending --> Validating: System Check

    state Validating {
        [*] --> FileCheck: Verify Size/Type
        FileCheck --> HashCheck: Duplicate Check
        HashCheck --> [*]
    }

    Validating --> Rejected: Validation Failed
    Validating --> Grading: Validation Passed

    state Grading {
        [*] --> AutoGrade: Run Test Cases
        AutoGrade --> ManualReview: If Flagged/Required
        AutoGrade --> Finalizing: If Auto-Only
        ManualReview --> Finalizing: Jury Verdict
    }

    Finalizing --> Accepted: Success
    Finalizing --> WrongAnswer: Logic Error
    Finalizing --> RuntimeError: Crash

    Accepted --> UpdateScore: +Points
    WrongAnswer --> UpdatePenalty: +Time Penalty

    UpdateScore --> Broadcast: WebSocket Update
    UpdatePenalty --> Broadcast: WebSocket Update

    Broadcast --> [*]
```

### 3. Real-Time Leaderboard Updates

How the leaderboard stays consistent across hundreds of connected clients.

```mermaid
graph LR
    subgraph Event_Source
        Judge[Judging Engine]
        Admin[Admin Action]
    end

    subgraph Processing
        DB[(Database)]
        Calc[Score Calculator]
    end

    subgraph Distribution
        WS[WebSocket Server]
        ClientA[Team A]
        ClientB[Team B]
        ClientC[Public Display]
    end

    Judge -->|Verdict| DB
    Admin -->|Freeze/Unfreeze| DB

    DB -->|Trigger| Calc
    Calc -->|New State| WS

    WS -->|Broadcast| ClientA
    WS -->|Broadcast| ClientB
    WS -->|Broadcast| ClientC
```

## Database Schema Overview

The database is normalized to 3NF but includes specific denormalized fields (like `TeamScore`) for performance optimization (O(1) reads).

- **User**: Central identity entity.
- **TeamProfile**: Contest-specific attributes for a user.
- **Submission**: Immutable record of code attempts.
- **Contest**: Configuration and state manager (Time, Freeze, Pause).
- **SystemLog**: Immutable audit trail of all critical actions.

For detailed schema, refer to `prisma/schema.prisma`.
