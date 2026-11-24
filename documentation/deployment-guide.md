# Deployment Guide

The prototype is designed to use Vercel for the React frontend and Railway for the Spring Boot API and MySQL database.

> Hosting accounts must be linked to the GitHub repository before a deployment can be created. Do not paste database passwords, API tokens, or other secrets into GitHub.

## 1. Deploy the MySQL database on Railway

1. Create a Railway project.
2. Add a **MySQL** database service.
3. Wait until the database deployment is healthy.
4. Open the MySQL service's Variables tab. Railway provides `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE`.
5. Keep the database private. The Spring Boot service will connect to it over Railway's private networking.

## 2. Deploy the Spring Boot API on Railway

1. Add a service from the GitHub repository `Thanveerbasha-2007/Internship-Matching-System`.
2. Select the `main` branch.
3. Set the service Root Directory to `/backend`.
4. Railway will detect the `Dockerfile` in that directory and build the Spring Boot application.
5. Add these variables to the backend service. Replace `MySQL` in the reference expressions if your database service has a different exact service name.

```text
DB_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
CORS_ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN
```

6. Deploy the service and use Railway Networking to generate a public domain.
7. Test the API health URL:

```text
https://YOUR-RAILWAY-DOMAIN/api/health
```

Expected response includes `"status":"UP"` and `"database":"CONNECTED"`.

The application initializes its packaged schema and fictional demo data on startup. This is suitable for the current demo environment. Before production data is introduced, replace this initialization approach with managed migrations and disable automatic demo-data seeding.

## 3. Deploy the React frontend on Vercel

1. Open Vercel and import the GitHub repository.
2. Select the `main` branch.
3. Set the Root Directory to `frontend`.
4. Framework preset: **Vite**.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Add the production environment variable:

```text
VITE_API_BASE_URL=https://YOUR-RAILWAY-DOMAIN
```

8. Deploy the project.

The repository includes `frontend/vercel.json` for Vite output and client-side route fallback. Every future push to the connected branch can trigger a new deployment.

## 4. Verify the live application

After both services are running:

1. Open `https://YOUR-RAILWAY-DOMAIN/api/health` and confirm the database reports `CONNECTED`.
2. Open `https://YOUR-RAILWAY-DOMAIN/api/students` and confirm the demo profiles are returned.
3. Open the Vercel URL and confirm the top-right status says **Connected to live API**, not **Demo preview**.
4. Change the selected demo student and confirm recommendations update.
5. Submit one demo application and confirm it appears under Applications.
6. Submit the same application again and confirm the API returns a conflict instead of creating a duplicate.

## 5. Important prototype security limitations

The current prototype has no login, authentication, or role-based access control. Student profile endpoints are public and applications can currently be submitted without proving student identity. Only use the fictional sample records for the public demonstration.

Before real students use the service:
- Add authentication and authorize students to access only their own profiles and applications.
- Protect profile and application endpoints.
- Add an employer/admin authorization model before allowing internship management.
- Add production data migrations, backups, rate limits, and audit logging.
- Restrict public student data and remove sample profiles from production.
- Review privacy, consent, and retention requirements.

## Hosting references

- [Vercel React deployment guide](https://vercel.com/kb/guide/deploying-react-with-vercel)
- [Railway Dockerfile builds](https://docs.railway.com/builds/dockerfiles)
- [Railway MySQL](https://docs.railway.com/databases/mysql)
- [Railway build configuration and root directories](https://docs.railway.com/builds/build-configuration)
