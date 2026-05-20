<p align="center">
  <img src="src/front/assets/img/logos/logo-app.png" alt="PlayerLink Logo" width="120"/>
</p>

<h1 align="center">PlayerLink</h1>
<p align="center">Find your perfect gaming companion — swipe, match, and play together.</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white" />
</p>

---

## 📖 About

**PlayerLink** is a full-stack web app designed to connect gamers. Think of it as Tinder for gaming — create your profile, add your favorite games, swipe on other players, and when it's mutual you get a **match**. From there you can chat, leave reviews, and find new games with AI assistance.

Built from scratch as a personal project, mobile-first, with a sci-fi aesthetic.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Bootstrap 5 |
| Backend | Python 3.13 + Flask + Flask-JWT-Extended |
| Database | PostgreSQL (production) / SQLite (local dev) |
| ORM | SQLAlchemy 2 + Flask-Migrate (Alembic) |
| Auth | JWT (Bearer token) + bcrypt password hashing |
| Email | Flask-Mail + Gmail SMTP (App Password) |
| AI Assistant | Anthropic Claude (game recommendations) |
| File uploads | Cloudinary (avatar photos) |
| Deployment | Render.com |

---

## ✨ Key Features

- **Register / Login** — JWT auth with bcrypt, email verification flow
- **Profile** — avatar upload (Cloudinary), gaming preferences, Discord/Steam IDs, bio
- **Search a Mate** — swipe-style card deck; like → mutual match
- **Your Matches** — grid of all matched players, detailed view, star reviews & comments
- **Chat** — real-time messaging with matched players (polling-based, read receipts)
- **Find Games** — AI-powered recommendations via Anthropic Claude
- **Settings** — change email, change password, delete account
- **Password Reset** — secure email flow with expiring JWT link
- **Admin panel** — Flask-Admin for DB management
- **Block & Report** — safety tools for users

---

## 🚀 Local Setup

### Prerequisites

- Python 3.13+
- Node.js 20+
- `pipenv` → `pip install pipenv`

---

### 1. Clone & configure environment

```bash
git clone https://github.com/LazaroAntonino/PlayerLink_Web_App.git
cd PlayerLink_Web_App
```

Create your `.env` file in the root with these variables:

```env
# Flask
FLASK_APP=src/app.py
FLASK_DEBUG=1
FLASK_APP_KEY="your-secret-key"

# Database (SQLite for local dev)
DATABASE_URL=sqlite:////tmp/playerlink_dev.db

# JWT
JWT_SECRET_KEY="your-jwt-secret"

# Email (Gmail App Password — no spaces)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=465
MAIL_USE_SSL=true
MAIL_USE_TLS=false
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=yourapppasword

# Cloudinary (avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Anthropic (AI game assistant)
ANTHROPIC_API_KEY=your_anthropic_key

# URLs
FRONTEND_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3001
```

> **Gmail App Password**: go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), create one for "PlayerLink", and paste the 16-char key **without spaces**.

---

### 2. Backend setup

```bash
# Install Python dependencies
pipenv install

# Create the database and apply all migrations
pipenv run flask db upgrade

# Seed with test users and data
cd src
pipenv run python seed.py
cd ..

# Start the API server → http://localhost:3001
pipenv run flask run --host=0.0.0.0 --port=3001
```

---

### 3. Frontend setup

```bash
# Install Node dependencies
npm install

# Start the Vite dev server → http://localhost:3000
npm run dev
```

---

### 4. Daily workflow (already set up)

```bash
# Terminal 1 — Backend
pipenv run flask run --host=0.0.0.0 --port=3001

# Terminal 2 — Frontend
npm run dev
```

---

### 5. Full reset (start from scratch)

```bash
rm -f /tmp/playerlink_dev.db                                  # Delete the DB
pipenv run flask db upgrade                                    # Recreate all tables
cd src && pipenv run python seed.py && cd ..                   # Reseed data
```

---

### 6. Production build

```bash
# Build React app into /public (served by Flask in production)
npm run build
```

---

## 🗂️ Project Structure

```
├── src/
│   ├── app.py                  # Flask application factory
│   ├── wsgi.py                 # WSGI entry point (Gunicorn)
│   ├── seed.py                 # DB seeder (test data)
│   └── api/
│       ├── models.py           # SQLAlchemy ORM models
│       ├── auth.py             # Auth routes (register, login, verify, reset)
│       ├── routes.py           # Main API endpoints
│       ├── chat.py             # Chat endpoints
│       ├── blocks.py           # Block/report endpoints
│       ├── admin.py            # Flask-Admin setup
│       ├── commands.py         # Flask CLI commands
│       ├── utils.py            # Helpers & custom exceptions
│       └── mail/               # Email sending logic (mailer.py)
└── src/front/
    ├── main.jsx                # React entry point
    ├── routes.jsx              # React Router v6 configuration
    ├── store.js                # Global state (useReducer + Context)
    ├── hooks/                  # Custom React hooks
    ├── pages/
    │   ├── Home.jsx            # Landing page
    │   ├── Chat.jsx            # Conversation view
    │   ├── Chats.jsx           # Chat list
    │   └── Privateviews/       # Authenticated views
    │       ├── Profile.jsx
    │       ├── Search-mate.jsx
    │       ├── Your-matches.jsx
    │       ├── Find-games.jsx
    │       └── Settings.jsx
    ├── components/             # Reusable UI components
    │   └── profile/            # Profile tab components
    └── services/               # API client functions
```

---

## 🌐 API Endpoints (summary)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | ❌ | Create account |
| POST | `/api/login` | ❌ | Get JWT token |
| GET | `/api/token` | ✅ | Validate token |
| GET | `/api/private` | ✅ | Get current user info |
| PUT | `/api/profiles/<user_id>` | ✅ | Update profile |
| GET | `/api/profiles/profiles_to_explore/<id>` | ✅ | Profiles to swipe |
| POST | `/api/likes/<liker>/<liked>` | ✅ | Like a user (auto-match) |
| POST | `/api/rejects/<rejector>/<rejected>` | ✅ | Reject a user |
| GET | `/api/matches/user/<user_id>` | ✅ | Get your matches |
| POST | `/api/reviews/<author>/<receiver>` | ✅ | Leave a star review |
| GET | `/api/chat/messages/<match_id>` | ✅ | Get chat messages |
| POST | `/api/chat/messages/<match_id>` | ✅ | Send a message |
| POST | `/api/ai/recommend` | ✅ | AI game recommendations |
| POST | `/api/check_mail` | ❌ | Request password reset email |
| PUT | `/api/password_update` | ✅ | Set new password after reset |
| GET | `/api/verify-email` | ❌ | Verify email from link |
| POST | `/api/blocks/<user_id>` | ✅ | Block a user |

---

## 🤝 Contributors

| Name | Role |
|---|---|
| [Antonino Lazaro](https://github.com/LazaroAntonino) | Full Stack Developer |

---

<p align="center">Made with ❤️ and way too many late nights ☕</p>
