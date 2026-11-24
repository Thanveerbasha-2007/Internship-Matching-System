package com.internship.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record GoogleLoginRequest(
    @NotBlank @Size(max = 8192) String credential,
    @Size(max = 120) String department,
    @Min(2020) @Max(2100) Integer graduationYear,
    Set<Long> skillIds
) {}
