package com.internship.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AdminInternshipStatusRequest(
    @NotBlank @Pattern(regexp = "OPEN|CLOSED") String status
) {}
