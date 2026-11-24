package com.internship.dto;

import jakarta.validation.constraints.Positive;

public record ApplicationRequest(
    @Positive Long studentId,
    @Positive Long internshipId
) {}
