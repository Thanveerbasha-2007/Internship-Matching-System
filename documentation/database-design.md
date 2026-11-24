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

## Relationships

- Each student account has one `student_credentials` row containing a password hash (never a plain-text password).
- One student can have many entries in `student_skills`.
- One skill can appear in many students' `student_skills` entries.
- One internship can have many entries in `internship_skills`.
- One skill can appear in many internships' `internship_skills` entries.
- One student can submit applications to many internships.
- One internship can receive applications from many students.
- A student can apply to a particular internship only once. This is enforced by a unique constraint on `(student_id, internship_id)`.

## Relationship overview

```text
students 1 ---- 1 student_credentials\n\nstudents 1 ---- many student_skills many ---- 1 skills

internships 1 ---- many internship_skills many ---- 1 skills

students 1 ---- many applications many ---- 1 internships
```

## Important design choices

- `student_skills` and `internship_skills` are junction tables for the many-to-many relationships.
- Skill names are unique so the same skill is not entered repeatedly under different rows.
- Foreign keys maintain referential integrity.
- Removing a student or internship that already has application records is restricted to avoid accidental loss of application history.
- Skill matching can be built by comparing the skill IDs associated with a student and an internship. The exact ranking formula will be specified separately before implementation.
- Student passwords are hashed with BCrypt and stored separately from profile fields in `student_credentials`.
- Employer accounts and administrative roles are not part of the current prototype.

## Create the database

Run the SQL in `database/schema.sql` using MySQL Workbench or the MySQL command line.

```bash
mysql -u YOUR_USERNAME -p < database/schema.sql
```

Replace `YOUR_USERNAME` with your local MySQL username. The command prompts for the password.

## Current scope

This is the initial database design for the student-to-internship matching workflow. It can be extended after the team finalizes additional requirements.
