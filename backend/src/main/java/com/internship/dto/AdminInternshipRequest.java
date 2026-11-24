package com.internship.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record AdminInternshipRequest(
    @NotBlank @Size(max = 180) String title,
    @NotBlank @Size(max = 180) String companyName,
    @Size(max = 10000) String description,
    @Size(max = 180) String location,
    @NotBlank @Pattern(regexp = "ONSITE|REMOTE|HYBRID") String workMode,
    @Min(1) @Max(104) Integer durationWeeks,
    @DecimalMin("0.0") BigDecimal stipendAmount,
    LocalDate applicationDeadline,
    @NotBlank @Pattern(regexp = "OPEN|CLOSED") String status,
    Set<@Positive Long> requiredSkillIds
) {}
