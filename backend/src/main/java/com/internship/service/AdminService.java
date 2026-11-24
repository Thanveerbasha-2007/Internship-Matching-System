package com.internship.service;

import com.internship.dto.AdminInternshipRequest;
import com.internship.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminService {
    private final JdbcTemplate jdbc;

    @Value("${app.admin.emails:}")
    private String configuredAdminEmails;

    public AdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean isAdmin(Long studentId) {
        if (studentId == null || configuredAdminEmails == null || configuredAdminEmails.isBlank()) {
            return false;
        }
        Set<String> allowlist = Arrays.stream(configuredAdminEmails.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .map(value -> value.toLowerCase(Locale.ROOT))
            .collect(Collectors.toSet());
        if (allowlist.isEmpty()) return false;

        List<String> emails = jdbc.query(
            "SELECT email FROM students WHERE student_id = ?",
            (rs, rowNum) -> rs.getString("email"),
            studentId
        );
        return !emails.isEmpty() && allowlist.contains(emails.get(0).toLowerCase(Locale.ROOT));
    }

    public void requireAdmin(Long studentId) {
        if (!isAdmin(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access is required.");
        }
    }

    public Map<String, Object> overview() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("students", count("SELECT COUNT(*) FROM students"));
        result.put("openInternships", count("SELECT COUNT(*) FROM internships WHERE status = 'OPEN' AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)"));
        result.put("closedInternships", count("SELECT COUNT(*) FROM internships WHERE status = 'CLOSED' OR (application_deadline IS NOT NULL AND application_deadline < CURRENT_DATE)"));
        result.put("visiblePosts", count("SELECT COUNT(*) FROM community_posts WHERE status = 'VISIBLE'"));
        result.put("pendingReports", count("SELECT COUNT(*) FROM community_reports"));
        result.put("applications", count("SELECT COUNT(*) FROM applications"));
        return result;
    }

    public List<Map<String, Object>> internships() {
        return jdbc.query(
            """
            SELECT internship_id, title, company_name, description, location, work_mode,
                   duration_weeks, stipend_amount, application_deadline, status
            FROM internships
            ORDER BY created_at DESC, internship_id DESC
            """,
            (rs, rowNum) -> {
                Long id = rs.getLong("internship_id");
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("internshipId", id);
                item.put("title", rs.getString("title"));
                item.put("companyName", rs.getString("company_name"));
                item.put("description", rs.getString("description"));
                item.put("location", rs.getString("location"));
                item.put("workMode", rs.getString("work_mode"));
                item.put("durationWeeks", (Integer) rs.getObject("duration_weeks"));
                item.put("stipendAmount", rs.getBigDecimal("stipend_amount"));
                item.put("applicationDeadline", rs.getDate("application_deadline") == null ? null : rs.getDate("application_deadline").toLocalDate());
                item.put("status", rs.getString("status"));
                item.put("requiredSkillIds", jdbc.query(
                    "SELECT skill_id FROM internship_skills WHERE internship_id = ? ORDER BY skill_id",
                    (skillRs, skillRow) -> skillRs.getLong(1),
                    id
                ));
                item.put("requiredSkills", jdbc.query(
                    """
                    SELECT s.skill_name FROM internship_skills ix
                    JOIN skills s ON s.skill_id = ix.skill_id
                    WHERE ix.internship_id = ? ORDER BY s.skill_name
                    """,
                    (skillRs, skillRow) -> skillRs.getString(1),
                    id
                ));
                return item;
            }
        );
    }

    public List<Map<String, Object>> reports() {
        return jdbc.query(
            """
            SELECT r.report_id, r.post_id, r.reporter_student_id, reporter.full_name AS reporter_name,
                   r.reason, r.details, r.created_at, p.title AS post_title, p.body AS post_body,
                   p.status AS post_status, p.author_student_id, author.full_name AS author_name
            FROM community_reports r
            JOIN community_posts p ON p.post_id = r.post_id
            JOIN students reporter ON reporter.student_id = r.reporter_student_id
            JOIN students author ON author.student_id = p.author_student_id
            ORDER BY r.created_at DESC, r.report_id DESC
            """,
            (rs, rowNum) -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("reportId", rs.getLong("report_id"));
                item.put("postId", rs.getLong("post_id"));
                item.put("reporterStudentId", rs.getLong("reporter_student_id"));
                item.put("reporterName", rs.getString("reporter_name"));
                item.put("reason", rs.getString("reason"));
                item.put("details", rs.getString("details"));
                item.put("createdAt", rs.getTimestamp("created_at").toLocalDateTime());
                item.put("postTitle", rs.getString("post_title"));
                item.put("postBody", rs.getString("post_body"));
                item.put("postStatus", rs.getString("post_status"));
                item.put("authorStudentId", rs.getLong("author_student_id"));
                item.put("authorName", rs.getString("author_name"));
                return item;
            }
        );
    }

    @Transactional
    public Map<String, Object> createInternship(AdminInternshipRequest request) {
        validateSkills(request.requiredSkillIds());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                """
                INSERT INTO internships
                    (title, company_name, description, location, work_mode, duration_weeks,
                     stipend_amount, application_deadline, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                Statement.RETURN_GENERATED_KEYS
            );
            bindInternship(statement, request);
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("The internship was saved but its ID was not returned.");
        saveSkills(key.longValue(), request.requiredSkillIds());
        return internshipById(key.longValue());
    }

    @Transactional
    public Map<String, Object> updateInternship(Long internshipId, AdminInternshipRequest request) {
        validateSkills(request.requiredSkillIds());
        int updated = jdbc.update(
            """
            UPDATE internships
            SET title = ?, company_name = ?, description = ?, location = ?, work_mode = ?,
                duration_weeks = ?, stipend_amount = ?, application_deadline = ?, status = ?
            WHERE internship_id = ?
            """,
            request.title().trim(), request.companyName().trim(), clean(request.description()),
            clean(request.location()), request.workMode(), request.durationWeeks(),
            request.stipendAmount(), request.applicationDeadline(), request.status(), internshipId
        );
        if (updated == 0) throw new NotFoundException("Internship " + internshipId + " was not found.");
        saveSkills(internshipId, request.requiredSkillIds());
        return internshipById(internshipId);
    }

    @Transactional
    public void updateInternshipStatus(Long internshipId, String status) {
        int updated = jdbc.update(
            "UPDATE internships SET status = ? WHERE internship_id = ?",
            status,
            internshipId
        );
        if (updated == 0) throw new NotFoundException("Internship " + internshipId + " was not found.");
    }

    @Transactional
    public void dismissReport(Long reportId) {
        int deleted = jdbc.update("DELETE FROM community_reports WHERE report_id = ?", reportId);
        if (deleted == 0) throw new NotFoundException("Report " + reportId + " was not found.");
    }

    @Transactional
    public void removeCommunityPost(Long postId) {
        int updated = jdbc.update(
            "UPDATE community_posts SET status = 'DELETED' WHERE post_id = ? AND status = 'VISIBLE'",
            postId
        );
        if (updated == 0) throw new NotFoundException("Visible community post " + postId + " was not found.");
        jdbc.update("DELETE FROM community_reports WHERE post_id = ?", postId);
    }

    private Map<String, Object> internshipById(Long internshipId) {
        return internships().stream()
            .filter(item -> internshipId.equals(item.get("internshipId")))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Internship " + internshipId + " was not found."));
    }

    private void validateSkills(Set<Long> skillIds) {
        if (skillIds == null) return;
        for (Long skillId : skillIds) {
            Integer exists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM skills WHERE skill_id = ?",
                Integer.class,
                skillId
            );
            if (exists == null || exists == 0) {
                throw new IllegalArgumentException("Unknown skill ID: " + skillId);
            }
        }
    }

    private void saveSkills(Long internshipId, Set<Long> skillIds) {
        jdbc.update("DELETE FROM internship_skills WHERE internship_id = ?", internshipId);
        if (skillIds == null) return;
        for (Long skillId : skillIds) {
            jdbc.update(
                "INSERT INTO internship_skills (internship_id, skill_id) VALUES (?, ?)",
                internshipId,
                skillId
            );
        }
    }

    private void bindInternship(PreparedStatement statement, AdminInternshipRequest request) throws java.sql.SQLException {
        statement.setString(1, request.title().trim());
        statement.setString(2, request.companyName().trim());
        statement.setString(3, clean(request.description()));
        statement.setString(4, clean(request.location()));
        statement.setString(5, request.workMode());
        if (request.durationWeeks() == null) statement.setNull(6, java.sql.Types.SMALLINT);
        else statement.setInt(6, request.durationWeeks());
        BigDecimal stipend = request.stipendAmount();
        if (stipend == null) statement.setNull(7, java.sql.Types.DECIMAL);
        else statement.setBigDecimal(7, stipend);
        LocalDate deadline = request.applicationDeadline();
        if (deadline == null) statement.setNull(8, java.sql.Types.DATE);
        else statement.setDate(8, java.sql.Date.valueOf(deadline));
        statement.setString(9, request.status());
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
