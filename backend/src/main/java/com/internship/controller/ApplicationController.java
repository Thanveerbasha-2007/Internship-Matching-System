package com.internship.controller;

import com.internship.dto.ApplicationRequest;
import com.internship.dto.ApplicationResponse;
import com.internship.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class ApplicationController {
    private final ApplicationService applications;
    public ApplicationController(ApplicationService applications) { this.applications = applications; }

    @PostMapping("/api/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse apply(@Valid @RequestBody ApplicationRequest request) {
        return applications.apply(request);
    }

    @GetMapping("/api/students/{studentId}/applications")
    public List<ApplicationResponse> byStudent(@PathVariable Long studentId) {
        return applications.findByStudent(studentId);
    }
}
