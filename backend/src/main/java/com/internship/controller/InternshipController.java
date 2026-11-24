package com.internship.controller;

import com.internship.dto.InternshipResponse;
import com.internship.service.InternshipService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/internships")
public class InternshipController {
    private final InternshipService internships;
    public InternshipController(InternshipService internships) { this.internships = internships; }

    @GetMapping
    public List<InternshipResponse> all() { return internships.findAll(); }

    @GetMapping("/{id}")
    public InternshipResponse one(@PathVariable Long id) { return internships.findById(id); }
}
