package com.internship.dto;

import java.util.List;

public record StudentResponse(
    Long studentId,
    String fullName,
    String email,
    String department,
    Integer graduationYear,
    List<String> skills
) {}
