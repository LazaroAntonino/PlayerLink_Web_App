"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import warnings
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.extensions import limiter
from api.admin import setup_admin
from api.commands import setup_commands
from flask_jwt_extended import JWTManager
from api.mail.mail_config import mail
from datetime import timedelta
from flask_cors import CORS
from api.extensions import limiter
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../public/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# ── JWT ──────────────────────────────────────────────────────────────────────
jwt_secret = os.getenv('JWT_SECRET_KEY')
if jwt_secret is None:
    if ENV == "production":
        raise RuntimeError("JWT_SECRET_KEY must be set in production")
    else:
        warnings.warn("JWT_SECRET_KEY is not set — using insecure default for development", RuntimeWarning)
        jwt_secret = "dev-insecure-default"

app.config['JWT_SECRET_KEY'] = jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
jwt = JWTManager(app)

# ── Database ──────────────────────────────────────────────────────────────────
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Set CORS_ORIGINS in .env as a comma-separated list of allowed origins.
# Example: CORS_ORIGINS=https://app.example.com,https://www.example.com
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
CORS(api, origins=allowed_origins, supports_credentials=False)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
# NOTE: For production, replace the default in-memory storage with Redis:
#   export RATELIMIT_STORAGE_URI=redis://localhost:6379/0
limiter.init_app(app)

# Handler for 429 responses
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Too many requests"}), 429

# add the admin
setup_admin(app)

# add the commands
setup_commands(app)

# Add all endpoints from the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Handle/serialize errors like a JSON object
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_USERNAME")

mail.init_app(app)

@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
