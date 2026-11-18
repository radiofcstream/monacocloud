MONACO 98.7 FM - CLOUDFLARE PAGES

1) Subí el contenido de esta carpeta a un repositorio de GitHub.
   La carpeta functions debe quedar en la raíz, al mismo nivel que index.html.
2) En Cloudflare: Workers & Pages > Create > Pages > Connect to Git.
   Elegí el repositorio.
   Framework preset: None
   Build command: (vacío)
   Build output directory: /
3) En el proyecto Pages > Settings > Functions > Bindings:
   - KV namespace: variable MONACO_NEWS -> crear namespace y vincularlo.
   - R2 bucket: variable MONACO_IMAGES -> crear bucket llamado monaco-images y vincularlo.
4) En Settings > Variables and Secrets > Production:
   Crear ADMIN_PASSWORD (tipo Secret) con tu contraseña privada.
   Crear SESSION_SECRET (tipo Secret) con una cadena larga aleatoria, por ejemplo 40 caracteres.
   No publiques esos valores en GitHub.
5) Guardá y hacé un nuevo deploy. Para cambiar contraseña, cambiá ADMIN_PASSWORD en Cloudflare y redeployá.
6) Abrí la web y tocá el pequeño punto invisible de la esquina inferior izquierda para abrir Administración.

IMPORTANTE SOBRE WRANGLER:
El archivo wrangler.toml es una plantilla de referencia. Si usás Git Integration de Pages,
configurá los bindings desde el panel de Cloudflare. Si Cloudflare te pide un ID de KV,
reemplazá REEMPLAZAR_CON_ID_DE_KV por el ID real. No inventes ese ID.

STREAM:
La página usa /api/stream, que hace proxy hacia:
http://88.150.230.110:29986/stream

El proxy evita el bloqueo HTTP/mixed content del navegador y pasa el audio sin cachearlo.
No puede reparar cortes que se originen en el servidor de radio o en la conexión de origen.

IMÁGENES:
Las imágenes de noticias se guardan en el bucket R2. Las noticias y programación se guardan en KV.
No borres ni desvincules esos recursos si querés conservar publicaciones.

SEGURIDAD:
La contraseña no está escrita en app.js ni en el HTML. Se verifica en Pages Functions.
La sesión usa cookie HttpOnly, Secure y firma HMAC.
