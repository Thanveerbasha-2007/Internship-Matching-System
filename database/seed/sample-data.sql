-- Demo seed data for Internship Matching System
-- All records below are fictional and intended only for local testing.
-- Run database/schema.sql before running this file.
-- Safe to run repeatedly: INSERT IGNORE and NOT EXISTS checks avoid duplicates.

USE internship_matching;

-- 1. Demo students
INSERT IGNORE INTO students
  (full_name, email, department, graduation_year)
VALUES
  ('Aarav Sharma', 'aarav.sharma@example.com', 'Computer Science', 2027),
  ('Diya Reddy', 'diya.reddy@example.com', 'Computer Science', 2027),
  ('Kabir Mehta', 'kabir.mehta@example.com', 'Data Science', 2028),
  ('Nisha Verma', 'nisha.verma@example.com', 'Computer Science', 2028);

-- 2. Common skill catalogue
INSERT IGNORE INTO skills (skill_name, category)
VALUES
  ('Java', 'Programming Language'),
  ('Spring Boot', 'Backend Framework'),
  ('MySQL', 'Database'),
  ('React', 'Frontend Framework'),
  ('JavaScript', 'Programming Language'),
  ('HTML', 'Frontend'),
  ('CSS', 'Frontend'),
  ('Python', 'Programming Language'),
  ('SQL', 'Database Query Language'),
  ('Machine Learning', 'AI and Data');

-- 3. Demo internship opportunities
-- NOT EXISTS keeps this section repeatable without requiring fixed IDs.
INSERT INTO internships
  (title, company_name, description, location, work_mode,
   duration_weeks, stipend_amount, application_deadline, status)
SELECT
  'Backend Developer Intern', 'Northstar Tech',
  'Work on Java-based backend services and database integration.',
  'Bengaluru', 'HYBRID', 12, 15000.00,
  DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'OPEN'
WHERE NOT EXISTS (
  SELECT 1 FROM internships
  WHERE title = 'Backend Developer Intern'
    AND company_name = 'Northstar Tech'
);

INSERT INTO internships
  (title, company_name, description, location, work_mode,
   duration_weeks, stipend_amount, application_deadline, status)
SELECT
  'Frontend Developer Intern', 'PixelSpring Labs',
  'Build responsive user interfaces for web applications.',
  'Remote', 'REMOTE', 10, 12000.00,
  DATE_ADD(CURRENT_DATE, INTERVAL 25 DAY), 'OPEN'
WHERE NOT EXISTS (
  SELECT 1 FROM internships
  WHERE title = 'Frontend Developer Intern'
    AND company_name = 'PixelSpring Labs'
);

INSERT INTO internships
  (title, company_name, description, location, work_mode,
   duration_weeks, stipend_amount, application_deadline, status)
SELECT
  'Data Analyst Intern', 'InsightWorks',
  'Assist with data cleaning, SQL queries, and reporting.',
  'Hyderabad', 'ONSITE', 8, 10000.00,
  DATE_ADD(CURRENT_DATE, INTERVAL 20 DAY), 'OPEN'
WHERE NOT EXISTS (
  SELECT 1 FROM internships
  WHERE title = 'Data Analyst Intern'
    AND company_name = 'InsightWorks'
);

INSERT INTO internships
  (title, company_name, description, location, work_mode,
   duration_weeks, stipend_amount, application_deadline, status)
SELECT
  'Machine Learning Intern', 'ModelBridge',
  'Explore datasets and build introductory machine learning models.',
  'Pune', 'HYBRID', 12, 18000.00,
  DATE_ADD(CURRENT_DATE, INTERVAL 35 DAY), 'OPEN'
WHERE NOT EXISTS (
  SELECT 1 FROM internships
  WHERE title = 'Machine Learning Intern'
    AND company_name = 'ModelBridge'
);

-- 4. Skills possessed by each demo student
INSERT IGNORE INTO student_skills (student_id, skill_id)
SELECT st.student_id, sk.skill_id
FROM students st
JOIN skills sk ON sk.skill_name IN ('Java', 'Spring Boot', 'MySQL')
WHERE st.email = 'aarav.sharma@example.com';

INSERT IGNORE INTO student_skills (student_id, skill_id)
SELECT st.student_id, sk.skill_id
FROM students st
JOIN skills sk ON sk.skill_name IN ('React', 'JavaScript', 'HTML', 'CSS')
WHERE st.email = 'diya.reddy@example.com';

INSERT IGNORE INTO student_skills (student_id, skill_id)
SELECT st.student_id, sk.skill_id
FROM students st
JOIN skills sk ON sk.skill_name IN ('Python', 'SQL', 'Machine Learning')
WHERE st.email = 'kabir.mehta@example.com';

INSERT IGNORE INTO student_skills (student_id, skill_id)
SELECT st.student_id, sk.skill_id
FROM students st
JOIN skills sk ON sk.skill_name IN ('Python', 'SQL', 'MySQL')
WHERE st.email = 'nisha.verma@example.com';

-- 5. Skills required by each demo internship
INSERT IGNORE INTO internship_skills (internship_id, skill_id)
SELECT i.internship_id, sk.skill_id
FROM internships i
JOIN skills sk ON sk.skill_name IN ('Java', 'Spring Boot', 'MySQL')
WHERE i.title = 'Backend Developer Intern'
  AND i.company_name = 'Northstar Tech';

INSERT IGNORE INTO internship_skills (internship_id, skill_id)
SELECT i.internship_id, sk.skill_id
FROM internships i
JOIN skills sk ON sk.skill_name IN ('React', 'JavaScript', 'HTML', 'CSS')
WHERE i.title = 'Frontend Developer Intern'
  AND i.company_name = 'PixelSpring Labs';

INSERT IGNORE INTO internship_skills (internship_id, skill_id)
SELECT i.internship_id, sk.skill_id
FROM internships i
JOIN skills sk ON sk.skill_name IN ('Python', 'SQL')
WHERE i.title = 'Data Analyst Intern'
  AND i.company_name = 'InsightWorks';

INSERT IGNORE INTO internship_skills (internship_id, skill_id)
SELECT i.internship_id, sk.skill_id
FROM internships i
JOIN skills sk ON sk.skill_name IN ('Python', 'SQL', 'Machine Learning')
WHERE i.title = 'Machine Learning Intern'
  AND i.company_name = 'ModelBridge';

-- 6. Preview skill overlap for every student-internship pair.
-- This is a diagnostic query, not the finalized recommendation formula.
SELECT
  st.full_name AS student_name,
  i.title AS internship_title,
  i.company_name,
  COUNT(DISTINCT required_skill.skill_id) AS total_required_skills,
  COUNT(DISTINCT matched_skill.skill_id) AS matched_skills,
  ROUND(
    100.0 * COUNT(DISTINCT matched_skill.skill_id)
      / NULLIF(COUNT(DISTINCT required_skill.skill_id), 0),
    2
  ) AS skill_overlap_percent
FROM students st
CROSS JOIN internships i
JOIN internship_skills required_skill
  ON required_skill.internship_id = i.internship_id
LEFT JOIN student_skills matched_skill
  ON matched_skill.student_id = st.student_id
 AND matched_skill.skill_id = required_skill.skill_id
WHERE st.email IN (
  'aarav.sharma@example.com',
  'diya.reddy@example.com',
  'kabir.mehta@example.com',
  'nisha.verma@example.com'
)
AND i.company_name IN (
  'Northstar Tech',
  'PixelSpring Labs',
  'InsightWorks',
  'ModelBridge'
)
GROUP BY st.student_id, st.full_name, i.internship_id, i.title, i.company_name
HAVING matched_skills > 0
ORDER BY st.full_name, skill_overlap_percent DESC, i.title;
