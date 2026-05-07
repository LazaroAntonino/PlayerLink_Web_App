  
import os
import warnings
from flask_admin import Admin
from .models import db, User, Profile, Review,Game,Match,Reject,Like
from flask_admin.contrib.sqla import ModelView

def setup_admin(app):
    flask_app_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    env = "development" if os.environ.get("FLASK_DEBUG") == "1" else "production"
    if flask_app_key == 'sample key':
        if env == "production":
            raise RuntimeError("FLASK_APP_KEY must not be 'sample key' in production")
        else:
            warnings.warn("FLASK_APP_KEY is insecure default", RuntimeWarning)
    app.secret_key = flask_app_key
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

    
    # Add your models here, for example this is how we add a the User model to the admin
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Profile, db.session))
    admin.add_view(ModelView(Review, db.session))
    admin.add_view(ModelView(Game, db.session))
    admin.add_view(ModelView(Match, db.session))
    admin.add_view(ModelView(Reject, db.session))
    admin.add_view(ModelView(Like, db.session))






    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))