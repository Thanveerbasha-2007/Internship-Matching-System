package com.internship.controller;

import com.internship.dto.RecommendationResponse;
import com.internship.dto.StudentResponse;
import com.internship.service.InternshipService;
import com.internship.service.StudentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentService students;
    private final InternshipService internships;

    public StudentController(StudentService students, InternshipService internships) {
        this.students = students;
        this.internships = internships;
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

    @GetMapping("/{id}/recommendations")
    public List<RecommendationResponse> recommendations(@PathVariable Long id) {
        return internships.recommendations(id);
    }
}
