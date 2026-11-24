package com.internship.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InternshipResponse(
    Long internshipId,
    String title,
    String companyName,
    String description,
    String location,
    String workMode,
    Integer durationWeeks,
    BigDecimal stipendAmount,
    LocalDate applicationDeadline,
    String status,
    List<String> requiredSkills
) {}
