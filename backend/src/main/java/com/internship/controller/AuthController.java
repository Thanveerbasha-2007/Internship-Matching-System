package com.internship.controller;

import com.internship.dto.GoogleLoginRequest;
import com.internship.dto.LoginRequest;
import com.internship.dto.RegisterRequest;
import com.internship.dto.StudentResponse;
import com.internship.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
        replaceSession(servletRequest);
        return auth.register(request, servletRequest.getSession(true));
    }

    @PostMapping("/login")
    public StudentResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        replaceSession(servletRequest);
        return auth.login(request, servletRequest.getSession(true));
    }

    @PostMapping("/google")
    public StudentResponse google(@Valid @RequestBody GoogleLoginRequest request, HttpServletRequest servletRequest) {
        replaceSession(servletRequest);
        return auth.loginWithGoogle(
            request.credential(),
            request.department(),
            request.graduationYear(),
            request.skillIds(),
            servletRequest.getSession(true)
        );
    }

    @GetMapping("/config")
    public Map<String, String> config() {
        return Map.of("googleClientId", auth.googleClientId());
    }

    @GetMapping("/me")
    public StudentResponse me(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Long studentId = session == null ? null : (Long) session.getAttribute("studentId");
        return auth.currentStudent(studentId);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return Map.of("message", "Signed out successfully.");
    }

    private void replaceSession(HttpServletRequest request) {
        HttpSession current = request.getSession(false);
        if (current != null) current.invalidate();
    }
}
