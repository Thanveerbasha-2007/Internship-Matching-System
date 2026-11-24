package com.internship.dto;

import java.time.LocalDateTime;

public record ApplicationResponse(
    Long applicationId,
    Long studentId,
    String studentName,
    Long internshipId,
    String internshipTitle,
    String companyName,
    String status,
    LocalDateTime appliedAt
) {}
