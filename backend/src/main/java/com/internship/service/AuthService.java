package com.internship.service;

import com.google.api.client.json.webtoken.JsonWebSignature;
import com.google.auth.oauth2.TokenVerifier;
import com.internship.dto.LoginRequest;
import com.internship.dto.RegisterRequest;
import com.internship.dto.StudentCreateRequest;
import com.internship.dto.StudentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final StudentService students;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Value("${app.google.client-id:}")
    private String googleClientId;

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

    @Transactional
    public StudentResponse loginWithGoogle(String credential, HttpSession session) {
        String clientId = googleClientId == null ? "" : googleClientId.trim();
        if (clientId.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Google sign-in has not been configured yet."
            );
        }

        final JsonWebSignature verifiedToken;
        try {
            verifiedToken = TokenVerifier.newBuilder()
                .setAudience(clientId)
                .setIssuer("https://accounts.google.com")
                .build()
                .verify(credential);
        } catch (TokenVerifier.VerificationException exception) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Google sign-in could not be verified."
            );
        }

        JsonWebSignature.Payload claims = verifiedToken.getPayload();
        String subject = claims.getSubject();
        String email = (String) claims.get("email");
        Boolean emailVerified = (Boolean) claims.get("email_verified");
        String fullName = (String) claims.get("name");

        if (subject == null || subject.isBlank()
            || email == null || email.isBlank()
            || !Boolean.TRUE.equals(emailVerified)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Google must provide a verified email address."
            );
        }

        email = email.trim().toLowerCase(Locale.ROOT);
        List<Long> existingIds = jdbc.query(
            "SELECT student_id FROM students WHERE email = ?",
            (rs, rowNum) -> rs.getLong("student_id"),
            email
        );

        Long studentId;
        if (existingIds.isEmpty()) {
            String displayName = fullName == null || fullName.isBlank()
                ? email.substring(0, email.indexOf('@'))
                : fullName.trim();
            StudentResponse created = students.create(new StudentCreateRequest(
                displayName,
                email,
                null,
                null,
                Set.of()
            ));
            studentId = created.studentId();
        } else {
            // A verified Google email can sign in to the matching existing student account.
            studentId = existingIds.get(0);
        }

        session.setAttribute("studentId", studentId);
        return students.findById(studentId);
    }

    public String googleClientId() {
        return googleClientId == null ? "" : googleClientId.trim();
    }

    public StudentResponse currentStudent(Long studentId) {
        if (studentId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue.");
        }
        return students.findById(studentId);
    }

    private record Credential(Long studentId, String passwordHash) {}
}
