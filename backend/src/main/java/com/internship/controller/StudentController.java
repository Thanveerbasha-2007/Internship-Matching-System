package com.internship.controller;

import com.internship.dto.*;
import com.internship.service.InternshipService;
import com.internship.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

    @GetMapping
    public List<StudentResponse> all() { return students.findAll(); }

    @GetMapping("/{id}")
    public StudentResponse one(@PathVariable Long id) { return students.findById(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody StudentCreateRequest request) {
        return students.create(request);
    }

    @GetMapping("/{id}/recommendations")
    public List<RecommendationResponse> recommendations(@PathVariable Long id) {
        return internships.recommendations(id);
    }
}
