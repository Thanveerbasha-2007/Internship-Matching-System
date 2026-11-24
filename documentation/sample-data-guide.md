# Sample Data and Matching Preview

## Purpose

The seed script adds fictional student profiles, skills, internship opportunities, and the many-to-many skill mappings needed for local development and testing.

No real student or company records are used. The companies and people in this file are illustrative examples, not project partners or real listings.

## Run order

1. Create the database and tables by running `database/schema.sql`.
2. Insert the demo records by running `database/seed/sample-data.sql`.

From the repository root, using a local MySQL installation:

```bash
mysql -u YOUR_USERNAME -p < database/schema.sql
mysql -u YOUR_USERNAME -p < database/seed/sample-data.sql
```

Replace `YOUR_USERNAME` with your local MySQL username. MySQL will prompt for your password.

## Demo profiles

| Student | Example skill profile |
|---|---|
| Aarav Sharma | Java, Spring Boot, MySQL |
| Diya Reddy | React, JavaScript, HTML, CSS |
| Kabir Mehta | Python, SQL, Machine Learning |
| Nisha Verma | Python, SQL, MySQL |

## Demo opportunities

| Internship | Required skills |
|---|---|
| Backend Developer Intern | Java, Spring Boot, MySQL |
| Frontend Developer Intern | React, JavaScript, HTML, CSS |
| Data Analyst Intern | Python, SQL |
| Machine Learning Intern | Python, SQL, Machine Learning |

## Previewing the data

The bottom of `database/seed/sample-data.sql` contains a query that lists student/internship pairs with at least one overlapping skill. It reports:

- Total required skills for the internship
- Number of required skills the student has
- The percentage of required skills matched

That percentage is only a diagnostic overlap measure for checking the sample data. It is not yet the agreed recommendation score or a finalized matching algorithm.

## Re-running the seed script

The script uses duplicate-safe inserts for students, skills, and junction-table rows. Internship rows are inserted only when the same title and company combination is not already present, so the script can be run more than once without intentionally creating duplicate demo records.
