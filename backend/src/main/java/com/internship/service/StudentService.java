package com.internship.service;

import com.internship.dto.StudentCreateRequest;
import com.internship.dto.StudentResponse;
import com.internship.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {

    private final JdbcTemplate jdbcTemplate;

    public StudentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<StudentResponse> findAll() {
        List<StudentBase> students = jdbcTemplate.query(
            """
            SELECT student_id, full_name, email, department, graduation_year
            FROM students
            ORDER BY full_name
            """,
            (rs, rowNum) -> new StudentBase(
                rs.getLong("student_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("department"),
                (Integer) rs.getObject("graduation_year")
            )
        );
        return students.stream().map(this::withSkills).toList();
    }

    public StudentResponse findById(Long studentId) {
        List<StudentBase> rows = jdbcTemplate.query(
            """
            SELECT student_id, full_name, email, department, graduation_year
            FROM students WHERE student_id = ?
            """,
            (rs, rowNum) -> new StudentBase(
                rs.getLong("student_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("department"),
                (Integer) rs.getObject("graduation_year")
            ),
            studentId
        );
        if (rows.isEmpty()) {
            throw new NotFoundException("Student " + studentId + " was not found.");
        }
        return withSkills(rows.get(0));
    }

    @Transactional
    public StudentResponse create(StudentCreateRequest request) {
        Set<Long> skillIds = request.skillIds() == null
            ? Set.of()
            : new LinkedHashSet<>(request.skillIds());

        for (Long skillId : skillIds) {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM skills WHERE skill_id = ?",
                Integer.class,
                skillId
            );
            if (exists == null || exists == 0) {
                throw new IllegalArgumentException("Unknown skill ID: " + skillId);
            }
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                """
                INSERT INTO students (full_name, email, department, graduation_year)
                VALUES (?, ?, ?, ?)
                """,
                Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, request.fullName().trim());
            statement.setString(2, request.email().trim().toLowerCase());
            statement.setString(3, request.department());
            if (request.graduationYear() == null) {
                statement.setNull(4, java.sql.Types.SMALLINT);
            } else {
                statement.setInt(4, request.graduationYear());
            }
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("The student record was created but no ID was returned.");
        }
        Long studentId = key.longValue();

        for (Long skillId : skillIds) {
            jdbcTemplate.update(
                "INSERT INTO student_skills (student_id, skill_id) VALUES (?, ?)",
                studentId,
                skillId
            );
        }
        return findById(studentId);
    }

    private StudentResponse withSkills(StudentBase student) {
        List<String> skills = jdbcTemplate.query(
            """
            SELECT s.skill_name
            FROM student_skills ss
            JOIN skills s ON s.skill_id = ss.skill_id
            WHERE ss.student_id = ?
            ORDER BY s.skill_name
            """,
            (rs, rowNum) -> rs.getString("skill_name"),
            student.studentId()
        );
        return new StudentResponse(
            student.studentId(),
            student.fullName(),
            student.email(),
            student.department(),
            student.graduationYear(),
            skills
        );
    }

    private record StudentBase(
        Long studentId,
        String fullName,
        String email,
        String department,
        Integer graduationYear
    ) {}
}
