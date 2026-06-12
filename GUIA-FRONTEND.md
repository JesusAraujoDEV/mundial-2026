# 🏆 Mundial 2026 - Guía de Integración Frontend

## Base URL
```
http://localhost:3000
```
Swagger UI disponible en: `http://localhost:3000/api/docs`

---

## 🔐 AUTENTICACIÓN (JWT)

### POST `/mundial/auth/login`
Inicia sesión y obtiene un token JWT válido por 7 días.

**Body:**
```json
{
  "email": "jesus@mundial.com",
  "password": "admin2026"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Login exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Jesus Araujo",
    "email": "jesus@mundial.com",
    "rol": "admin",
    "puntosTotales": 0
  }
}
```

**Uso del token:** Enviar en todas las peticiones protegidas como header:
```
Authorization: Bearer <token>
```

**Error (401):**
```json
{ "message": "Credenciales incorrectas.", "statusCode": 401 }
```

---

### GET `/mundial/auth/perfil` 🔒
Obtiene el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Respuesta (200):**
```json
{
  "usuario": {
    "id": 1,
    "nombre": "Jesus Araujo",
    "email": "jesus@mundial.com",
    "rol": "admin",
    "puntosTotales": 15,
    "createdAt": "2026-06-12T19:00:00.000Z"
  }
}
```

---

## 👑 ENDPOINTS ADMINISTRATIVOS (Requieren rol "admin")

### POST `/mundial/auth/crear-usuario` 🔒
El admin crea cuentas para sus amigos.

**Headers:** `Authorization: Bearer <token-admin>`

**Body:**
```json
{
  "nombre": "Carlos Pérez",
  "email": "carlos@gmail.com",
  "password": "carlos123",
  "rol": "user"
}
```

**Respuesta (201):**
```json
{
  "message": "Usuario \"Carlos Pérez\" creado exitosamente.",
  "usuario": {
    "id": 2,
    "nombre": "Carlos Pérez",
    "email": "carlos@gmail.com",
    "rol": "user"
  }
}
```

**Error (409):** Email duplicado.

---

### POST `/mundial/admin/cargar-pais`
Carga o reemplaza la plantilla completa de una selección.

**Body:**
```json
{
  "pais": "Alemania",
  "banderaUrl": "https://flagcdn.com/de.svg",
  "jugadores": [
    { "dorsal": 1, "nombre": "Manuel Neuer", "posicion": "Portero", "edad": 40 },
    { "dorsal": 7, "nombre": "Kai Havertz", "posicion": "Delantero", "edad": 27 }
  ]
}
```

**Posiciones válidas:** `Portero`, `Defensa`, `Mediocentro`, `Delantero`

**Respuesta (201):**
```json
{
  "message": "País \"Alemania\" cargado con 26 jugadores.",
  "pais": { "id": 1, "nombre": "Alemania", "banderaUrl": "..." },
  "jugadores": [...]
}
```

---

### PUT `/mundial/admin/partido/:id`
Actualiza el marcador real de un partido y/o bloquea pronósticos.

> ⚠️ **IMPORTANTE:** Al enviar `golesLocal` + `golesVisitante`, el sistema automáticamente:
> 1. Recalcula los puntos de TODOS los pronósticos de ese partido
> 2. Actualiza los `puntos_totales` de cada usuario
> 3. Actualiza las estadísticas del grupo (PJ, G, E, P, GF, GC, DG, Pts)

**Body (actualizar marcador + bloquear):**
```json
{
  "golesLocal": 2,
  "golesVisitante": 0,
  "bloqueado": true
}
```

**Body (solo bloquear, sin marcador):**
```json
{
  "bloqueado": true
}
```

**Respuesta (200):**
```json
{
  "message": "Partido 1 actualizado. Puntos recalculados para todos los pronósticos.",
  "partido": {
    "id": 1,
    "localId": 46,
    "visitanteId": 39,
    "fase": "grupos",
    "grupo": "A",
    "fecha": "2026-06-11T19:00:00.000Z",
    "golesLocal": 2,
    "golesVisitante": 0,
    "bloqueado": true,
    "actualizadoPorAdmin": true
  }
}
```

---

## ⚽ PRONÓSTICOS (Usuarios)

### POST `/mundial/usuario/:usuarioId/partido/:partidoId/pronostico`
Crea o modifica la predicción de un usuario para un partido.

> ⚠️ Si el partido está **bloqueado**, la API devuelve error 400.

**URL ejemplo:** `/mundial/usuario/2/partido/5/pronostico`

**Body:**
```json
{
  "prediccionLocal": 2,
  "prediccionVisitante": 1
}
```

**Respuesta (201):**
```json
{
  "message": "Pronóstico guardado correctamente.",
  "pronostico": {
    "id": 1,
    "usuarioId": 2,
    "partidoId": 5,
    "prediccionLocal": 2,
    "prediccionVisitante": 1,
    "puntosGanados": 0,
    "createdAt": "2026-06-12T20:00:00.000Z"
  }
}
```

**Error (400) - Partido bloqueado:**
```json
{
  "message": "El partido 5 está bloqueado. No se pueden crear ni modificar pronósticos.",
  "statusCode": 400
}
```

### Sistema de puntuación:
| Resultado | Puntos |
|-----------|--------|
| Marcador exacto (ej: predijo 2-1 y fue 2-1) | **5 puntos** |
| Acertó ganador/empate (ej: predijo 3-1, fue 2-0) | **3 puntos** |
| Falló completamente | **0 puntos** |

---

## 📊 RANKING Y VISUALIZACIÓN

### GET `/mundial/ranking`
Tabla de posiciones de la quiniela entre amigos.

**Respuesta (200):**
```json
{
  "ranking": [
    { "posicion": 1, "id": 3, "nombre": "Pedro López", "puntosTotales": 23 },
    { "posicion": 2, "id": 1, "nombre": "Jesus Araujo", "puntosTotales": 18 },
    { "posicion": 3, "id": 2, "nombre": "Carlos Pérez", "puntosTotales": 12 }
  ]
}
```

---

### GET `/mundial/matriz-pronosticos`
Vista completa de todos los partidos con los pronósticos de cada usuario.

**Respuesta (200):**
```json
{
  "partidos": [
    {
      "partidoId": 1,
      "fase": "grupos",
      "fecha": "2026-06-11T19:00:00.000Z",
      "bloqueado": true,
      "local": { "id": 46, "nombre": "México", "banderaUrl": "..." },
      "visitante": { "id": 39, "nombre": "Sudáfrica", "banderaUrl": "..." },
      "resultadoReal": { "golesLocal": 2, "golesVisitante": 0 },
      "pronosticos": [
        {
          "usuarioId": 1,
          "nombreUsuario": "Jesus Araujo",
          "prediccionLocal": 2,
          "prediccionVisitante": 0,
          "puntosGanados": 5
        },
        {
          "usuarioId": 2,
          "nombreUsuario": "Carlos Pérez",
          "prediccionLocal": 1,
          "prediccionVisitante": 0,
          "puntosGanados": 3
        }
      ]
    }
  ]
}
```

---

## 🏟️ GRUPOS

### GET `/mundial/grupos`
Retorna los 12 grupos con posiciones calculadas en tiempo real.

**Respuesta (200):**
```json
{
  "grupos": [
    {
      "grupo": "A",
      "equipos": [
        {
          "paisId": 46,
          "nombre": "México",
          "banderaUrl": null,
          "grupo": "A",
          "puntos": 3,
          "partidosJugados": 1,
          "ganados": 1,
          "empatados": 0,
          "perdidos": 0,
          "golesAFavor": 2,
          "golesEnContra": 0,
          "diferenciaGoles": 2,
          "tarjetasAmarillas": 0,
          "tarjetasRojas": 0,
          "fairPlayPuntos": 0
        },
        { "...Corea del Sur con 3 pts..." },
        { "...Chequia con 0 pts..." },
        { "...Sudáfrica con 0 pts..." }
      ]
    },
    { "grupo": "B", "equipos": [...] }
  ]
}
```

**Ordenamiento:** Puntos → Diferencia de Goles → Goles a Favor → Fair Play

---

### GET `/mundial/mejores-terceros`
Los 12 terceros de cada grupo con marca de cuáles clasifican.

**Respuesta (200):**
```json
{
  "mejoresTerceros": [
    {
      "posicion": 1,
      "clasifica": true,
      "paisId": 28,
      "nombre": "Marruecos",
      "grupo": "C",
      "puntos": 4,
      "diferenciaGoles": 2,
      "..."
    },
    {
      "posicion": 9,
      "clasifica": false,
      "paisId": 42,
      "nombre": "Túnez",
      "grupo": "F",
      "puntos": 1,
      "..."
    }
  ],
  "clasificados": 8,
  "eliminados": 4
}
```

---

### GET `/mundial/playoffs/llaves`
Árbol de eliminación directa con cruces FIFA.

**Respuesta (200):**
```json
{
  "estructura": {
    "dieciseisavos": [
      { "id": 1, "descripcion": "1A vs 3C/D/E", "local": "México", "visitante": "Por definir" },
      { "id": 2, "descripcion": "2A vs 2B", "local": "Corea del Sur", "visitante": "Suiza" }
    ],
    "octavosReales": [...],
    "cuartos": [...],
    "semifinales": [...],
    "tercerLugar": null,
    "final": null
  },
  "tercerosClasificados": { "cruce1": "3°C", "cruce2": "3°D", "..." }
}
```

---

## 📈 ESTADÍSTICAS

### GET `/mundial/estadisticas/goleadores?limit=20`
Top goleadores y selecciones más goleadoras.

**Query params:**
- `limit` (opcional, default: 20)

**Respuesta (200):**
```json
{
  "topGoleadores": [
    {
      "posicion": 1,
      "jugadorId": 145,
      "nombre": "Kai Havertz",
      "dorsal": 7,
      "posicionCampo": "Delantero",
      "pais": { "id": 1, "nombre": "Alemania", "banderaUrl": "..." },
      "goles": 4
    }
  ],
  "seleccionesGoleadoras": [
    { "posicion": 1, "paisId": 9, "nombre": "Brasil", "banderaUrl": "...", "golesTotal": 9 }
  ],
  "resumenGoles": {
    "totalGoles": 87,
    "porTipo": [
      { "tipo": "normal", "cantidad": 72 },
      { "tipo": "penal", "cantidad": 12 },
      { "tipo": "autogol", "cantidad": 3 }
    ]
  }
}
```

---

## 🔄 FLUJO COMPLETO SUGERIDO PARA EL FRONTEND

### 1. Login
```
POST /mundial/auth/login → Guardar token en localStorage/cookie
```

### 2. Home / Dashboard
```
GET /mundial/ranking → Mostrar tabla de posiciones de la quiniela
GET /mundial/grupos → Mostrar miniatura de grupos con posiciones
```

### 3. Vista de Pronósticos
```
GET /mundial/matriz-pronosticos → Tabla cruzada partidos × usuarios
POST /mundial/usuario/:id/partido/:id/pronostico → Guardar predicción
```

### 4. Vista de Grupos (detalle)
```
GET /mundial/grupos → Tablas completas con PJ, G, E, P, GF, GC, DG, Pts
GET /mundial/mejores-terceros → Tabla de mejores terceros
```

### 5. Eliminatorias
```
GET /mundial/playoffs/llaves → Árbol visual de llaves
```

### 6. Estadísticas
```
GET /mundial/estadisticas/goleadores → Rankings de goleadores
```

### 7. Panel Admin (solo si `usuario.rol === "admin"`)
```
POST /mundial/auth/crear-usuario → Crear cuenta para un amigo
PUT /mundial/admin/partido/:id → Actualizar marcador + bloquear
POST /mundial/admin/cargar-pais → Cargar plantilla de selección
```

---

## ⚙️ NOTAS TÉCNICAS

### Headers requeridos
```
Content-Type: application/json
Authorization: Bearer <token>  (solo endpoints protegidos 🔒)
```

### Códigos de error comunes
| Código | Significado |
|--------|-------------|
| 400 | Datos inválidos o partido bloqueado |
| 401 | Token inválido o expirado |
| 404 | Recurso no encontrado |
| 409 | Conflicto (email duplicado) |

### Validaciones importantes
- Los pronósticos solo se pueden crear/editar si `partido.bloqueado === false`
- Solo el admin puede crear usuarios y actualizar marcadores
- El token JWT expira en 7 días
- Posiciones válidas para jugadores: `Portero`, `Defensa`, `Mediocentro`, `Delantero`

### CORS
CORS está habilitado para todas las origins. Si necesitas restringirlo, se configura en `src/main.ts`.
