# Migración SQLite → PostgreSQL · Prompts para Claude Sonnet (VS Code)

Este archivo contiene **7 prompts secuenciales** listos para copiar y pegar en Claude Sonnet dentro de VS Code, uno por cada fase de la migración del proyecto PlayerLink desde SQLite a un servidor PostgreSQL personalizado.

## Cómo usar este archivo

1. Abre cada prompt en orden (1 → 7).
2. Copia el bloque entero entre `--- PROMPT START ---` y `--- PROMPT END ---`.
3. Pégalo en una conversación nueva con Claude Sonnet en VS Code.
4. Espera a que termine y verifica el resultado esperado antes de pasar al siguiente.
5. Si una fase falla, **no avances** — comparte el error y resuelve antes de continuar.

## Parámetros fijos usados en todos los prompts

| Variable | Valor |
|---|---|
| `DATABASE_URL` destino | `postgresql://playerlink:Hbyv7ReaUdf9GfL7@192.168.1.11:3245/playerlink` |
| Servidor PostgreSQL | `192.168.1.11:3245` (LAN privada, sin SSL) |
| Última revisión Alembic esperada | `ff8ef1f575ca` |
| Email seed esperado | `user1@seed.local` ... `user20@seed.local` |
| Password seed | `Password01!` ... `Password20!` |

---

## PROMPT 1 — Verificación de conectividad al servidor PostgreSQL

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink** (Flask + SQLAlchemy + Alembic). Vamos a migrar la base de datos de SQLite a un servidor PostgreSQL personalizado del usuario. Esta es la **Fase 1 de 7**: verificación de conectividad.

**Tu tarea**

Antes de tocar ningún archivo del proyecto, debes confirmar que el servidor PostgreSQL responde, el puerto está abierto y las credenciales son válidas. NO modifiques nada del código en esta fase.

Ejecuta estos checks en orden y reporta el resultado claro de cada uno:

1. **Host alcanzable** (timeout 5s para no colgar la sesión):
   ```bash
   ping -c 2 -W 5 192.168.1.11
   ```

2. **Puerto abierto** (intenta `nc` primero, y si no existe usa el truco de bash):
   ```bash
   nc -vz -w 5 192.168.1.11 3245 || timeout 5 bash -c 'cat < /dev/tcp/192.168.1.11/3245' && echo "PUERTO OK"
   ```

3. **Clientes PostgreSQL disponibles localmente**:
   ```bash
   which psql pg_isready || echo "Sin clientes nativos — usaremos psycopg2"
   ```

4. **Si `pg_isready` existe**, comprueba el servidor:
   ```bash
   pg_isready -h 192.168.1.11 -p 3245 -U playerlink -t 5
   ```

5. **Si `psql` existe**, valida credenciales y permisos:
   ```bash
   PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "SELECT version();" -v ON_ERROR_STOP=1
   ```

6. **Fallback Python (si los pasos 4-5 no se pueden ejecutar)** usando el driver ya instalado:
   ```bash
   pipenv run python -c "import psycopg2; conn = psycopg2.connect('postgresql://playerlink:Hbyv7ReaUdf9GfL7@192.168.1.11:3245/playerlink', connect_timeout=5); print('PostgreSQL server_version:', conn.server_version); conn.close()"
   ```

**Criterios de éxito (todos deben cumplirse)**

- El host responde a ping (o, si ICMP está bloqueado, al menos el paso 2 confirma puerto abierto).
- El puerto 3245 está abierto.
- Las credenciales son válidas: `psql` o `psycopg2` devuelven la versión del servidor sin error de autenticación.

**Si algo falla**

- **DETENTE inmediatamente**. NO ejecutes ninguna otra fase.
- Reporta el error exacto al usuario.
- Posibles causas a sugerir: no está en la LAN/VPN, firewall, credenciales caducadas, puerto no estándar mal configurado, servidor caído.

**Archivos a modificar**: ninguno.

**No toques**: ningún archivo del proyecto. Esta fase es puramente diagnóstico.

**Resultado esperado al terminar**

Mensaje claro al usuario diciendo "Conectividad verificada, server_version: <X>. Listo para Fase 2" o, en caso de fallo, el error completo y una hipótesis de causa.

--- PROMPT END ---

---

## PROMPT 2 — Configurar DATABASE_URL y endurecer .gitignore

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink**. La Fase 1 (verificación de conectividad al servidor PostgreSQL `192.168.1.11:3245`) ya está hecha. Esta es la **Fase 2 de 7**: reapuntar la app de SQLite a PostgreSQL en `.env` y proteger `.env` para que no se filtre por git.

**Tu tarea**

1. **Lee `.env`** (archivo en la raíz del proyecto). Localiza la línea que empieza por `DATABASE_URL=` y reemplázala por:
   ```
   DATABASE_URL=postgresql://playerlink:Hbyv7ReaUdf9GfL7@192.168.1.11:3245/playerlink
   ```
   **Importante**: solo modifica esa línea. NO toques `FLASK_*`, `JWT_*`, `ANTHROPIC_API_KEY`, `MAIL_*`, `CLOUDINARY_*`, `FRONTEND_URL`, `VITE_BACKEND_URL`. Conserva los comentarios circundantes.

2. **Actualiza `.env.example`** (archivo en la raíz). Los cambios:
   - Localiza la línea `DATABASE_URL=sqlite:////tmp/playerlink.db` y comenta esa línea anteponiendo `#`.
   - Localiza la línea `# DATABASE_URL=postgresql://user:password@localhost:5432/playerlink` y descoméntala (quita el `#` inicial). Déjala así:
     ```
     DATABASE_URL=postgresql://user:password@host:port/playerlink
     ```
   - Si encuentras al inicio del archivo un bloque desordenado donde la sección de CORS está mezclada con URLs (las primeras ~9 líneas), reorganízalo con este orden: cabecera/comentario del template → Flask → Database → JWT → Anthropic → Email → URLs → CORS. Mantén todos los valores ejemplo intactos, solo reordena bloques completos.

3. **Endurece `.gitignore`** (archivo en la raíz). Busca la línea exacta `.venv` (debería estar cerca del final, en la sección "backend stuff"). Inmediatamente después de esa línea, inserta:
   ```
   
   # local environment files — never commit secrets
   .env
   .env.local
   .env.*.local
   ```
   **Importante**: NO elimines ni modifiques la línea existente `!.env.example` (debe permanecer para que el template sí se versione).

4. **Verifica** que `.env` no aparece como tracked en git:
   ```bash
   git status --short .env .env.example .gitignore
   git check-ignore -v .env
   ```
   La salida de `git check-ignore` debe confirmar que `.env` ahora está ignorado por la nueva regla.

**Archivos a modificar**: `.env`, `.env.example`, `.gitignore`.

**No toques**:
- `src/app.py` (su lógica `postgres://` → `postgresql://` en líneas 45-50 ya es correcta).
- `src/api/models.py` ni ninguna migración.
- Ningún archivo de tests.
- Ningún otro archivo del proyecto.

**Criterios de éxito**

- `cat .env | grep DATABASE_URL` muestra la nueva URL de PostgreSQL.
- `cat .env.example | grep -v "^#" | grep DATABASE_URL` muestra el ejemplo postgresql sin la línea sqlite.
- `git check-ignore .env` no falla (devuelve `.env` y código de salida 0).
- `git status` NO muestra `.env` en modified/untracked.

**Si encuentras un error**

- Si `.env` ya estaba versionado en git (`git ls-files .env` devuelve resultado), DETENTE y avisa al usuario: hay que `git rm --cached .env` y rotar las credenciales antes de continuar.
- Si el archivo `.env` tiene un formato inesperado, no hagas asunciones — muéstralo al usuario y pregunta.

**Resultado esperado al terminar**

`DATABASE_URL` apunta al servidor PostgreSQL personalizado. `.env` está protegido contra commits accidentales. El proyecto **aún no arrancará correctamente** hasta que se apliquen las migraciones en la Fase 3.

--- PROMPT END ---

---

## PROMPT 3 — Aplicar migraciones Alembic al servidor PostgreSQL

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink**. Las Fases 1 y 2 ya están hechas: la conectividad al servidor PostgreSQL `192.168.1.11:3245` está verificada y `.env` ya apunta a esa URL. Esta es la **Fase 3 de 7**: crear el esquema de la base de datos PostgreSQL aplicando las 7 migraciones Alembic existentes.

**Tu tarea**

1. **Pre-flight check**. Confirma que `.env` está correcto:
   ```bash
   grep "^DATABASE_URL=" .env
   ```
   Debe mostrar la URL `postgresql://playerlink:...@192.168.1.11:3245/playerlink`. Si muestra SQLite, DETENTE — la Fase 2 no se aplicó.

2. **Inspecciona el estado actual de la BD PostgreSQL** para asegurarte de que está vacía o que no hay conflictos:
   ```bash
   PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "\dt" 2>&1
   ```
   - Si la salida dice `No relations found.` → BD vacía, perfecto, sigue al paso 3.
   - Si aparece `alembic_version` y todas las demás tablas (users, profiles, etc.) → ya estaba migrada. DETENTE y pregunta al usuario si quiere `flask db downgrade base` antes de re-aplicar.
   - Si aparecen tablas pero **no** `alembic_version` → estado inconsistente. DETENTE y pregunta.
   - Si `psql` no está disponible, usa esta alternativa Python:
     ```bash
     pipenv run python -c "import psycopg2; c=psycopg2.connect('postgresql://playerlink:Hbyv7ReaUdf9GfL7@192.168.1.11:3245/playerlink'); cur=c.cursor(); cur.execute(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name\"); print([r[0] for r in cur.fetchall()])"
     ```

3. **Aplica todas las migraciones**:
   ```bash
   pipenv run flask db upgrade
   ```
   La salida debe mostrar las 7 revisiones aplicándose en orden: `4c35db69b6d3` → `e74a7acdc46c` → `3e7fc57aca11` → `437134e9d128` → `c7b3d9e1f2a0` → `d1a2b3c4d5e6` → `ff8ef1f575ca`.

4. **Verifica que las 12 tablas + alembic_version se crearon**:
   ```bash
   PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "\dt"
   ```
   Esperadas (13 en total): `alembic_version`, `blocks`, `chat_messages`, `email_verification_tokens`, `games`, `likes`, `matches`, `password_reset_tokens`, `profiles`, `rejects`, `reports`, `reviews`, `users`.

5. **Verifica el head de Alembic**:
   ```bash
   pipenv run flask db current
   ```
   Debe contener `ff8ef1f575ca (head)`.

6. **Verifica los índices únicos creados** en las tablas de tokens:
   ```bash
   PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "\di"
   ```
   Deben aparecer al menos `ix_password_reset_tokens_token_hash` e `ix_email_verification_tokens_token_hash`.

**Archivos a modificar**: ninguno (Alembic registra el estado solo en la BD remota, no en disco).

**No toques**:
- Los archivos en `migrations/versions/*.py` son inmutables. Bajo ninguna circunstancia los edites para "arreglar" un error.
- `migrations/env.py`, `migrations/alembic.ini`.
- Modelos en `src/api/models.py`.

**Si alguna migración falla**

- DETENTE. NO ejecutes `flask db downgrade` por iniciativa propia (podría perder datos si los hubiera).
- Captura el traceback completo y compártelo con el usuario.
- Causas frecuentes a sugerir: tabla pre-existente con esquema distinto, permisos insuficientes del usuario `playerlink` para crear tablas/índices, encoding de la BD incompatible (debe ser UTF-8).

**Resultado esperado al terminar**

- 13 tablas (incluida `alembic_version`) en PostgreSQL.
- `flask db current` muestra `ff8ef1f575ca (head)`.
- Todas las tablas vacías excepto `alembic_version` (que contiene 1 fila).
- Mensaje al usuario: "Esquema creado en PostgreSQL. Listo para Fase 4 (seed)."

--- PROMPT END ---

---

## PROMPT 4 — Poblar la base de datos con seed.py

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink**. Las Fases 1-3 están hechas: hay un esquema vacío con 12 tablas en `postgresql://...@192.168.1.11:3245/playerlink`. Esta es la **Fase 4 de 7**: poblar la BD con datos de prueba usando el seeder existente.

**Tu tarea**

1. **Pre-flight check**. Confirma que las tablas existen y están vacías:
   ```bash
   pipenv run python -c "import psycopg2; c=psycopg2.connect('postgresql://playerlink:Hbyv7ReaUdf9GfL7@192.168.1.11:3245/playerlink'); cur=c.cursor(); cur.execute('SELECT COUNT(*) FROM users'); print('users:', cur.fetchone()[0])"
   ```
   Debe imprimir `users: 0`. Si imprime un número mayor, hay datos previos — DETENTE y pregunta al usuario si quiere conservarlos o sobreescribir. (El seed limpia solo registros con email `@seed.local`, así que otros datos sobrevivirían, pero conviene confirmar.)

2. **Inspecciona `src/seed.py`** brevemente. Confirma con `head -30 src/seed.py` que es el seeder correcto (debe importar `from app import app, db` y definir `SEED_DOMAIN = "seed.local"`). NO modifiques este archivo.

3. **Ejecuta el seeder**:
   ```bash
   cd src && pipenv run python seed.py && cd ..
   ```
   La salida final debe mostrar una tabla con 20 credenciales: `user1@seed.local` → `Password01!` hasta `user20@seed.local` → `Password20!`.

4. **Valida los conteos** contra la BD PostgreSQL:
   ```bash
   PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "SELECT 'users' AS t, COUNT(*) FROM users UNION ALL SELECT 'profiles', COUNT(*) FROM profiles UNION ALL SELECT 'games', COUNT(*) FROM games UNION ALL SELECT 'matches', COUNT(*) FROM matches UNION ALL SELECT 'chat_messages', COUNT(*) FROM chat_messages UNION ALL SELECT 'likes', COUNT(*) FROM likes UNION ALL SELECT 'rejects', COUNT(*) FROM rejects UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;"
   ```

   Conteos esperados (aproximados, según la lógica de `seed.py`):
   - `users`: 20 (exacto)
   - `profiles`: 20 (exacto)
   - `games`: ~46-50 (cada user añade 2-4 juegos)
   - `matches`: ~26 (20 secuenciales + 6 extras)
   - `chat_messages`: ~60 (15 matches × 4 mensajes)
   - `likes`: ~40 (20 users × 2 likes)
   - `rejects`: ~7 (uno cada 3 users)
   - `reviews`: ~40 (1-3 por user)

   Si los conteos están en rango razonable, OK. Si `users != 20` o `profiles != 20`, hay un problema serio — DETENTE.

5. **Muestra un sample de los datos** para verificación humana:
   ```bash
   PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "SELECT u.id, u.email, p.nick_name, p.location FROM users u JOIN profiles p ON p.user_id = u.id ORDER BY u.id LIMIT 5;"
   ```

**No ejecutar**

- `flask seed-match-users` (en `src/api/commands.py`) — tiene un bug preexistente (`user.is_active = True` referencia un campo inexistente en el modelo `User`). Repórtalo al usuario como deuda técnica separada, pero **NO lo arregles en esta fase**.

**Archivos a modificar**: ninguno.

**No toques**:
- `src/seed.py`.
- `src/api/commands.py`.
- Cualquier otro archivo del proyecto.

**Resultado esperado al terminar**

- 20 users + 20 profiles + datos relacionados en PostgreSQL.
- Las 20 credenciales `userN@seed.local` / `PasswordNN!` impresas en consola.
- Sample de 5 usuarios mostrado para confirmación visual.
- Mensaje al usuario: "Base de datos poblada. Listo para Fase 5 (verificación end-to-end)."

--- PROMPT END ---

---

## PROMPT 5 — Verificación funcional end-to-end del backend

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink**. Las Fases 1-4 están hechas: la BD PostgreSQL tiene esquema y datos. Esta es la **Fase 5 de 7**: arrancar el backend Flask contra PostgreSQL y verificar que la API funciona correctamente, prestando especial atención a las queries con `ilike()` (que en SQLite eran case-insensitive solo en ASCII y en PostgreSQL lo son en Unicode real).

**Tu tarea**

1. **Arranca el backend en background** y captura los logs:
   ```bash
   pipenv run flask run --host=0.0.0.0 --port=3001
   ```
   Si tienes capacidad de correr procesos en background, hazlo y dale 3-4 segundos para arrancar. Si no, indica al usuario que abra otra terminal para correrlo y avise cuando esté listo.

   En los logs de arranque verifica:
   - No hay traceback de error.
   - El log de SQLAlchemy (si está en DEBUG) muestra conexiones a `postgresql://`, no a `sqlite://`.

2. **Health check** (debe devolver 200 con HTML):
   ```bash
   curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3001/
   ```
   Esperado: `HTTP 200`.

3. **Login** con un usuario seedeado, y captura el JWT para los siguientes pasos:
   ```bash
   LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"email":"user1@seed.local","password":"Password01!"}')
   echo "$LOGIN_RESPONSE"
   TOKEN=$(echo "$LOGIN_RESPONSE" | pipenv run python -c "import sys, json; print(json.load(sys.stdin).get('token',''))")
   echo "Token capturado: ${TOKEN:0:30}..."
   ```
   Esperado: respuesta JSON con campo `token` no vacío. Si el token sale vacío, DETENTE y reporta la respuesta entera.

4. **Lista de perfiles** (endpoint protegido):
   ```bash
   curl -s "http://localhost:3001/api/profiles" -H "Authorization: Bearer $TOKEN" | head -c 800
   echo ""
   ```
   Esperado: array JSON con perfiles seedeados.

5. **Filtro `ilike` con minúsculas** — este es el test crítico para validar que la migración a PG no rompe búsquedas case-insensitive:
   ```bash
   echo "--- Buscar 'valorant' (minúsculas):"
   curl -s "http://localhost:3001/api/profiles?game=valorant" -H "Authorization: Bearer $TOKEN" | pipenv run python -c "import sys, json; data=json.load(sys.stdin); print(f'Resultados: {len(data) if isinstance(data, list) else data}')"
   echo "--- Buscar 'VALORANT' (mayúsculas):"
   curl -s "http://localhost:3001/api/profiles?game=VALORANT" -H "Authorization: Bearer $TOKEN" | pipenv run python -c "import sys, json; data=json.load(sys.stdin); print(f'Resultados: {len(data) if isinstance(data, list) else data}')"
   ```
   Esperado: **ambas búsquedas devuelven el mismo número de resultados** (>0). Si difieren, hay un problema con `ilike` en PG.

6. **Matches del usuario 1**:
   ```bash
   curl -s "http://localhost:3001/api/matches/user/1" -H "Authorization: Bearer $TOKEN" | head -c 600
   echo ""
   ```
   Esperado: array JSON con al menos 1 match.

7. **Suite de tests** (los tests usan SQLite in-memory por diseño, no tocan PG):
   ```bash
   pipenv run pytest -q
   ```
   Esperado: todos los tests pasan. Si alguno falla, no es por la migración a PG (los tests no usan PG) — repórtalo aparte.

8. **Detén el servidor Flask** (Ctrl+C en la terminal donde corre, o termina el proceso background si lo arrancaste así).

**Archivos a modificar**: ninguno.

**No toques**: ningún archivo del proyecto. Esta fase es 100% verificación.

**Criterios de éxito**

- `/` devuelve 200.
- `/api/login` devuelve un JWT.
- `/api/profiles?game=valorant` y `/api/profiles?game=VALORANT` devuelven el mismo conteo de resultados.
- `pytest` pasa sin fallos.

**Si algo falla**

- Logs del servidor Flask: cópialos íntegros antes de detenerlo.
- Si el problema es de conexión a PostgreSQL durante el arranque: revisa que sigues en LAN/VPN, que `.env` no se ha modificado por error, y que el servidor PG sigue accesible (re-ejecuta los checks de la Fase 1).
- Si las búsquedas `ilike` dan resultados distintos en minúsculas vs mayúsculas: es un bug serio. Captura las dos respuestas y compártelas con el usuario.

**Resultado esperado al terminar**

Mensaje al usuario: "Migración funcional verificada. Backend operativo contra PostgreSQL, login OK, búsquedas case-insensitive OK, tests OK. Listo para Fase 6 (documentación)."

--- PROMPT END ---

---

## PROMPT 6 — Actualizar README.md y README.es.md

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink**. La migración SQLite → PostgreSQL está funcionalmente completa (Fases 1-5). Esta es la **Fase 6 de 7**: sincronizar la documentación para que un colaborador nuevo no se confunda intentando usar SQLite.

**Tu tarea**

### 1. Modificar `README.md`

Usa la herramienta Edit para hacer estos cambios exactos:

**Edit 1** — En la tabla "Tech Stack":
- **old_string**: `| Database | PostgreSQL (production) / SQLite (local dev) |`
- **new_string**: `| Database | PostgreSQL |`

**Edit 2** — En el bloque de variables de entorno del README:
- **old_string**:
  ```
  # Database (SQLite for local dev)
  DATABASE_URL=sqlite:////tmp/playerlink_dev.db
  ```
- **new_string**:
  ```
  # Database (PostgreSQL — request credentials from the project owner)
  DATABASE_URL=postgresql://user:password@host:port/playerlink
  ```

**Edit 3** — En la sección "Prerequisites" (debajo de "Local Setup"):
- **old_string**:
  ```
  - Python 3.13+
  - Node.js 20+
  - `pipenv` → `pip install pipenv`
  ```
- **new_string**:
  ```
  - Python 3.13+
  - Node.js 20+
  - `pipenv` → `pip install pipenv`
  - Access to the project's PostgreSQL server (host, port, user, password — ask the project owner)
  ```

**Edit 4** — En la sección "Full reset (start from scratch)":
- **old_string**:
  ```
  ```bash
  rm -f /tmp/playerlink_dev.db                                  # Delete the DB
  pipenv run flask db upgrade                                    # Recreate all tables
  cd src && pipenv run python seed.py && cd ..                   # Reseed data
  ```
  ```
- **new_string**:
  ```
  > ⚠️ **WARNING**: this resets the PostgreSQL database. If dev and production share the same DB, coordinate with the team before running.

  ```bash
  pipenv run flask db downgrade base        # Drop all tables
  pipenv run flask db upgrade               # Recreate all tables
  cd src && pipenv run python seed.py && cd ..   # Reseed test data
  ```
  ```

### 2. Modificar `README.es.md`

**Edit 5** — En la tabla de motores de base de datos:
- Localiza el bloque que muestra la tabla con filas `| SQLite ... |` y `| Postgres ... |`.
- Reemplaza esa tabla entera por una versión que solo tenga PostgreSQL:

  **old_string**: (cópialo literalmente del archivo — incluye la línea de cabecera, la línea separadora `|---|---|` y las dos filas de motores)

  **new_string**: una versión con solo PostgreSQL. Ejemplo del formato deseado:
  ```
  | Motor     | DATABASE_URL                                                |
  | --------- | ----------------------------------------------------------- |
  | Postgres  | postgresql://username:password@host:port/playerlink         |
  ```

  Si la estructura del archivo no coincide exactamente con lo que esperas, **lee primero el archivo** con la herramienta Read y adapta el `old_string` a lo que realmente hay.

### 3. Verificación

Después de los edits, ejecuta:
```bash
grep -niE "sqlite" README.md README.es.md
```
- En `README.md` no deberían quedar menciones a SQLite (o, si quedan en algún comentario histórico, listarlas al usuario).
- En `README.es.md` igual.

```bash
grep -niE "playerlink_dev\.db|sqlite:" README.md README.es.md
```
- Esperado: 0 resultados.

**Archivos a modificar**: `README.md`, `README.es.md`.

**No toques**:
- `docs/CHANGE_LOG.md` ni `docs/HELP.md` (historial — si hay menciones a SQLite ahí, repórtalas al usuario pero no las modifiques).
- Ningún archivo de código.
- `package.json`, `Pipfile`, `requirements.txt`.

**Importante**: las credenciales reales **nunca** deben aparecer en el README. Usa siempre placeholders genéricos (`user:password@host:port/playerlink`).

**Resultado esperado al terminar**

`README.md` y `README.es.md` reflejan PostgreSQL como motor único. `grep "sqlite" README.md` no devuelve nada relevante. Listo para Fase 7 (limpieza final).

--- PROMPT END ---

---

## PROMPT 7 — Limpieza y verificación final del repositorio

--- PROMPT START ---

Estás trabajando en el proyecto **PlayerLink**. La migración SQLite → PostgreSQL ya está funcionalmente completa y documentada. Esta es la **Fase 7 de 7**: housekeeping final.

**Tu tarea**

1. **Elimina los archivos SQLite locales** que ya no se usan:
   ```bash
   rm -f /tmp/playerlink_dev.db /tmp/playerlink.db /tmp/test.db
   ls /tmp/*.db 2>/dev/null || echo "Sin archivos .db residuales en /tmp"
   ```

2. **Verifica referencias residuales a SQLite en código de runtime** (excluyendo tests y migraciones, donde SQLite es intencional):
   ```bash
   grep -rn "sqlite" src/ --include="*.py" | grep -v "/tests/" || echo "Sin referencias residuales"
   ```
   Esperado: la única coincidencia es en `src/app.py` línea ~50 (fallback hardcoded `"sqlite:////tmp/test.db"` que actúa como red de seguridad si falta `DATABASE_URL`). Esto es **intencional y se mantiene** — no lo modifiques.

3. **Verifica que los tests siguen usando SQLite in-memory** (por diseño, para velocidad):
   ```bash
   grep -n "sqlite:///:memory:" tests/conftest.py tests/test_rate_limit.py
   ```
   Esperado: 2 coincidencias. No las toques.

4. **Estado de git**:
   ```bash
   git status
   echo "---"
   git diff --stat
   ```
   Cambios esperados (lista exacta):
   - `.env.example` (modificado)
   - `.gitignore` (modificado)
   - `README.md` (modificado)
   - `README.es.md` (modificado)

   Cambios **NO esperados** (si aparece alguno, hay un problema):
   - `.env` apareciendo como modified/untracked (debería estar ignorado).
   - Cualquier archivo en `src/` modificado.
   - Cualquier archivo en `migrations/versions/` modificado.
   - Archivos `.db` en cualquier parte del repo.

5. **Genera un resumen de cambios** para el usuario. Formato sugerido:
   ```
   Migración SQLite → PostgreSQL completada.

   ## Archivos modificados
   - .env (local, no versionado): DATABASE_URL ahora apunta a PostgreSQL
   - .env.example: ejemplo principal cambiado a PostgreSQL
   - .gitignore: .env explícitamente ignorado
   - README.md: documentación actualizada
   - README.es.md: documentación actualizada

   ## Estado de la BD
   - Servidor: 192.168.1.11:3245
   - Base: playerlink
   - 12 tablas + alembic_version
   - 20 users seedeados con credenciales userN@seed.local / PasswordNN!

   ## Deuda técnica detectada (fuera del scope de esta migración)
   - src/api/commands.py:26 referencia User.is_active que no existe en el modelo
   - Dev y producción comparten la misma BD (decisión consciente del usuario)
   - render.yaml provisiona una BD PostgreSQL en Render que ya no se usa
     (revisar antes del próximo deploy)
   ```

6. **NO hagas commit automáticamente**. El usuario decide cuándo committear. Solo deja el repo listo para que pueda hacer `git add` + `git commit` de forma controlada.

**Archivos a modificar**: ninguno en este paso. La fase es de verificación y cleanup.

**No toques**:
- `src/app.py` (el fallback SQLite es intencional).
- `tests/conftest.py`, `tests/test_rate_limit.py` (SQLite in-memory para tests es intencional).
- `render.yaml`, `Procfile`, `Dockerfile.render`, `render_build.sh` — siguen siendo válidos porque `DATABASE_URL` se inyecta desde el entorno. Si en el futuro el usuario quiere desconectar la BD de Render que `render.yaml` provisiona, será una tarea aparte.
- `migrations/versions/*.py`.

**Criterios de éxito final**

- `/tmp/*.db` no contiene archivos del proyecto.
- `git status` muestra solo los 4 archivos esperados.
- `git check-ignore .env` confirma que `.env` está protegido.
- El usuario tiene un resumen claro y los próximos pasos sugeridos (commit + rotación opcional de credenciales si las del `.env` previo se filtraron en algún momento histórico).

**Resultado esperado al terminar**

Repositorio limpio, listo para que el usuario revise el diff y haga commit. Migración completada al 100%.

--- PROMPT END ---

---

## Apéndice — Checklist de validación rápida tras completar las 7 fases

Después de ejecutar las 7 fases, el usuario puede correr estos comandos para confirmar el estado:

```bash
# 1. La app apunta a PostgreSQL
grep "^DATABASE_URL=" .env

# 2. .env está protegido
git check-ignore -v .env

# 3. Esquema aplicado
pipenv run flask db current

# 4. Datos seedeados
PGPASSWORD='Hbyv7ReaUdf9GfL7' psql -h 192.168.1.11 -p 3245 -U playerlink -d playerlink -c "SELECT COUNT(*) AS users FROM users;"

# 5. Tests pasan
pipenv run pytest -q

# 6. Backend arranca contra PG
pipenv run flask run --port=3001
# (en otra terminal)
curl -s http://localhost:3001/ -o /dev/null -w "%{http_code}\n"
```

Todo OK → migración completada.
