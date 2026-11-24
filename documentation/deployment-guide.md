# Deployment Guide

The production prototype runs as two Railway services inside one project:

- **Internship API**: Spring Boot serves the REST API and the built React website from one public domain.
- **MySQL**: a private MySQL 8 service with a persistent volume.

The root `Dockerfile` builds the React app first, copies its `dist` files into Spring Boot's static resources, then packages the API. This gives the browser and API one origin.

## Railway resources

The Railway project is named **Internship Matching System** and has a `production` environment.

Public demo URL: https://internship-api-production-5a538a6f.up.railway.app

The MySQL service is named `MySQL`. It uses a persistent volume mounted at `/var/lib/mysql`. Keep this service private; the backend connects using Railway's private network variables.

The Spring Boot service is named `internship-api`, uses the repository `Thanveerbasha-2007/Internship-Matching-System` on `main`, and builds from the repository root using the root `Dockerfile`. In Railway, keep **Root Directory** empty (the repository root) and set the Dockerfile path to `/Dockerfile`; do not enter the repository URL in Root Directory.

## Required backend variables

The Spring Boot service reads these variables:

```text
DB_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/railway?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
CORS_ALLOWED_ORIGINS=https://internship-api-production-5a538a6f.up.railway.app
SESSION_COOKIE_SECURE=true
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id
```

For Google sign-in, create an OAuth 2.0 Client ID with application type **Web application** in Google Cloud Console. Add `https://internship-api-production-5a538a6f.up.railway.app` to **Authorized JavaScript origins**, then set the resulting client ID as the backend service's `GOOGLE_CLIENT_ID` Railway variable. For local development, also add `http://localhost:5173` as an authorized JavaScript origin. This ID-token sign-in flow does not require a client secret. The frontend reads the public client ID from `GET /api/auth/config`, so setting the variable requires a backend redeploy but no frontend build argument.

Use Railway's variable-reference syntax, not copied credentials. The current MySQL volume was initialized with the default `railway` database, so the deployed API connects to that database. Local setup can continue to use `internship_matching` as described in the README.

## Deployment verification

The API's health-check path is:

```text
/api/health
```

Expected JSON includes:

```json
{
  "status": "UP",
  "database": "CONNECTED",
  "service": "Internship Matching API"
}
```

The same public host should also serve:
- `/` — React application
- `/api/health` — API and database health
- `/api/auth/config` — public authentication configuration
- `/api/students` — authenticated student's profile (requires a session)
- `/api/internships` — open internships
- `/api/students/1/recommendations` — ranked demo recommendations

The application initializes its packaged schema and fictional demo data on startup. This is suitable only for the demonstration environment. Before production data is introduced, replace startup seeding with managed schema migrations and disable automatic demo-data insertion.

## Security limitations

Student registration and password login use BCrypt password hashes, Google sign-in verifies Google ID tokens and verified email claims, and all sign-in methods use HttpOnly session cookies. The backend restricts profile, recommendation, and application endpoints to the signed-in student. The application is still a student-project prototype.

Before real-world use:
- Add email verification and a secure password-reset flow.
- Add employer/admin roles and appropriate permissions before enabling employer workflows.
- Add rate limiting, account lockout/abuse protection, database backups, managed schema migrations, audit logging, and privacy/consent controls.
- Review the public internship and skills data separately from private student data.
- Never commit passwords, tokens, or other secrets to GitHub.

## Hosting references

- [Railway Dockerfile builds](https://docs.railway.com/builds/dockerfiles)
- [Railway MySQL](https://docs.railway.com/databases/mysql)
- [Railway build configuration](https://docs.railway.com/builds/build-configuration)
