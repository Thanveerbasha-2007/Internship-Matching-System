# Deployment Guide

The production prototype runs as two Railway services inside one project:

- **Internship API**: Spring Boot serves the REST API and the built React website from one public domain.
- **MySQL**: a private MySQL 8 service with a persistent volume.

The root `Dockerfile` builds the React app first, copies its `dist` files into Spring Boot's static resources, then packages the API. This gives the browser and API one origin.

## Railway resources

The Railway project is named **Internship Matching System** and has a `production` environment.

The MySQL service is named `MySQL`. It uses a persistent volume mounted at `/var/lib/mysql`. Keep this service private; the backend connects using Railway's private network variables.

The Spring Boot service is named `internship-api`, uses the repository `Thanveerbasha-2007/Internship-Matching-System` on `main`, and builds from the repository root using the root `Dockerfile`.

## Required backend variables

The Spring Boot service reads these variables:

```text
DB_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/railway?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
CORS_ALLOWED_ORIGINS=https://YOUR-RAILWAY-APP-DOMAIN
```

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
- `/api/students` — demo student profiles
- `/api/internships` — open internships
- `/api/students/1/recommendations` — ranked demo recommendations

The application initializes its packaged schema and fictional demo data on startup. This is suitable only for the demonstration environment. Before production data is introduced, replace startup seeding with managed schema migrations and disable automatic demo-data insertion.

## Security limitations

This prototype does not yet include sign-in, authentication, or role-based authorization. Student profile endpoints are public and application requests do not verify a logged-in student. Use only the fictional sample records for a public demo.

Before real students use the service:
- Add authentication and authorize students to access only their own profiles and applications.
- Add employer/admin roles before enabling internship management.
- Restrict public student data, and remove demo profiles from production.
- Add database backups, migrations, rate limits, audit logging, and privacy/consent controls.
- Never commit passwords, tokens, or other secrets to GitHub.

## Hosting references

- [Railway Dockerfile builds](https://docs.railway.com/builds/dockerfiles)
- [Railway MySQL](https://docs.railway.com/databases/mysql)
- [Railway build configuration](https://docs.railway.com/builds/build-configuration)
