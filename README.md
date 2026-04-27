<p align="center">
  <img src="src/front/assets/img/logos/logo-app.png" alt="PlayerLink Logo" width="120"/>
</p>

<h1 align="center">PlayerLink</h1>
<p align="center">Find your perfect gaming companion — swipe, match, and play together.</p>

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Bootstrap 5 |
| Backend | Python 3.13 + Flask + Flask-JWT-Extended |
| Database | PostgreSQL (production) / SQLite (local dev) |
| ORM | SQLAlchemy 2 + Flask-Migrate (Alembic) |
| Auth | JWT (Bearer token) + bcrypt password hashing |
| AI Chat | OpenAI GPT-3.5-turbo |
| Email | Flask-Mail (SMTP) |
| Deployment | Render.com |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- `pipenv` → `pip install pipenv`
- PostgreSQL (optional — SQLite works for local dev)

---

### 1. Clone & configure environment

```bash
git clone https://github.com/LazaroAntonino/PlayerLink_Web_App.git
cd PlayerLink_Web_App
cp .env.example .env
```

Open `.env` and fill in your values (see comments inside the file).

---

### 2. Backend setup

```bash
# Install Python dependencies
pipenv install

# Create and initialise the database
pipenv run upgrade        # runs: flask db upgrade

# (Optional) Seed test users
pipenv run flask insert-test-users 5

# Start the API server on http://localhost:3001
pipenv run start
```

> In development mode (`FLASK_DEBUG=1`) the root `/` shows an interactive sitemap of all endpoints.

---

### 3. Frontend setup

```bash
# Install Node dependencies
npm install

# Start the Vite dev server on http://localhost:3000
npm run start
```

---

### 4. Building for production

```bash
# Build the React app into /public (served by Flask in production)
npm run build
```

---

## 🗂️ Project Structure

```
├── src/
│   ├── app.py                  # Flask application factory
│   ├── wsgi.py                 # WSGI entry point (Gunicorn)
│   └── api/
│       ├── models.py           # SQLAlchemy ORM models
│       ├── routes.py           # All API endpoints
│       ├── admin.py            # Flask-Admin setup
│       ├── commands.py         # Flask CLI commands
│       ├── utils.py            # Helpers & custom exceptions
│       └── mail/               # Email sending logic
└── src/front/
    ├── main.jsx                # React entry point
    ├── routes.jsx              # React Router configuration
    ├── store.js                # Global state (useReducer)
    ├── hooks/                  # Custom React hooks
    ├── pages/                  # Page components
    │   ├── Home.jsx            # Landing page
    │   └── Privateviews/       # Authenticated views
    │       ├── Profile.jsx
    │       ├── Search-mate.jsx
    │       ├── Your-matches.jsx
    │       ├── Find-games.jsx  # AI chat
    │       └── Settings.jsx
    ├── components/             # Reusable UI components
    └── services/               # API client functions
```

---

## 🔑 Key Features

- **Register / Login** — JWT-based auth with bcrypt password hashing
- **Profile** — avatar selection, gaming preferences, Discord/Steam IDs, bio
- **Search a Mate** — swipe-style card deck; like → match when mutual
- **Your Matches** — grid of all matched players with detailed view & star reviews
- **Find Games** — AI-powered gaming recommendations via OpenAI GPT-3.5
- **Settings** — change email, change password, delete account
- **Password Reset** — email flow with secure JWT link

---

## 🌐 API Endpoints (summary)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | ❌ | Create account |
| POST | `/api/login` | ❌ | Get JWT token |
| GET | `/api/private` | ✅ | Get current user info |
| GET | `/api/token` | ✅ | Validate token |
| PUT | `/api/profiles/<user_id>` | ✅ | Update profile |
| GET | `/api/profiles/profiles_to_explore/<id>` | ✅ | Profiles to swipe |
| POST | `/api/likes/<liker>/<liked>` | ✅ | Like a user (auto-match) |
| POST | `/api/rejects/<rejector>/<rejected>` | ✅ | Reject a user |
| GET | `/api/matches/user/<user_id>` | ✅ | Get your matches |
| POST | `/api/reviews/<author>/<receiver>` | ❌ | Leave a star review |
| POST | `/api/chat` | ❌ | AI game recommendations |
| POST | `/api/check_mail` | ❌ | Request password reset email |
| PUT | `/api/password_update` | ✅ | Set new password after reset |

---

## 🤝 Contributors

Built with ❤️ as part of the [4Geeks Academy](https://4geeksacademy.com) Full Stack Bootcamp.
