# 🚀 InboxOS Local Setup Guide

Welcome to the local development setup guide for **InboxOS**—a decision + execution layer for AI email automation. This document will guide you through setting up your local environment, installing dependencies, configuring database migrations, and running the services.

---

## 📋 Prerequisites

Before you start, ensure you have the following installed on your local machine:

1. **Node.js (v24.0.0 or higher)**
   - Used for the frontend client and the primary backend server.
   - [Download Node.js](https://nodejs.org/)
2. **Docker & Docker Compose (v2.0 or higher)**
   - Highly recommended for spinning up PostgreSQL, Redis, and other services with a single command.
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## 🛠️ Step-by-Step Installation

### Step 1: Clone the Repository
Clone the repository and navigate into the project directory:

```bash
git clone https://github.com/CodeLabsAI29/Inbox_OS.git
cd Inbox_OS
```

---

### Step 2: Configure Environment Variables
InboxOS reads configurations from the `backend/.env` file. You need to copy the template `.env.example` file:

```bash
cd backend
cp .env.example .env
```

Now, open the newly created [backend/.env](../../backend/.env) file in your editor and adjust the settings.

#### 🔑 Key Environment Variables Explained

Refer to [backend/.env.example](../../backend/.env.example) for reference:

| Key | Description | Default / Example Value |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Env tier mode (`local` \| `staging` \| `production`). | `local` |
| `MOCK_GMAIL` | Set to `true` to enable mock Gmail integrations. Requires `ENVIRONMENT=local` to boot. | `true` |
| `DATABASE_URL` | PostgreSQL connection string. Defaults to local compose container. | `postgresql://postgres:postgres@localhost:5432/inboxos?schema=public` |
| `REDIS_URL` | Redis URL for background BullMQ jobs. Defaults to local compose container. | `redis://localhost:6379/0` |
| `AI_PROVIDER` | Selected intelligence engine (`openai` \| `gemini` \| `ollama` \| `mock`). | `mock` |
| `JWT_SECRET` | Cryptographic secret for signing API tokens. | `replace_with_random_64_char_hex_string` |

---

### Step 3: Run Infrastructure Container
Spin up your local PostgreSQL and Redis databases using Docker Compose in the root folder:

```bash
# In the root repository directory:
docker compose up -d
```

---

### Step 4: Run Database Migrations
Run Prisma migrations to instantiate the database schema:

```bash
cd backend
npx prisma db push
```

---

### Step 5: Start the Servers

#### 1. Start the Node.js Backend Server
In your backend terminal window:
```bash
cd backend
npm run dev
```

#### 2. Start the React Frontend Client
In a new terminal window:
```bash
cd frontend
npm run dev
```

---

## 🎯 Verification

Once all services are running, verify they are working by accessing these URLs:
- **Frontend Application Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Node.js Backend Server:** [http://localhost:8000](http://localhost:8000)

---

## 🔒 Security & Environment Safeguards

1. **Local Infra Guardrail**: The backend will refuse to boot in `local` mode if your `DATABASE_URL` or `REDIS_URL` contains known production hostnames (e.g. `supabase`, `upstash`, `render`).
2. **Mock Mode Protection**: Mock Gmail mode only activates if BOTH `ENVIRONMENT=local` and `MOCK_GMAIL=true` are configured. It will fail loudly at boot on other environments to prevent leakage of mock data.
3. **Commit Protections**: Pre-commit hooks are configured to prevent staging production credentials, secrets, or hostnames. Always review your staged changes before pushing.

---

## 📧 Testing Real Gmail OAuth

Mock mode covers 95%+ of typical contributions. If you specifically need to test real Gmail syncing or OAuth callback handlers:
1. Open an issue tagged `needs-real-oauth`.
2. A project maintainer will add your Google Account email as an authorized tester on the Google Cloud Console OAuth consent screen.
3. Replace the mock credentials in your local `.env` with the active project client credentials and run the OAuth flows with your own account.
