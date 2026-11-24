package com.internship.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RecommendationResponse(
    Long internshipId,
    String title,
    String companyName,
    String description,
    String location,
    String workMode,
    Integer durationWeeks,
    BigDecimal stipendAmount,
    LocalDate applicationDeadline,
    List<String> requiredSkills,
    List<String> matchedSkills,
    List<String> missingSkills,
    double matchScore
) {}
