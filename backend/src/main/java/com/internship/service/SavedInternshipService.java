package com.internship.service;

import com.internship.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SavedInternshipService {
    private final JdbcTemplate jdbc;
    private final StudentService students;
    private final InternshipService internships;

    public SavedInternshipService(JdbcTemplate jdbc, StudentService students, InternshipService internships) {
        this.jdbc = jdbc;
        this.students = students;
        this.internships = internships;
    }

    public List<Long> findSaved(Long studentId) {
        students.findById(studentId);
        return jdbc.query(
            """
            SELECT internship_id
            FROM saved_internships
            WHERE student_id = ?
            ORDER BY saved_at DESC
            """,
            (rs, rowNum) -> rs.getLong("internship_id"),
            studentId
        );
    }

    public void save(Long studentId, Long internshipId) {
        students.findById(studentId);
        internships.findById(internshipId);
        jdbc.update(
            """
            INSERT INTO saved_internships (student_id, internship_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE saved_at = CURRENT_TIMESTAMP
            """,
            studentId,
            internshipId
        );
    }

    public void remove(Long studentId, Long internshipId) {
        students.findById(studentId);
        internships.findById(internshipId);
        jdbc.update(
            "DELETE FROM saved_internships WHERE student_id = ? AND internship_id = ?",
            studentId,
            internshipId
        );
    }
}
