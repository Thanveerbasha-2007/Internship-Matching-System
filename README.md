# Internship Matching System

A skill-based web application that helps students discover internship opportunities aligned with their skills and understand why each opportunity is recommended.

## Project objective

The application maintains student skill profiles, stores internship requirements, and ranks open opportunities using an explainable skill-overlap score.

## Confirmed technology stack

- Frontend: React 19 + Vite
- Backend: Java 21 + Spring Boot 4.2
- Database: MySQL 8
- Communication: REST APIs

## Repository structure

```text
.
├── .github/workflows/    # Database, backend and frontend CI checks
├── frontend/             # React + Vite user interface
├── backend/              # Spring Boot REST API
├── database/             # MySQL schema and demo data
├── documentation/        # Database design and API reference
└── presentation/         # Project presentation
```

## Features in the current prototype

- Browse internship opportunities
- Search by role, company, location, and skill
- Filter by work mode and minimum skill-match percentage
- View student profiles and skill sets
- Compare matched and missing internship skills
- View ranked recommendations
- Submit an internship application and view its status when the API is connected
- Demo preview mode with clearly marked fictional sample data when the API is unavailable

## Matching baseline

The current recommendation score is:

```text
(match count of required skills / total distinct required skills) * 100
```

Skill names are compared without case sensitivity. The API returns the required, matched, and missing skills so the score is explainable. This is a transparent rule-based baseline, not an AI or machine-learning model.

## Run locally

### 1. Database

Use MySQL 8.0 or newer.

Create the database and tables:

```bash
mysql -u YOUR_USERNAME -p < database/schema.sql
```

Insert fictional demo data:

```bash
mysql -u YOUR_USERNAME -p < database/seed/sample-data.sql
```

### 2. Backend

Requirements: Java 21 and Maven 3.9+.

Set the database variables in your terminal (replace the example password):

**Windows PowerShell**

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/internship_matching?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your-mysql-password"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
mvn -f backend/pom.xml spring-boot:run
```

The backend also initializes its packaged schema and sample data on startup. Its default local MySQL username/password fallback is for development only; configure proper credentials outside local development.

Health endpoint: `http://localhost:8080/api/health`

### 3. Frontend

Requirements: Node.js 22 or newer.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8080` during local development.

For the single-origin production deployment, leave `VITE_API_BASE_URL` empty: the React application calls `/api` on the same host as Spring Boot.

## API documentation

See [documentation/api-reference.md](documentation/api-reference.md).

## Live deployment

The current public demo is hosted on Railway:

- Website: https://internship-api-production-5a538a6f.up.railway.app
- API health: https://internship-api-production-5a538a6f.up.railway.app/api/health

See [documentation/deployment-guide.md](documentation/deployment-guide.md) for the deployment configuration and verification steps.

## Database documentation

See [documentation/database-design.md](documentation/database-design.md) and [documentation/sample-data-guide.md](documentation/sample-data-guide.md).

## Automated tests

GitHub Actions checks:
- MySQL schema and sample data integration
- Backend compilation, matching unit tests, Spring Boot startup, and API smoke tests
- Frontend production build

View runs in the repository's **Actions** tab.

## Deployment architecture

The deployment architecture is:
- React frontend: built with Vite and served as static assets by Spring Boot.
- Spring Boot API: Railway service.
- MySQL database: private Railway MySQL service.

The root `Dockerfile` builds both frontend and backend into one container. The React app calls `/api` on the same public domain, avoiding cross-origin configuration.

## Security and data note

The current app is a prototype and does not yet have sign-in, authentication, or role-based authorization. The API currently exposes sample student profiles and accepts application requests without a user login. Use only fictional demo data until authentication, authorization, validation, and production data protections have been added. Never commit database passwords, API tokens, or other secrets.

## Team

- Shaik Thanveer Basha
- Muthyala Akshay
- Tatichettu Jaswanth Kumar
- M Nishanth Reddy

## Project status

Prototype implementation in progress. The database schema, backend REST API, initial React interface, and combined production Docker build are in the repository. Authentication and production security hardening are still outstanding.
