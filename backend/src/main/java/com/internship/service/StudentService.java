package com.internship.service;

import com.internship.dto.StudentCreateRequest;
import com.internship.dto.StudentResponse;
import com.internship.dto.StudentUpdateRequest;
import com.internship.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {
    private final JdbcTemplate jdbcTemplate;
    public StudentService(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    public List<StudentResponse> findAll() {
        List<StudentBase> rows = jdbcTemplate.query("""
            SELECT s.student_id, s.full_name, s.email, s.department, s.graduation_year,
                   p.headline, p.about, p.location, p.avatar_url, p.cover_image_url,
                   p.linkedin_url, p.github_url, p.portfolio_url, p.projects, p.achievements
            FROM students s LEFT JOIN student_profiles p ON p.student_id = s.student_id
            ORDER BY s.full_name
            """, this::mapStudent);
        return rows.stream().map(this::withSkills).toList();
    }

    public StudentResponse findById(Long studentId) {
        List<StudentBase> rows = jdbcTemplate.query("""
            SELECT s.student_id, s.full_name, s.email, s.department, s.graduation_year,
                   p.headline, p.about, p.location, p.avatar_url, p.cover_image_url,
                   p.linkedin_url, p.github_url, p.portfolio_url, p.projects, p.achievements
            FROM students s LEFT JOIN student_profiles p ON p.student_id = s.student_id
            WHERE s.student_id = ?
            """, this::mapStudent, studentId);
        if (rows.isEmpty()) throw new NotFoundException("Student " + studentId + " was not found.");
        return withSkills(rows.get(0));
    }

    @Transactional
    public StudentResponse create(StudentCreateRequest request) {
        Set<Long> skillIds = request.skillIds() == null ? Set.of() : new LinkedHashSet<>(request.skillIds());
        validateSkills(skillIds);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO students (full_name, email, department, graduation_year) VALUES (?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.fullName().trim());
            statement.setString(2, request.email().trim().toLowerCase());
            statement.setString(3, request.department());
            if (request.graduationYear() == null) statement.setNull(4, java.sql.Types.SMALLINT);
            else statement.setInt(4, request.graduationYear());
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("The student record was created but no ID was returned.");
        Long studentId = key.longValue();
        for (Long skillId : skillIds) jdbcTemplate.update(
            "INSERT INTO student_skills (student_id, skill_id) VALUES (?, ?)", studentId, skillId);
        return findById(studentId);
    }

    @Transactional
    public StudentResponse updateProfile(Long studentId, StudentUpdateRequest request) {
        findById(studentId);
        Set<Long> skillIds = request.skillIds() == null ? Set.of() : new LinkedHashSet<>(request.skillIds());
        validateSkills(skillIds);
        jdbcTemplate.update(
            "UPDATE students SET full_name = ?, department = ?, graduation_year = ? WHERE student_id = ?",
            request.fullName().trim(), request.department(), request.graduationYear(), studentId);
        jdbcTemplate.update("DELETE FROM student_skills WHERE student_id = ?", studentId);
        for (Long skillId : skillIds) jdbcTemplate.update(
            "INSERT INTO student_skills (student_id, skill_id) VALUES (?, ?)", studentId, skillId);

        jdbcTemplate.update("""
            INSERT INTO student_profiles (
                student_id, headline, about, location, avatar_url, cover_image_url,
                linkedin_url, github_url, portfolio_url, projects, achievements
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                headline = COALESCE(VALUES(headline), headline),
                about = COALESCE(VALUES(about), about),
                location = COALESCE(VALUES(location), location),
                avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
                cover_image_url = COALESCE(VALUES(cover_image_url), cover_image_url),
                linkedin_url = COALESCE(VALUES(linkedin_url), linkedin_url),
                github_url = COALESCE(VALUES(github_url), github_url),
                portfolio_url = COALESCE(VALUES(portfolio_url), portfolio_url),
                projects = COALESCE(VALUES(projects), projects),
                achievements = COALESCE(VALUES(achievements), achievements)
            """,
            studentId, clean(request.headline()), clean(request.about()), clean(request.location()),
            clean(request.avatarUrl()), clean(request.coverImageUrl()), clean(request.linkedinUrl()),
            clean(request.githubUrl()), clean(request.portfolioUrl()), clean(request.projects()),
            clean(request.achievements()));
        return findById(studentId);
    }

    private void validateSkills(Set<Long> skillIds) {
        for (Long skillId : skillIds) {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM skills WHERE skill_id = ?", Integer.class, skillId);
            if (exists == null || exists == 0) throw new IllegalArgumentException("Unknown skill ID: " + skillId);
        }
    }
    private String clean(String value) { return value == null ? null : value.trim(); }

    private StudentBase mapStudent(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new StudentBase(
            rs.getLong("student_id"), rs.getString("full_name"), rs.getString("email"),
            rs.getString("department"), (Integer) rs.getObject("graduation_year"),
            rs.getString("headline"), rs.getString("about"), rs.getString("location"),
            rs.getString("avatar_url"), rs.getString("cover_image_url"), rs.getString("linkedin_url"),
            rs.getString("github_url"), rs.getString("portfolio_url"), rs.getString("projects"),
            rs.getString("achievements"));
    }

    private StudentResponse withSkills(StudentBase student) {
        List<String> skills = jdbcTemplate.query("""
            SELECT s.skill_name FROM student_skills ss
            JOIN skills s ON s.skill_id = ss.skill_id
            WHERE ss.student_id = ? ORDER BY s.skill_name
            """, (rs, rowNum) -> rs.getString("skill_name"), student.studentId());
        return new StudentResponse(
            student.studentId(), student.fullName(), student.email(), student.department(),
            student.graduationYear(), skills, student.headline(), student.about(), student.location(),
            student.avatarUrl(), student.coverImageUrl(), student.linkedinUrl(), student.githubUrl(),
            student.portfolioUrl(), student.projects(), student.achievements());
    }

    private record StudentBase(
        Long studentId, String fullName, String email, String department, Integer graduationYear,
        String headline, String about, String location, String avatarUrl, String coverImageUrl,
        String linkedinUrl, String githubUrl, String portfolioUrl, String projects, String achievements
    ) {}
}
