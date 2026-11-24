# REST API Reference

Base URL for local development: `http://localhost:8080`

All endpoints are currently part of the project prototype. The API does not yet include user authentication or authorization; do not use real student data until account security and access controls are implemented.

## Health

### `GET /api/health`

Checks the Spring Boot process and its MySQL connection.

Example response:

```json
{
  "status": "UP",
  "database": "CONNECTED",
  "service": "Internship Matching API"
}
```

## Skills

### `GET /api/skills`

Returns the available skills and categories.

## Students

### `GET /api/students`

Returns student profiles and associated skills. The current endpoint is intended for the sample-data prototype and must be access-controlled before real profiles are stored.

### `GET /api/students/{studentId}`

Returns one student profile.

### `POST /api/students`

Creates a student profile and associates the supplied skill IDs.

Example request:

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "department": "Computer Science",
  "graduationYear": 2027,
  "skillIds": [1, 2, 3]
}
```

## Internships

### `GET /api/internships`

Returns opportunities with status `OPEN` whose deadline has not passed.

### `GET /api/internships/{internshipId}`

Returns one internship and its required skills.

## Recommendations

### `GET /api/students/{studentId}/recommendations`

Returns active internships ranked by the current skill-overlap score.

Current baseline formula:

```text
match score = (matched required skills / total distinct required skills) * 100
```

A skill is considered matched when its name appears in both the student's skill profile and the internship's required skill list. Skill name matching is case-insensitive. This is an explainable baseline, not a machine-learning model.

Each response includes:
- `requiredSkills`
- `matchedSkills`
- `missingSkills`
- `matchScore`

## Applications

### `POST /api/applications`

Creates an application if the student exists, the internship is open, the deadline has not passed, and the student has not already applied.

Example request:

```json
{
  "studentId": 1,
  "internshipId": 1
}
```

### `GET /api/students/{studentId}/applications`

Returns the applications submitted by one student.

## Error responses

- `400 Bad Request`: request validation failed or the internship is not accepting applications.
- `404 Not Found`: requested student or internship does not exist.
- `409 Conflict`: unique constraint violation, such as duplicate email or duplicate application.

## Configuration

The backend reads its database connection from environment variables:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `CORS_ALLOWED_ORIGINS`

Never commit real credentials to the repository. Use environment variables or your hosting provider's secret manager.
