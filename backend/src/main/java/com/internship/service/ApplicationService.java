package com.internship.service;

import com.internship.dto.ApplicationRequest;
import com.internship.dto.ApplicationResponse;
import com.internship.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;

@Service
public class ApplicationService {
    private final JdbcTemplate jdbc;
    public ApplicationService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public ApplicationResponse apply(ApplicationRequest request) {
        ensureExists("students", "student_id", request.studentId(), "Student");
        List<InternshipAvailability> availability = jdbc.query(
            "SELECT status, application_deadline FROM internships WHERE internship_id = ?",
            (rs, n) -> new InternshipAvailability(
                rs.getString("status"),
                rs.getDate("application_deadline") == null
                    ? null
                    : rs.getDate("application_deadline").toLocalDate()
            ),
            request.internshipId());
        if (availability.isEmpty()) throw new NotFoundException("Internship " + request.internshipId() + " was not found.");
        InternshipAvailability opportunity = availability.get(0);
        if (!"OPEN".equals(opportunity.status())) throw new IllegalArgumentException("This internship is not accepting applications.");
        if (opportunity.deadline() != null && opportunity.deadline().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("The application deadline for this internship has passed.");
        }
        jdbc.update("INSERT INTO applications (student_id, internship_id) VALUES (?, ?)",
            request.studentId(), request.internshipId());
        return findOne(request.studentId(), request.internshipId());
    }

    public List<ApplicationResponse> findByStudent(Long studentId) {
        ensureExists("students", "student_id", studentId, "Student");
        return jdbc.query(SELECT + " WHERE a.student_id = ? ORDER BY a.applied_at DESC",
            this::map, studentId);
    }

    private ApplicationResponse findOne(Long studentId, Long internshipId) {
        return jdbc.queryForObject(SELECT + " WHERE a.student_id = ? AND a.internship_id = ?",
            this::map, studentId, internshipId);
    }

    private void ensureExists(String table, String column, Long id, String label) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?",
            Integer.class, id);
        if (count == null || count == 0) throw new NotFoundException(label + " " + id + " was not found.");
    }

    private record InternshipAvailability(String status, java.time.LocalDate deadline) {}

    private ApplicationResponse map(java.sql.ResultSet rs, int n) throws java.sql.SQLException {
        Timestamp timestamp = rs.getTimestamp("applied_at");
        return new ApplicationResponse(rs.getLong("application_id"), rs.getLong("student_id"),
            rs.getString("student_name"), rs.getLong("internship_id"),
            rs.getString("internship_title"), rs.getString("company_name"),
            rs.getString("status"), timestamp == null ? null : timestamp.toLocalDateTime());
    }

    private static final String SELECT = """
        SELECT a.application_id, a.student_id, s.full_name AS student_name,
               a.internship_id, i.title AS internship_title, i.company_name,
               a.status, a.applied_at
        FROM applications a
        JOIN students s ON s.student_id = a.student_id
        JOIN internships i ON i.internship_id = a.internship_id
        """;
}
