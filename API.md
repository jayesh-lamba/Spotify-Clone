# ORIVIO API Documentation

Base URL: `http://localhost:5001/api`

All endpoints return JSON responses in the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional response message"
}
```

Protected endpoints require a standard Bearer Token header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/signup`
Creates a new user account.
- **Request Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created):** Returns user object and JWT token.

### `POST /api/auth/login`
Authenticates user and returns JWT.
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):** Returns user object and JWT token.

### `GET /api/auth/me` *(Protected)*
Gets current authenticated user profile.

---

## 2. Songs (`/api/songs`)

### `GET /api/songs`
List songs with pagination and optional query filters.
- **Query Parameters:** `page`, `limit`, `genre`, `artist`, `album`

### `GET /api/songs/trending`
Returns top played trending songs.
- **Query Parameters:** `limit` (default: 10)

### `GET /api/songs/recommendations` *(Optional Auth)*
Returns personalized song recommendations based on liked songs & listening history.
- **Query Parameters:** `limit` (default: 12)

### `GET /api/songs/:id`
Get song details by ID.

### `GET /api/songs/:id/stream`
Stream MP3 audio file. Supports `Range` header for playback seeking.

### `POST /api/songs/:id/play`
Increments play count for a song.

### `GET /api/songs/:id/lyrics`
Get lyrics data (synced LRC lines or plain text).

---

## 3. Artists & Albums (`/api/artists`, `/api/albums`)

### `GET /api/artists`
Get all artists.
### `GET /api/artists/:id`
Get artist details by ID.
### `GET /api/artists/:id/songs`
Get all songs by artist.

### `GET /api/albums`
Get all albums.
### `GET /api/albums/:id`
Get album details by ID including tracks list.

---

## 4. Playlists (`/api/playlists`)

### `GET /api/playlists` *(Protected)*
Get current user's created & saved playlists.

### `POST /api/playlists` *(Protected)*
Create a new playlist.
- **Request Body:**
  ```json
  {
    "name": "My Chill Beats",
    "description": "Chill music",
    "isPublic": true
  }
  ```

### `GET /api/playlists/:id`
Get playlist details by ID.

### `POST /api/playlists/:id/songs` *(Protected)*
Add song to playlist.
- **Request Body:** `{ "songId": "<SONG_ID>" }`

### `DELETE /api/playlists/:id/songs/:songId` *(Protected)*
Remove song from playlist.

### `PUT /api/playlists/:id/pin` *(Protected)*
Toggle pinned status of playlist in user library sidebar.

---

## 5. Search (`/api/search`)

### `GET /api/search`
Global search across songs, artists, and albums with natural query parsing.
- **Query Parameters:**
  - `q`: Search string (e.g., `synthwave`, `by Taylor Swift`, `from 2022`)
  - `type`: `all` | `songs` | `artists` | `albums` (default: `all`)

---

## 6. Admin (`/api/admin`) *(Protected + Admin Role)*

### `GET /api/admin/analytics`
System analytics dashboard data: total users, songs, plays, top songs, recent registrations.

### `POST /api/admin/scan-music`
Triggers local music directory auto-scanner to index new files in `backend/Music/`.
