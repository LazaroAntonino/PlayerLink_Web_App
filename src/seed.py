from app import app, db
from datetime import datetime, timezone, timedelta
from api.models import User, Profile, Review, Game, Match, Reject, Like, ChatMessage
from api.utils import hash_password

SEED_DOMAIN = "seed.local"

GAMES_CATALOG = [
    ("Valorant",           "https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg"),
    ("CS2",                "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg"),
    ("Apex Legends",       "https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg"),
    ("Fortnite",           "https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg"),
    ("Elden Ring",         "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg"),
    ("The Witcher 3",      "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg"),
    ("Baldur's Gate 3",    "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg"),
    ("Hades",              "https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg"),
    ("Stardew Valley",     "https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg"),
    ("Minecraft",          "https://cdn.akamai.steamstatic.com/steam/apps/1672970/header.jpg"),
    ("Rocket League",      "https://cdn.akamai.steamstatic.com/steam/apps/252950/header.jpg"),
    ("Celeste",            "https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg"),
    ("Halo Infinite",      "https://cdn.akamai.steamstatic.com/steam/apps/1240440/header.jpg"),
    ("Forza Horizon 5",    "https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg"),
    ("EA SPORTS FC 25",    "https://cdn.akamai.steamstatic.com/steam/apps/2669320/header.jpg"),
    ("League of Legends",  "https://cdn.akamai.steamstatic.com/steam/apps/2801830/header.jpg"),
    ("GTA V",              "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg"),
    ("Cyberpunk 2077",     "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg"),
    ("Helldivers 2",       "https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg"),
    ("Lethal Company",     "https://cdn.akamai.steamstatic.com/steam/apps/1966720/header.jpg"),
    ("Dead by Daylight",   "https://cdn.akamai.steamstatic.com/steam/apps/381210/header.jpg"),
    ("Phasmophobia",       "https://cdn.akamai.steamstatic.com/steam/apps/739630/header.jpg"),
    ("Civilization VI",    "https://cdn.akamai.steamstatic.com/steam/apps/289070/header.jpg"),
    ("Among Us",           "https://cdn.akamai.steamstatic.com/steam/apps/945360/header.jpg"),
]

SAMPLE_CHAT = [
    "Hey! Ready to play tonight?",
    "Sure, what time works for you?",
    "Let's do a warm-up first.",
    "Nice play on that last round!",
    "Can you join voice chat?",
    "Thanks for the invite, had a blast!",
    "GG! Rematch tomorrow?",
    "Absolutely, see you then!",
]

ZODIACS   = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
LOCATIONS = ["Madrid","Barcelona","Valencia","Sevilla","Bilbao","Granada","Zaragoza","Malaga","Alicante","Murcia"]
NAMES = [
    "Alejandro Garcia","Sofia Martinez","Pablo Lopez","Lucia Sanchez",
    "Daniel Perez","Carmen Rodriguez","Adrian Gonzalez","Marta Fernandez",
    "Javier Torres","Laura Diaz","Sergio Ruiz","Ana Moreno",
    "Carlos Jimenez","Ines Alvarez","Marcos Romero","Elena Navarro",
    "Hugo Dominguez","Valeria Ramos","Oscar Suarez","Nerea Vargas",
]
NICKS = [
    "xAlejx","sofiagamer","pabloFPS","luciadark","dani_rpg",
    "carmencraft","adrishot","martacozy","javi_racer","lauraMMO",
    "sergisniper","ana_indie","carlos7","inesguild","markosaves",
    "elenaXP","hugoplay","valeriabg3","oskarwar","nereaquest",
]
BIOS = [
    "Llevo jugando desde los 8 anos. FPS y RPG son mi vida.",
    "Siempre buscando squad para ranked. Main support.",
    "Speedrunner casual. Cualquier juego, cualquier hora.",
    "Gamer de noche. Amante de los juegos de terror y cozy.",
    "Veterano de los MMO, raid leader con experiencia.",
    "Nueva en el mundo gamer, aprendiendo rapido.",
    "Coleccionista de platinos. La paciencia es mi superpoder.",
    "Co-op o nada. Los mejores momentos son en equipo.",
    "Streamer amateur. Disfruto mas del journey que del meta.",
    "Juego todo lo que caiga en mis manos. Sin generos favoritos.",
    "Ex-competitivo de CS, ahora mas casual y relajado.",
    "Farmeo de recursos como hobby. No me juzgues.",
    "Lore lover. Leo cada linea de dialogo.",
    "Builder creativo en cualquier sandbox que exista.",
    "Battle royale addict. Top 1 o me quedo intentando.",
    "Fan de las novelas visuales y los JRPGs largos.",
    "Gamer social, lo mejor es chatear mientras jugamos.",
    "Purista del teclado y raton. Los mandos no son para mi.",
    "Indie dev y gamer. Aprecio cada pixel con carino.",
    "Juego para desconectar. Buena vibra siempre.",
]
REVIEW_COMMENTS = [
    "Muy buen jugador, siempre comunicativo.",
    "Excelente en equipo, lo recomiendo.",
    "Buen nivel, aprende rapido.",
    "Se nota la experiencia, gran companero.",
    "Muy amable y paciente, genial jugar con el.",
]

# Tags válidas para el campo `preferences` — DEBEN coincidir con las opciones
# del GamingPreferencesModal (frontend) y los IDs del onboarding (Step3/Step4)
# para que al editar el perfil los chips aparezcan marcados correctamente.
PREFERENCE_TAGS = [
    # Platforms (= Step3_Platforms.PLATFORMS)
    "PC", "PS5", "Xbox", "Switch", "Mobile", "VR",
    # Play style (= Step4_PlayStyle.STYLES ids)
    "Competitivo", "Casual", "Roleplay", "Speedrun", "Cooperativo", "Explorador",
    # Vibes (extras del modal del Profile)
    "Tryhard", "Chill", "Adventurer", "Pro", "Creative",
    "MOBA", "Strategic", "Conversational", "Horror", "Survival",
]


def main():
    with app.app_context():
        db.create_all()

        # Limpiar seed anterior
        for u in db.session.query(User).filter(User.email.like(f"%@{SEED_DOMAIN}")).all():
            db.session.delete(u)
        db.session.commit()

        # 1. Usuarios
        credentials = []
        users_to_add = []
        for i in range(1, 21):
            email = f"user{i}@{SEED_DOMAIN}"
            pwd   = f"Password{i:02d}!"
            users_to_add.append(User(email=email, password=hash_password(pwd), email_verified=True))
            credentials.append((email, pwd))
        db.session.add_all(users_to_add)
        db.session.commit()

        seeded = db.session.query(User).filter(User.email.like(f"%@{SEED_DOMAIN}")).order_by(User.id).all()
        n = len(seeded)
        user_ids = [u.id for u in seeded]

        # 2. Perfiles
        profile_by_uid = {}
        for idx, user in enumerate(seeded):
            i = idx + 1
            photo = f"photo{i}" if i <= 9 else f"https://i.pravatar.cc/300?img={i+10}"
            # Mezcla 1 platform + 1 play style + 1 vibe (variando por user) →
            # mismo formato que produce el onboarding. NUNCA nombres de juegos.
            platform   = PREFERENCE_TAGS[(i * 3) % 6]                # PC, PS5, Xbox...
            play_style = PREFERENCE_TAGS[6 + ((i * 2) % 6)]          # Competitivo, Casual...
            vibe       = PREFERENCE_TAGS[12 + (i % 10)]              # Tryhard, Chill, MOBA...
            prefs = f"{platform}, {play_style} and {vibe}."
            p = Profile(
                user_id=user.id,
                gender="Male" if i % 2 == 1 else "Female",
                age=18 + (i % 20),
                name=NAMES[idx],
                discord=f"{NICKS[idx]}#{1000+i}",
                preferences=prefs,
                zodiac=ZODIACS[idx % len(ZODIACS)],
                location=LOCATIONS[idx % len(LOCATIONS)],
                nick_name=NICKS[idx],
                bio=BIOS[idx],
                language="Spanish" if i % 2 == 0 else "English",
                steam_id=f"steam_seed_{i}",
                photo=photo,
            )
            db.session.add(p)
            profile_by_uid[user.id] = p
        db.session.commit()

        # 3. Juegos
        for user in seeded:
            base  = user.id
            count = 2 + (base % 3)
            for k in range(count):
                title, img = GAMES_CATALOG[(base + k) % len(GAMES_CATALOG)]
                db.session.add(Game(
                    profile_id=profile_by_uid[user.id].id,
                    game_title=title,
                    game_image=img,
                    game_hoursPlayed=10 * ((base + k) % 40 + 1),
                ))
        db.session.commit()

        # 4. Matches
        for idx in range(n):
            db.session.add(Match(
                user1_id=user_ids[idx],
                user2_id=user_ids[(idx + 1) % n],
                created_at=datetime.now(timezone.utc) - timedelta(days=(n - idx)),
            ))
        for ai, bi in [(0,5),(2,8),(4,12),(6,15),(1,10),(3,17)]:
            db.session.add(Match(
                user1_id=user_ids[ai],
                user2_id=user_ids[bi],
                created_at=datetime.now(timezone.utc) - timedelta(days=ai+1),
            ))
        db.session.commit()

        # 5. Chat
        all_matches = db.session.query(Match).filter(Match.user1_id.in_(user_ids)).all()
        for m in all_matches[:15]:
            for j in range(4):
                sender = m.user1_id if j % 2 == 0 else m.user2_id
                db.session.add(ChatMessage(
                    match_id=m.id,
                    sender_id=sender,
                    content=SAMPLE_CHAT[(m.id + j) % len(SAMPLE_CHAT)],
                    created_at=datetime.now(timezone.utc) - timedelta(hours=8-j),
                    read=(j < 3),
                ))
        db.session.commit()

        # 6. Likes
        for idx, uid in enumerate(user_ids):
            for offset in [1, 3]:
                db.session.add(Like(liker_id=uid, liked_id=user_ids[(idx+offset)%n]))
        db.session.commit()

        # 7. Rejects
        for idx in range(0, n, 3):
            db.session.add(Reject(
                rejector_id=user_ids[idx],
                rejected_id=user_ids[(idx+2)%n],
                created_at=datetime.now(timezone.utc) - timedelta(days=idx+1),
            ))
        db.session.commit()

        # 8. Reviews
        for idx, uid in enumerate(user_ids):
            for j in range(1 + idx % 3):
                db.session.add(Review(
                    user_id=uid,
                    author_id=user_ids[(idx+j+1)%n],
                    stars=3 + (idx+j)%3,
                    comment=REVIEW_COMMENTS[(idx+j)%len(REVIEW_COMMENTS)],
                ))
        db.session.commit()

        # Credenciales
        print("\n✅ Seeder completado.\n")
        print(f"  {'EMAIL':<30}  CONTRASENA")
        print(f"  {'-'*30}  {'-'*12}")
        for email, pwd in credentials:
            print(f"  {email:<30}  {pwd}")
        print()


if __name__ == "__main__":
    main()
