# Database Design

## Database

- Database name: `internship_matching`
- DBMS: MySQL 8.0+
- Storage engine: InnoDB
- Character set: utf8mb4

## Tables and responsibilities

| Table | Responsibility |
|---|---|
| `students` | Stores each student's basic profile. |
| `student_credentials` | Stores a BCrypt password hash for each registered student account. |
| `skills` | Maintains a common catalogue of skills. |
| `student_skills` | Connects students to the skills they possess. |
| `internships` | Stores internship opportunity details. |
| `internship_skills` | Connects internships to their required skills. |
| `applications` | Records a student's application to an internship. |
| `saved_internships` | Stores internships that a student has saved to revisit later. |
| `community_posts` | Stores student-authored discussion posts and their visibility state. |
| `community_comments` | Stores replies to community discussions. |
| `community_post_votes` | Stores one upvote per student per discussion. |
| `community_reports` | Records student reports of discussions for moderation review. |

## Relationships

- Each student account has one `student_credentials` row containing a password hash (never a plain-text password).
- One student can have many entries in `student_skills`.
- One skill can appear in many students' `student_skills` entries.
- One internship can have many entries in `internship_skills`.
- One skill can appear in many internships' `internship_skills` entries.
- One student can submit applications to many internships.
- One internship can receive applications from many students.
- Students can save many internships, and an internship can be saved by many students; the `saved_internships` junction table stores this relationship.
- One student can create many `community_posts`; each discussion can have many comments and votes.
- `community_post_votes` prevents duplicate upvotes with a composite primary key on `(post_id, student_id)`.
- `community_reports` allows one report per student per post using a unique key on `(post_id, reporter_student_id)`.
- A student can apply to a particular internship only once. This is enforced by a unique constraint on `(student_id, internship_id)`.

## Relationship overview

```text
students 1 ---- 1 student_credentials\n\nstudents 1 ---- many student_skills many ---- 1 skills

internships 1 ---- many internship_skills many ---- 1 skills

students 1 ---- many applications many ---- 1 internships\n\nstudents 1 ---- many saved_internships many ---- 1 internships\n\nstudents 1 ---- many community_posts\n\ncommunity_posts 1 ---- many community_comments\n\ncommunity_posts 1 ---- many community_post_votes\n\ncommunity_posts 1 ---- many community_reports
```

## Important design choices

- `student_skills` and `internship_skills` are junction tables for the many-to-many relationships.
- Skill names are unique so the same skill is not entered repeatedly under different rows.
- Foreign keys maintain referential integrity.
- Removing a student or internship that already has application records is restricted to avoid accidental loss of application history.
- Skill matching can be built by comparing the skill IDs associated with a student and an internship. The exact ranking formula will be specified separately before implementation.
- Student passwords are hashed with BCrypt and stored separately from profile fields in `student_credentials`.
- `saved_internships` uses a composite primary key `(student_id, internship_id)` so a student cannot save the same opportunity twice.
- Community posts are soft-deleted from the feed by changing their status to `DELETED`; this avoids removing the associated discussion history immediately.
- Student names and departments are included in community responses, but student email addresses are not.
- Employer accounts and administrative roles are not part of the current prototype.

## Create the database

Run the SQL in `database/schema.sql` using MySQL Workbench or the MySQL command line.

```bash
mysql -u YOUR_USERNAME -p < database/schema.sql
```

Replace `YOUR_USERNAME` with your local MySQL username. The command prompts for the password.

## Current scope

This is the initial database design for the student-to-internship matching workflow. It can be extended after the team finalizes additional requirements.
