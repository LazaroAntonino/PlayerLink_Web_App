
import click
from api.models import db, User, Profile, Game, Like, Match
from api.utils import hash_password

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):
    
    """ 
    This is an example command "insert-test-users" that you can run from the command line
    by typing: $ flask insert-test-users 5
    Note: 5 is the number of users to add
    """
    @app.cli.command("insert-test-users") # name of our command
    @click.argument("count") # argument of out command
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.password = hash_password("Test1234!")
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        pass

    @app.cli.command("seed-match-users")
    @click.argument("target_user_id", type=int)
    def seed_match_users(target_user_id):
        """Creates 8 fake gamer users who all like the target user.
        Run: flask seed-match-users <your_user_id>
        Log in and like them back to trigger the match animation.
        """
        target = User.query.get(target_user_id)
        if not target:
            print(f"ERROR: User with id {target_user_id} not found.")
            return

        fake_gamers = [
            {"email":"xXshadowblade99Xx@playerlink.dev","nick_name":"ShadowBlade99","name":"Carlos","age":23,"gender":"Male","location":"Madrid, Spain","bio":"FPS player by day, RPG enthusiast by night. Looking for a duo who won't rage quit.","photo":"photo2","preferences":"Competitive, Casual, Co-op","language":"Spanish, English","zodiac":"Scorpio","discord":"ShadowBlade#4521","steam_id":"shadowblade99","games":[{"title":"Valorant","image":"","hours":1200},{"title":"Elden Ring","image":"","hours":340},{"title":"Cyberpunk 2077","image":"","hours":180}]},
            {"email":"neonqueengaming@playerlink.dev","nick_name":"NeonQueen","name":"Laura","age":21,"gender":"Female","location":"Barcelona, Spain","bio":"Speedrunner and JRPG collector. If you beat my high score, we can be friends.","photo":"photo5","preferences":"Speedrunning, JRPG, Solo, Co-op","language":"Spanish, Catalan, English","zodiac":"Aquarius","discord":"NeonQueen#7732","steam_id":"neonqueengaming","games":[{"title":"Hollow Knight","image":"","hours":430},{"title":"Final Fantasy XVI","image":"","hours":290},{"title":"Celeste","image":"","hours":110}]},
            {"email":"the_iron_forge@playerlink.dev","nick_name":"IronForge","name":"Miguel","age":27,"gender":"Male","location":"Valencia, Spain","bio":"MMO veteran. 15 years in WoW and still raiding. Need a healer main.","photo":"photo3","preferences":"MMO, Strategy, Competitive","language":"Spanish, English","zodiac":"Taurus","discord":"IronForge#0001","steam_id":"the_ironforge","games":[{"title":"World of Warcraft","image":"","hours":4200},{"title":"Path of Exile","image":"","hours":800},{"title":"Age of Empires IV","image":"","hours":220}]},
            {"email":"pixelwitch.plays@playerlink.dev","nick_name":"PixelWitch","name":"Sofia","age":24,"gender":"Female","location":"Seville, Spain","bio":"Indie dev and streamer. I play everything from cozy games to brutally hard platformers.","photo":"photo7","preferences":"Indie, Casual, Platformer, Co-op","language":"Spanish, English, French","zodiac":"Gemini","discord":"PixelWitch#3399","steam_id":"pixelwitch","games":[{"title":"Stardew Valley","image":"","hours":600},{"title":"Hades","image":"","hours":350},{"title":"Disco Elysium","image":"","hours":80}]},
            {"email":"rampage.sniper@playerlink.dev","nick_name":"RampageSniper","name":"Alejandro","age":19,"gender":"Male","location":"Bilbao, Spain","bio":"Grinder mindset. Top 500 Overwatch. Looking for someone to climb ranked with me.","photo":"photo4","preferences":"FPS, Competitive, Ranked","language":"Spanish, English","zodiac":"Aries","discord":"RampageSniper#5588","steam_id":"rampagesniper","games":[{"title":"Overwatch 2","image":"","hours":2100},{"title":"CS2","image":"","hours":950},{"title":"Apex Legends","image":"","hours":600}]},
            {"email":"mystic.mage.gamer@playerlink.dev","nick_name":"MysticMage","name":"Elena","age":26,"gender":"Female","location":"Zaragoza, Spain","bio":"Lore nerd and theorycrafting queen. If you skip cutscenes we cannot be friends.","photo":"photo6","preferences":"RPG, Story-driven, Co-op","language":"Spanish, English, German","zodiac":"Virgo","discord":"MysticMage#2244","steam_id":"mysticmage","games":[{"title":"Baldur's Gate 3","image":"","hours":780},{"title":"The Witcher 3","image":"","hours":560},{"title":"Dragon Age Origins","image":"","hours":300}]},
            {"email":"turbo_techno_gamer@playerlink.dev","nick_name":"TurboTechno","name":"David","age":22,"gender":"Male","location":"Malaga, Spain","bio":"Rhythm game god and retro collector. 1000 hours in Beat Saber. Let's vibe.","photo":"photo8","preferences":"Rhythm, Retro, Casual, Competitive","language":"Spanish, English, Japanese","zodiac":"Libra","discord":"TurboTechno#8877","steam_id":"turbotechno","games":[{"title":"Beat Saber","image":"","hours":1000},{"title":"Sonic Frontiers","image":"","hours":120},{"title":"Cuphead","image":"","hours":90}]},
            {"email":"ghost.protocol.gg@playerlink.dev","nick_name":"GhostProtocol","name":"Andrea","age":25,"gender":"Female","location":"Alicante, Spain","bio":"Stealth, tactics, and a good headset. Former esports coach looking for passionate players.","photo":"photo9","preferences":"Tactical, Stealth, Competitive, Co-op","language":"Spanish, English, Italian","zodiac":"Capricorn","discord":"GhostProtocol#1122","steam_id":"ghostprotocolgg","games":[{"title":"Rainbow Six Siege","image":"","hours":1800},{"title":"Hitman 3","image":"","hours":140},{"title":"Deus Ex Mankind Divided","image":"","hours":180}]},
        ]

        created = 0
        liked = 0
        for gamer in fake_gamers:
            existing = User.query.filter_by(email=gamer["email"]).first()
            if existing:
                fake_user = existing
                print(f"  [SKIP] {gamer['nick_name']} already exists (id={fake_user.id})")
            else:
                fake_user = User(email=gamer["email"], password=hash_password("Test1234!"))
                db.session.add(fake_user)
                db.session.flush()
                profile = Profile(user_id=fake_user.id, nick_name=gamer["nick_name"], name=gamer["name"], age=gamer["age"], gender=gamer["gender"], location=gamer["location"], bio=gamer["bio"], photo=gamer["photo"], preferences=gamer["preferences"], language=gamer["language"], zodiac=gamer["zodiac"], discord=gamer["discord"], steam_id=gamer["steam_id"])
                db.session.add(profile)
                db.session.flush()
                for g in gamer["games"]:
                    db.session.add(Game(profile_id=profile.id, game_title=g["title"], game_image=g["image"], game_hoursPlayed=g["hours"]))
                created += 1
                print(f"  [OK] Created: {gamer['nick_name']} (id={fake_user.id})")
            existing_like = Like.query.filter_by(liker_id=fake_user.id, liked_id=target_user_id).first()
            if not existing_like:
                db.session.add(Like(liker_id=fake_user.id, liked_id=target_user_id))
                liked += 1
                print(f"  [LIKE] {gamer['nick_name']} liked user {target_user_id}")
            else:
                print(f"  [SKIP] {gamer['nick_name']} already liked user {target_user_id}")
        db.session.commit()
        print(f"\n==> Done! Created {created} new users, added {liked} likes to user {target_user_id}.")
        print(f"==> Log in and go to Search Mate to like them back and trigger the match animation!")
