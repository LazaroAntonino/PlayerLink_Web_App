/**
* Catálogo de juegos de PlayerLink
* Imágenes: Steam CDN (gratuito, sin API key, estable)
* Formato URL: https://cdn.akamai.steamstatic.com/steam/apps/{STEAM_ID}/header.jpg
*
* Para juegos sin Steam ID se usa Wikipedia como fallback.
*/


export const GAMES_CATALOG = [
 // ══ FPS / TACTICAL ══
 // Valorant: no está en Steam — Twitch box art CDN (stable, no auth)
 { title: "Valorant",                    image: "https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg" },
 { title: "CS2",                         image: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg" },
 { title: "Apex Legends",                image: "https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg" },
 { title: "Overwatch 2",                 image: "https://cdn.akamai.steamstatic.com/steam/apps/2357570/header.jpg" },
 { title: "Rainbow Six Siege",           image: "https://cdn.akamai.steamstatic.com/steam/apps/359550/header.jpg" },
 { title: "Battlefield 2042",            image: "https://cdn.akamai.steamstatic.com/steam/apps/1517290/header.jpg" },
 { title: "Halo Infinite",               image: "https://cdn.akamai.steamstatic.com/steam/apps/1240440/header.jpg" },
 { title: "Hunt: Showdown",              image: "https://cdn.akamai.steamstatic.com/steam/apps/594650/header.jpg" },
 // Escape from Tarkov: no está en Steam (launcher BSG)
 { title: "Escape from Tarkov",          image: "https://static-cdn.jtvnw.net/ttv-boxart/491931-285x380.jpg" },
 { title: "PUBG",                        image: "https://cdn.akamai.steamstatic.com/steam/apps/578080/header.jpg" },
 { title: "Team Fortress 2",             image: "https://cdn.akamai.steamstatic.com/steam/apps/440/header.jpg" },
 { title: "Splitgate",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/677620/header.jpg" },


 // ══ MOBA ══
 { title: "League of Legends",           image: "https://cdn.akamai.steamstatic.com/steam/apps/2801830/header.jpg" },
 { title: "Dota 2",                      image: "https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg" },
 { title: "Smite",                       image: "https://cdn.akamai.steamstatic.com/steam/apps/386360/header.jpg" },
 // Heroes of the Storm: no está en Steam (Battle.net)
 { title: "Heroes of the Storm",         image: "https://mir-s3-cdn-cf.behance.net/projects/404/dc37e747692331.Y3JvcCw4MDUsNjMwLDE5Nyww.jpg" },


 // ══ BATTLE ROYALE ══
 // Fortnite: no está en Steam (Epic exclusivo)
 { title: "Fortnite",                    image: "https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg" },
 { title: "Call of Duty: Warzone",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/1962663/header.jpg" },
 { title: "Fall Guys",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/1097150/header.jpg" },
 { title: "Naraka: Bladepoint",          image: "https://cdn.akamai.steamstatic.com/steam/apps/1203220/header.jpg" },


 // ══ RPG ══
 { title: "Elden Ring",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg" },
 { title: "Cyberpunk 2077",              image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg" },
 { title: "The Witcher 3",               image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg" },
 { title: "Dark Souls III",              image: "https://cdn.akamai.steamstatic.com/steam/apps/374320/header.jpg" },
 { title: "Baldur's Gate 3",             image: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg" },
 { title: "God of War",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg" },
 { title: "Hollow Knight",               image: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg" },
 { title: "Hades",                       image: "https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg" },
 { title: "Hades II",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/1801859/header.jpg" },
 { title: "Path of Exile",               image: "https://cdn.akamai.steamstatic.com/steam/apps/238960/header.jpg" },
 { title: "Diablo IV",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/2344520/header.jpg" },
 { title: "Monster Hunter: World",       image: "https://cdn.akamai.steamstatic.com/steam/apps/582010/header.jpg" },
 { title: "Monster Hunter Rise",         image: "https://cdn.akamai.steamstatic.com/steam/apps/1446780/header.jpg" },
 { title: "Final Fantasy XIV",           image: "https://cdn.akamai.steamstatic.com/steam/apps/39210/header.jpg" },
 { title: "Final Fantasy XVI",           image: "https://cdn.akamai.steamstatic.com/steam/apps/2515010/header.jpg" },
 { title: "Dragon Age: Origins",         image: "https://cdn.akamai.steamstatic.com/steam/apps/47810/header.jpg" },
 { title: "Skyrim",                      image: "https://cdn.akamai.steamstatic.com/steam/apps/489830/header.jpg" },
 { title: "Fallout 4",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/377160/header.jpg" },
 { title: "Sekiro",                      image: "https://cdn.akamai.steamstatic.com/steam/apps/814380/header.jpg" },
 { title: "Bloodborne",                  image: "https://upload.wikimedia.org/wikipedia/en/6/65/Bloodborne_Cover_Artwork.jpg" },
 { title: "Persona 5 Royal",             image: "https://cdn.akamai.steamstatic.com/steam/apps/1687950/header.jpg" },
 { title: "Tales of Arise",              image: "https://cdn.akamai.steamstatic.com/steam/apps/1325860/header.jpg" },
 { title: "Genshin Impact",              image: "https://cdn.akamai.steamstatic.com/steam/apps/1971870/header.jpg" },
 { title: "Honkai: Star Rail",           image: "https://cdn.akamai.steamstatic.com/steam/apps/1478070/header.jpg" },
 { title: "Wuthering Waves",             image: "https://cdn.akamai.steamstatic.com/steam/apps/2374990/header.jpg" },


 // ══ ACCIÓN / AVENTURA ══
 { title: "Red Dead Redemption 2",       image: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg" },
 { title: "GTA V",                       image: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg" },
 { title: "Assassin's Creed Odyssey",    image: "https://cdn.akamai.steamstatic.com/steam/apps/812140/header.jpg" },
 { title: "Assassin's Creed Valhalla",   image: "https://cdn.akamai.steamstatic.com/steam/apps/2208920/header.jpg" },
 { title: "Spider-Man Remastered",       image: "https://cdn.akamai.steamstatic.com/steam/apps/1817070/header.jpg" },
 { title: "Ghost of Tsushima",           image: "https://cdn.akamai.steamstatic.com/steam/apps/2215430/header.jpg" },
 { title: "Horizon Zero Dawn",           image: "https://cdn.akamai.steamstatic.com/steam/apps/1151640/header.jpg" },
 { title: "Death Stranding",             image: "https://cdn.akamai.steamstatic.com/steam/apps/1190460/header.jpg" },
 { title: "Batman: Arkham Knight",       image: "https://cdn.akamai.steamstatic.com/steam/apps/208650/header.jpg" },
 { title: "Control",                     image: "https://cdn.akamai.steamstatic.com/steam/apps/870780/header.jpg" },
 { title: "Alan Wake 2",                 image: "https://cdn.akamai.steamstatic.com/steam/apps/1874011/header.jpg" },
 { title: "Kena: Bridge of Spirits",     image: "https://cdn.akamai.steamstatic.com/steam/apps/1183030/header.jpg" },


 // ══ SURVIVAL / SANDBOX ══
 { title: "Minecraft",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/1672970/header.jpg" },
 { title: "Terraria",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg" },
 { title: "Valheim",                     image: "https://cdn.akamai.steamstatic.com/steam/apps/892970/header.jpg" },
 { title: "Rust",                        image: "https://cdn.akamai.steamstatic.com/steam/apps/252490/header.jpg" },
 { title: "ARK: Survival Evolved",       image: "https://cdn.akamai.steamstatic.com/steam/apps/346110/header.jpg" },
 { title: "The Forest",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/242760/header.jpg" },
 { title: "Subnautica",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/264710/header.jpg" },
 { title: "No Man's Sky",                image: "https://cdn.akamai.steamstatic.com/steam/apps/275850/header.jpg" },
 { title: "Palworld",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/1623730/header.jpg" },
 { title: "Satisfactory",                image: "https://cdn.akamai.steamstatic.com/steam/apps/526870/header.jpg" },
 { title: "Factorio",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/427520/header.jpg" },
 { title: "Stardew Valley",              image: "https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg" },
 { title: "RimWorld",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/294100/header.jpg" },
 { title: "Green Hell",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/815370/header.jpg" },


 // ══ ESTRATEGIA ══
 { title: "Age of Empires IV",           image: "https://cdn.akamai.steamstatic.com/steam/apps/1466860/header.jpg" },
 { title: "Civilization VI",             image: "https://cdn.akamai.steamstatic.com/steam/apps/289070/header.jpg" },
 { title: "Total War: Warhammer III",    image: "https://cdn.akamai.steamstatic.com/steam/apps/1142710/header.jpg" },
 // StarCraft II: solo Battle.net, no Steam
 { title: "StarCraft II",                image: "https://static-cdn.jtvnw.net/ttv-boxart/490422-285x380.jpg" },
 { title: "Crusader Kings III",          image: "https://cdn.akamai.steamstatic.com/steam/apps/1158310/header.jpg" },
 { title: "Hearts of Iron IV",           image: "https://cdn.akamai.steamstatic.com/steam/apps/394360/header.jpg" },
 { title: "XCOM 2",                      image: "https://cdn.akamai.steamstatic.com/steam/apps/268500/header.jpg" },


 // ══ DEPORTES / RACING ══
 { title: "EA SPORTS FC™ 25",            image: "https://cdn.akamai.steamstatic.com/steam/apps/2669320/header.jpg" },
 { title: "Rocket League",               image: "https://cdn.akamai.steamstatic.com/steam/apps/252950/header.jpg" },
 { title: "F1 24",                       image: "https://cdn.akamai.steamstatic.com/steam/apps/2440510/header.jpg" },
 { title: "Forza Horizon 5",             image: "https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg" },
 { title: "NBA 2K25",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/2528340/header.jpg" },
 { title: "Gran Turismo 7",              image: "https://www.gtplanet.net/wp-content/uploads/2020/06/gran-turismo-7-art.jpg" },
 { title: "EA SPORTS™ FIFA 23",          image: "https://cdn.akamai.steamstatic.com/steam/apps/1811260/header.jpg" },
 { title: "EA SPORTS FC™ 24",            image: "https://cdn.akamai.steamstatic.com/steam/apps/2195250/header.jpg" },






 // ══ HORROR / TERROR ══
 { title: "Resident Evil 4 Remake",      image: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg" },
 { title: "Dead by Daylight",            image: "https://cdn.akamai.steamstatic.com/steam/apps/381210/header.jpg" },
 { title: "Phasmophobia",                image: "https://cdn.akamai.steamstatic.com/steam/apps/739630/header.jpg" },
 { title: "Outlast",                     image: "https://cdn.akamai.steamstatic.com/steam/apps/238320/header.jpg" },
 { title: "Alien: Isolation",            image: "https://cdn.akamai.steamstatic.com/steam/apps/214490/header.jpg" },
 { title: "Amnesia: The Bunker",         image: "https://cdn.akamai.steamstatic.com/steam/apps/1944430/header.jpg" },
 { title: "Little Nightmares II",        image: "https://cdn.akamai.steamstatic.com/steam/apps/860510/header.jpg" },


 // ══ INDIE / PLATAFORMAS ══
 { title: "Celeste",                     image: "https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg" },
 { title: "Cuphead",                     image: "https://cdn.akamai.steamstatic.com/steam/apps/268910/header.jpg" },
 { title: "Dead Cells",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/588650/header.jpg" },
 { title: "Undertale",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/391540/header.jpg" },
 { title: "Ori and the Will of the Wisps", image: "https://cdn.akamai.steamstatic.com/steam/apps/1057090/header.jpg" },
 { title: "Disco Elysium",               image: "https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg" },
 { title: "Return of the Obra Dinn",     image: "https://cdn.akamai.steamstatic.com/steam/apps/653530/header.jpg" },
 { title: "Inscryption",                 image: "https://cdn.akamai.steamstatic.com/steam/apps/1092790/header.jpg" },
 { title: "Slay the Spire",              image: "https://cdn.akamai.steamstatic.com/steam/apps/646570/header.jpg" },
 { title: "Among Us",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/945360/header.jpg" },
 { title: "Pico Park",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/1509960/header.jpg" },


 // ══ MMO ══
 // World of Warcraft: no está en Steam (Battle.net)
 { title: "World of Warcraft",           image: "https://static-cdn.jtvnw.net/ttv-boxart/18122-285x380.jpg" },
 { title: "Lost Ark",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/1599340/header.jpg" },
 { title: "New World",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/1063730/header.jpg" },
 { title: "Guild Wars 2",                image: "https://cdn.akamai.steamstatic.com/steam/apps/1284210/header.jpg" },


 // ══ SIMULACIÓN ══
 { title: "Microsoft Flight Simulator",  image: "https://cdn.akamai.steamstatic.com/steam/apps/1250410/header.jpg" },
 { title: "Euro Truck Simulator 2",      image: "https://cdn.akamai.steamstatic.com/steam/apps/227300/header.jpg" },
 { title: "Cities: Skylines",            image: "https://cdn.akamai.steamstatic.com/steam/apps/255710/header.jpg" },
 { title: "The Sims 4",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/1222670/header.jpg" },
 { title: "Two Point Hospital",          image: "https://cdn.akamai.steamstatic.com/steam/apps/535930/header.jpg" },
 { title: "Tabletop Simulator",          image: "https://cdn.akamai.steamstatic.com/steam/apps/286160/header.jpg" },




 // ══ FIGHTING ══
 { title: "Street Fighter 6",            image: "https://cdn.akamai.steamstatic.com/steam/apps/1794960/header.jpg" },
 { title: "Tekken 8",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/1778820/header.jpg" },
 // Mortal Kombat 1: Steam ID 1971870 es Genshin Impact — Twitch CDN
 { title: "Mortal Kombat 1",             image: "https://static-cdn.jtvnw.net/ttv-boxart/1902608808-285x380.jpg" },
 { title: "Dragon Ball FighterZ",        image: "https://cdn.akamai.steamstatic.com/steam/apps/678950/header.jpg" },


 // ══ MULTIJUGADOR COOP ══
 { title: "Deep Rock Galactic",          image: "https://cdn.akamai.steamstatic.com/steam/apps/548430/header.jpg" },
 { title: "It Takes Two",                image: "https://cdn.akamai.steamstatic.com/steam/apps/1426210/header.jpg" },
 { title: "Sea of Thieves",              image: "https://cdn.akamai.steamstatic.com/steam/apps/1172620/header.jpg" },
 { title: "Back 4 Blood",                image: "https://cdn.akamai.steamstatic.com/steam/apps/924970/header.jpg" },
 { title: "Helldivers 2",                image: "https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg" },
 { title: "Lethal Company",              image: "https://cdn.akamai.steamstatic.com/steam/apps/1966720/header.jpg" },
 { title: "Warframe",                    image: "https://cdn.akamai.steamstatic.com/steam/apps/230410/header.jpg" },
 { title: "Destiny 2",                   image: "https://cdn.akamai.steamstatic.com/steam/apps/1085660/header.jpg" },
 { title: "Remnant II",                  image: "https://cdn.akamai.steamstatic.com/steam/apps/1282100/header.jpg" },
];


// Para búsqueda rápida por título (O(1))
export const GAMES_BY_TITLE = Object.fromEntries(
 GAMES_CATALOG.map((g) => [g.title.toLowerCase(), g])
);


// Para react-select — cada opción incluye la imagen
export const GAMES_OPTIONS = GAMES_CATALOG.map((g) => ({
 value: g.title,
 label: g.title,
 image: g.image,
}));


/**
* Obtiene la imagen de un juego por título.
* Devuelve null si no está en el catálogo.
* @param {string} title
* @returns {string|null}
*/
export const getGameImage = (title) => {
 if (!title) return null;
 return GAMES_BY_TITLE[title.toLowerCase()]?.image ?? null;
};



