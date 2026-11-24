-- Internship Matching System
-- Initial MySQL schema (MySQL 8.0+); datasource database is selected by configuration.
-- This schema supports student profiles, internship listings,
-- skill associations, and applications.

CREATE TABLE IF NOT EXISTS students (
  student_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department VARCHAR(120) NULL,
  graduation_year SMALLINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  UNIQUE KEY uk_students_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS student_credentials (
  student_id BIGINT UNSIGNED NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  CONSTRAINT fk_student_credentials_student
    FOREIGN KEY (student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
  skill_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  skill_name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (skill_id),
  UNIQUE KEY uk_skills_name (skill_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_skills (
  student_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, skill_id),
  KEY idx_student_skills_skill_id (skill_id),
  CONSTRAINT fk_student_skills_student
    FOREIGN KEY (student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_student_skills_skill
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS internships (
  internship_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  location VARCHAR(180) NULL,
  work_mode ENUM('ONSITE', 'REMOTE', 'HYBRID') NOT NULL DEFAULT 'ONSITE',
  duration_weeks SMALLINT UNSIGNED NULL,
  stipend_amount DECIMAL(10, 2) NULL,
  application_deadline DATE NULL,
  status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (internship_id),
  KEY idx_internships_status_deadline (status, application_deadline)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS internship_skills (
  internship_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (internship_id, skill_id),
  KEY idx_internship_skills_skill_id (skill_id),
  CONSTRAINT fk_internship_skills_internship
    FOREIGN KEY (internship_id) REFERENCES internships (internship_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_internship_skills_skill
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_internships (
  student_id BIGINT UNSIGNED NOT NULL,
  internship_id BIGINT UNSIGNED NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, internship_id),
  KEY idx_saved_internships_internship_id (internship_id),
  CONSTRAINT fk_saved_internships_student
    FOREIGN KEY (student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_saved_internships_internship
    FOREIGN KEY (internship_id) REFERENCES internships (internship_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_posts (
  post_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_student_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(40) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('VISIBLE', 'DELETED') NOT NULL DEFAULT 'VISIBLE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id),
  KEY idx_community_posts_feed (status, created_at),
  KEY idx_community_posts_author (author_student_id, created_at),
  CONSTRAINT fk_community_posts_author
    FOREIGN KEY (author_student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_comments (
  comment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  author_student_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id),
  KEY idx_community_comments_post (post_id, created_at),
  KEY idx_community_comments_author (author_student_id, created_at),
  CONSTRAINT fk_community_comments_post
    FOREIGN KEY (post_id) REFERENCES community_posts (post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_community_comments_author
    FOREIGN KEY (author_student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_post_votes (
  post_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, student_id),
  KEY idx_community_post_votes_student (student_id),
  CONSTRAINT fk_community_post_votes_post
    FOREIGN KEY (post_id) REFERENCES community_posts (post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_community_post_votes_student
    FOREIGN KEY (student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_reports (
  report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  reporter_student_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(30) NOT NULL,
  details VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  UNIQUE KEY uk_community_report_student_post (post_id, reporter_student_id),
  KEY idx_community_reports_created (created_at),
  CONSTRAINT fk_community_reports_post
    FOREIGN KEY (post_id) REFERENCES community_posts (post_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_community_reports_reporter
    FOREIGN KEY (reporter_student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  application_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  internship_id BIGINT UNSIGNED NOT NULL,
  status ENUM(
    'APPLIED',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'REJECTED',
    'ACCEPTED',
    'WITHDRAWN'
  ) NOT NULL DEFAULT 'APPLIED',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (application_id),
  UNIQUE KEY uk_applications_student_internship (student_id, internship_id),
  KEY idx_applications_internship_id (internship_id),
  CONSTRAINT fk_applications_student
    FOREIGN KEY (student_id) REFERENCES students (student_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_applications_internship
    FOREIGN KEY (internship_id) REFERENCES internships (internship_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- Optional public-facing profile details. Existing student and application records stay intact.
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id BIGINT UNSIGNED NOT NULL,
  headline VARCHAR(180) NULL,
  about TEXT NULL,
  location VARCHAR(160) NULL,
  avatar_url VARCHAR(500) NULL,
  cover_image_url VARCHAR(500) NULL,
  linkedin_url VARCHAR(500) NULL,
  github_url VARCHAR(500) NULL,
  portfolio_url VARCHAR(500) NULL,
  projects TEXT NULL,
  achievements TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  CONSTRAINT fk_student_profiles_student FOREIGN KEY (student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A directional row stores a pending invite or an accepted student connection.
CREATE TABLE IF NOT EXISTS student_connections (
  connection_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_student_id BIGINT UNSIGNED NOT NULL,
  recipient_student_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (connection_id),
  UNIQUE KEY uk_student_connections_pair (requester_student_id, recipient_student_id),
  KEY idx_student_connections_recipient (recipient_student_id, status),
  KEY idx_student_connections_requester (requester_student_id, status),
  CONSTRAINT chk_student_connections_not_self CHECK (requester_student_id <> recipient_student_id),
  CONSTRAINT fk_student_connections_requester FOREIGN KEY (requester_student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_student_connections_recipient FOREIGN KEY (recipient_student_id) REFERENCES students (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
