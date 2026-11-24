package com.internship.service;

import com.internship.dto.LoginRequest;
import com.internship.dto.RegisterRequest;
import com.internship.dto.StudentCreateRequest;
import com.internship.dto.StudentResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import java.util.List;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final StudentService students;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    public AuthService(JdbcTemplate jdbc, StudentService students) {
        this.jdbc = jdbc;
        this.students = students;
    }

    @Transactional
    public StudentResponse register(RegisterRequest request, HttpSession session) {
        StudentCreateRequest profile = new StudentCreateRequest(
            request.fullName(),
            request.email(),
            request.department(),
            request.graduationYear(),
            request.skillIds()
        );

        StudentResponse student = students.create(profile);
        jdbc.update(
            "INSERT INTO student_credentials (student_id, password_hash) VALUES (?, ?)",
            student.studentId(),
            passwordEncoder.encode(request.password())
        );
        session.setAttribute("studentId", student.studentId());
        return student;
    }

    public StudentResponse login(LoginRequest request, HttpSession session) {
        String email = request.email().trim().toLowerCase();
        List<Credential> credentials = jdbc.query(
            """
            SELECT sc.student_id, sc.password_hash
            FROM student_credentials sc
            JOIN students s ON s.student_id = sc.student_id
            WHERE s.email = ?
            """,
            (rs, rowNum) -> new Credential(rs.getLong("student_id"), rs.getString("password_hash")),
            email
        );

        if (credentials.isEmpty() || !passwordEncoder.matches(request.password(), credentials.get(0).passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        }

        Long studentId = credentials.get(0).studentId();
        session.setAttribute("studentId", studentId);
        return students.findById(studentId);
    }

    public StudentResponse currentStudent(Long studentId) {
        if (studentId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue.");
        }
        return students.findById(studentId);
    }

    private record Credential(Long studentId, String passwordHash) {}
}
