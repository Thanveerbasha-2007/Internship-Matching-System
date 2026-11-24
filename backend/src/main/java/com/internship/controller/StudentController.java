package com.internship.controller;

import com.internship.dto.RecommendationResponse;
import com.internship.dto.StudentResponse;
import com.internship.dto.StudentUpdateRequest;
import com.internship.service.InternshipService;
import com.internship.service.SavedInternshipService;
import com.internship.service.StudentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentService students;
    private final InternshipService internships;
    private final SavedInternshipService savedInternships;

    public StudentController(StudentService students, InternshipService internships,
                             SavedInternshipService savedInternships) {
        this.students = students;
        this.internships = internships;
        this.savedInternships = savedInternships;
    }

    // Return only the profile belonging to the authenticated session.
    @GetMapping
    public List<StudentResponse> current(HttpSession session) {
        Long studentId = (Long) session.getAttribute("studentId");
        return List.of(students.findById(studentId));
    }

    @GetMapping("/{id}")
    public StudentResponse one(@PathVariable Long id) {
        return students.findById(id);
    }

    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentUpdateRequest request) {
        return students.updateProfile(id, request);
    }

    @GetMapping("/{id}/saved-internships")
    public List<Long> saved(@PathVariable Long id) {
        return savedInternships.findSaved(id);
    }

    @PostMapping("/{id}/saved-internships/{internshipId}")
    public Map<String, Boolean> save(@PathVariable Long id, @PathVariable Long internshipId) {
        savedInternships.save(id, internshipId);
        return Map.of("saved", true);
    }

    @DeleteMapping("/{id}/saved-internships/{internshipId}")
    public Map<String, Boolean> removeSaved(@PathVariable Long id, @PathVariable Long internshipId) {
        savedInternships.remove(id, internshipId);
        return Map.of("saved", false);
    }

    @GetMapping("/{id}/recommendations")
    public List<RecommendationResponse> recommendations(@PathVariable Long id) {
        return internships.recommendations(id);
    }
}
