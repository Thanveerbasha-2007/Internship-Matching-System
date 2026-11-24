package com.internship.controller;

import com.internship.dto.AdminInternshipRequest;
import com.internship.dto.AdminInternshipStatusRequest;
import com.internship.service.AdminService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    @GetMapping("/me")
    public Map<String, Boolean> me(HttpSession session) {
        return Map.of("isAdmin", admin.isAdmin(currentStudentId(session)));
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(HttpSession session) {
        requireAdmin(session);
        return admin.overview();
    }

    @GetMapping("/internships")
    public Object internships(HttpSession session) {
        requireAdmin(session);
        return admin.internships();
    }

    @PostMapping("/internships")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createInternship(
        @Valid @RequestBody AdminInternshipRequest request,
        HttpSession session
    ) {
        requireAdmin(session);
        return admin.createInternship(request);
    }

    @PutMapping("/internships/{internshipId}")
    public Map<String, Object> updateInternship(
        @PathVariable Long internshipId,
        @Valid @RequestBody AdminInternshipRequest request,
        HttpSession session
    ) {
        requireAdmin(session);
        return admin.updateInternship(internshipId, request);
    }

    @PatchMapping("/internships/{internshipId}/status")
    public Map<String, String> updateInternshipStatus(
        @PathVariable Long internshipId,
        @Valid @RequestBody AdminInternshipStatusRequest request,
        HttpSession session
    ) {
        requireAdmin(session);
        admin.updateInternshipStatus(internshipId, request.status());
        return Map.of("message", "Internship status updated.");
    }

    @GetMapping("/reports")
    public Object reports(HttpSession session) {
        requireAdmin(session);
        return admin.reports();
    }

    @DeleteMapping("/reports/{reportId}")
    public Map<String, String> dismissReport(@PathVariable Long reportId, HttpSession session) {
        requireAdmin(session);
        admin.dismissReport(reportId);
        return Map.of("message", "Report dismissed.");
    }

    @DeleteMapping("/community/posts/{postId}")
    public Map<String, String> removeCommunityPost(@PathVariable Long postId, HttpSession session) {
        requireAdmin(session);
        admin.removeCommunityPost(postId);
        return Map.of("message", "Community post removed.");
    }

    private void requireAdmin(HttpSession session) {
        admin.requireAdmin(currentStudentId(session));
    }

    private Long currentStudentId(HttpSession session) {
        return (Long) session.getAttribute("studentId");
    }
}
