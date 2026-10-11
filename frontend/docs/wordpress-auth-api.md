# Contrat API WordPress (JWT + OTP email)

Ce frontend est exporté en statique (Next `output: "export"`). Toute la logique sensible doit vivre côté WordPress via des endpoints REST.

## Base

- Base WP: `https://<ton-site-wp>`
- Namespace: `/wp-json/2day/v1`

## Auth JWT

### POST `/wp-json/2day/v1/auth/login`

Body:

```json
{ "email": "user@example.com", "password": "..." }
```

Response 200:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+237...",
    "city": "Douala"
  }
}
```

Erreurs:

- 401: identifiants invalides

### GET `/wp-json/2day/v1/me`

Headers:

- `Authorization: Bearer <jwt>`

Response 200: même structure `user` que ci-dessus.

### PATCH `/wp-json/2day/v1/me`

Headers:

- `Authorization: Bearer <jwt>`

Body (partiel):

```json
{ "firstName": "…", "lastName": "…", "email": "…", "phone": "…", "city": "…" }
```

Response 200: user mis à jour.

## Inscription avec OTP (code 6 chiffres)

### POST `/wp-json/2day/v1/auth/register/request`

Body:

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "user@example.com",
  "password": "..."
}
```

Comportement serveur:

- Génère un code OTP à 6 chiffres
- Envoie l’email avec le code
- Stocke un challenge temporaire (email + hash code + expiration + payload d’inscription)

Response 200:

```json
{ "challengeId": "abc123", "email": "user@example.com", "expiresAt": 1710000000000 }
```

Erreurs:

- 409: email déjà utilisé
- 429: trop de tentatives / rate limit

### POST `/wp-json/2day/v1/auth/register/verify`

Body:

```json
{ "challengeId": "abc123", "code": "123456" }
```

Comportement serveur:

- Valide le code et l’expiration
- Crée le compte WP (role customer)
- Retourne une session JWT

Response 200: même que `/auth/login`.

## Mot de passe oublié avec OTP (code 6 chiffres)

### POST `/wp-json/2day/v1/auth/password/request`

Body:

```json
{ "email": "user@example.com" }
```

Comportement serveur:

- Génère un code OTP à 6 chiffres
- Envoie l’email avec le code
- Stocke un challenge temporaire (email + hash code + expiration)

Response 200:

```json
{ "challengeId": "def456", "email": "user@example.com", "expiresAt": 1710000000000 }
```

Erreurs:

- 404: compte inexistant (ou 200 neutre si tu préfères ne pas révéler l’existence)
- 429: rate limit

### POST `/wp-json/2day/v1/auth/password/confirm`

Body:

```json
{ "challengeId": "def456", "code": "123456", "newPassword": "..." }
```

Response 200:

```json
{ "ok": true }
```

