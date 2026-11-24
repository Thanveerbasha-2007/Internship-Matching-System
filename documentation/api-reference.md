# REST API Reference

Production website: https://internship-api-production-5a538a6f.up.railway.app

Local API base URL: `http://localhost:8080`

The API uses an HttpOnly session cookie for student sign-in. The browser sends this cookie automatically to the same-origin API. Passwords are stored as BCrypt hashes; they are never returned by an endpoint.

## Authentication

### `POST /api/auth/register`

Creates a student profile and account, then signs the student in.

Example request:

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "password": "choose-a-password",
  "department": "Computer Science",
  "graduationYear": 2027,
  "skillIds": [1, 2, 3]
}
```

Password must contain at least 8 characters. `skillIds` is optional. The response is the new student profile.

### `POST /api/auth/login`

Authenticates an existing student account.

```json
{
  "email": "aarav.sharma@example.com",
  "password": "choose-a-password"
}
```

On success the server sets an HttpOnly session cookie and returns the student's profile. Incorrect credentials return `401 Unauthorized`.

### `GET /api/auth/config`

Returns public sign-in configuration used by the frontend. The Google client ID is public by design; no client secret is returned.

### `POST /api/auth/google`

Verifies a Google Identity Services ID token and signs in the corresponding student. If the verified email already belongs to a student, that existing account is used. Otherwise a student profile is created. Optional academic fields are accepted for first-time sign-up.

```json
{
  "credential": "GOOGLE_ID_TOKEN_FROM_THE_BROWSER",
  "department": "Computer Science",
  "graduationYear": 2027,
  "skillIds": [1, 2, 3]
}
```

The backend verifies the token signature, issuer, audience, expiry, and verified-email claim. The configured `GOOGLE_CLIENT_ID` must match the ID token audience. The response is the student profile and the server sets the same HttpOnly session cookie used by password login.

### `GET /api/auth/me`

Returns the profile belonging to the current session. Returns `401 Unauthorized` when the browser is not signed in.

### `POST /api/auth/logout`

Invalidates the current server-side session.

## Health

### `GET /api/health`

Checks the Spring Boot process and its MySQL connection.

```json
{
  "status": "UP",
  "database": "CONNECTED",
  "service": "Internship Matching API"
}
```

## Skills

### `GET /api/skills`

Returns the available skills and categories. This catalogue is public so it can be used by the registration form.

## Students

Student endpoints require a valid session. A student can access only their own profile and data.

### `GET /api/students`

Returns the current signed-in student's profile as a one-item list.

### `GET /api/students/{studentId}`

Returns the current student's profile. Requesting another student's ID returns `403 Forbidden`.

A profile contains:
- `studentId`
- `fullName`
- `email`
- `department`
- `graduationYear`
- `skills`

### `PUT /api/students/{studentId}`

Updates the signed-in student's own profile. Email and student ID are not editable through this endpoint. The request replaces the current skill list with the supplied `skillIds`.

```json
{
  "fullName": "Aarav Sharma",
  "department": "Computer Science",
  "graduationYear": 2028,
  "skillIds": [1, 2, 4]
}
```

### `GET /api/students/{studentId}/saved-internships`

Returns the internship IDs saved by the signed-in student, most recently saved first.

### `POST /api/students/{studentId}/saved-internships/{internshipId}`

Saves the internship to the student's shortlist. Repeating the request is safe and does not create duplicate rows.

### `DELETE /api/students/{studentId}/saved-internships/{internshipId}`

Removes the internship from the student's saved list.

All profile and saved-internship routes require the matching student's session. Accessing another student's ID returns `403 Forbidden`.

### `GET /api/community/students/{studentId}`

Returns a student profile for the signed-in community viewer. The response deliberately excludes email addresses and private account data. It includes:
- `studentId`, `fullName`, `department`, `graduationYear`, `skills`
- `discussionCount` and `commentCount` for visible posts and authored replies
- `experiencePosts` containing up to five visible posts in the `EXPERIENCES` category
- `recentDiscussions` containing up to ten recent visible non-experience discussions (experience posts are shown separately)

Only community-visible posts are included. Students cannot use this route to view another student's saved internships, applications, login credentials, or email address.

## Internships

These read-only opportunity endpoints are public.

### `GET /api/internships`

Returns opportunities with status `OPEN` whose deadline has not passed.

### `GET /api/internships/{internshipId}`

Returns one internship and its required skills.

The internship detail response includes the company, role title, description, location, work mode, duration, stipend, deadline, status, and required skills.

## Recommendations

### `GET /api/students/{studentId}/recommendations`

Requires the matching student's session. Returns active internships ranked by the current skill-overlap score.

```text
match score = (matched required skills / total distinct required skills) * 100
```

Each response includes `requiredSkills`, `matchedSkills`, `missingSkills`, and `matchScore`. This is a transparent rule-based baseline, not a machine-learning model.

## Applications

### `POST /api/applications`

Requires a signed-in student. The `studentId` in the request must match the session owner. The application is created only when the internship is open, its deadline has not passed, and the student has not already applied.

```json
{
  "studentId": 1,
  "internshipId": 1
}
```

### `GET /api/students/{studentId}/applications`

Requires the matching student's session. Returns the applications submitted by that student.

## Student community

All community endpoints require a signed-in student session. The feed shows student names and departments as authors; email addresses are not included in community responses. Selecting an author's name opens their community profile with their skills, academic details, experience posts, discussion history, and activity counts.

### `GET /api/community/posts`

Returns visible discussions. Optional query parameters:

- `sort`: `NEWEST` (default) or `TOP`.
- `category`: `ALL` (default), `INTERNSHIP_QUESTIONS`, `EXPERIENCES`, `INTERVIEW_PREP`, `CAREER_ADVICE`, `STUDENT_LIFE`, or `GENERAL`.
- `q`: searches post title, body, and author's name.

Each post response includes author details, category, title, body, creation/update timestamps, upvote count, comment count, and whether the current student has upvoted it.

### `GET /api/community/posts/{postId}`

Returns one visible discussion.

### `POST /api/community/posts`

Creates a discussion for the signed-in student.

```json
{
  "category": "INTERNSHIP_QUESTIONS",
  "title": "How should I prepare for a backend internship?",
  "body": "I know Java and SQL. Which topics should I practise before applying?"
}
```

Allowed categories: `INTERNSHIP_QUESTIONS`, `EXPERIENCES`, `INTERVIEW_PREP`, `CAREER_ADVICE`, `STUDENT_LIFE`, and `GENERAL`. Titles are limited to 180 characters and post bodies to 10,000 characters.

### `PUT /api/community/posts/{postId}`

Edits the category, title, and body of the signed-in student's own discussion. Editing another student's post returns `403 Forbidden`.

### `DELETE /api/community/posts/{postId}`

Soft-deletes the signed-in student's own discussion from the visible feed. Its discussion comments and votes are retained in the database as associated records until the post's database row is removed.

### `POST /api/community/posts/{postId}/upvote`

Adds the current student's upvote. Repeated requests do not create duplicate votes.

### `DELETE /api/community/posts/{postId}/upvote`

Removes the current student's upvote.

### `GET /api/community/posts/{postId}/comments`

Returns the comments for a visible discussion, ordered oldest first.

### `POST /api/community/posts/{postId}/comments`

Adds a comment to a discussion.

```json
{
  "body": "Start with REST APIs, SQL, and one deployed project."
}
```

Comment bodies are limited to 4,000 characters.

### `DELETE /api/community/comments/{commentId}`

Deletes a comment authored by the signed-in student. Deleting another student's comment returns `403 Forbidden`.

### `POST /api/community/posts/{postId}/report`

Records one report per student per post. The accepted reasons are `SPAM`, `HARASSMENT`, `MISINFORMATION`, `INAPPROPRIATE`, and `OTHER`; optional details are limited to 500 characters. Reports are stored for future moderation review; the current prototype does not include a moderator dashboard.

## Common errors

- `400 Bad Request`: validation failed or the internship is not accepting applications.
- `401 Unauthorized`: missing or expired student session, or invalid login credentials.
- `403 Forbidden`: request attempts to access another student's profile or submit an application for another student.
- `404 Not Found`: requested student or internship does not exist.
- `409 Conflict`: duplicate email or duplicate application.

## Configuration

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`: database connection.
- `CORS_ALLOWED_ORIGINS`: explicit allowed frontend origins for local development.
- `SESSION_COOKIE_SECURE`: set to `true` when serving over HTTPS.
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Web application client ID used to verify Google sign-in tokens.

Never commit real credentials or passwords to the repository. Use environment variables or your hosting provider's secret manager.
