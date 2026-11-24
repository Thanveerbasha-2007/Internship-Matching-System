package com.internship.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCommunityPostRequest(
    @NotBlank
    @Pattern(regexp = "INTERNSHIP_QUESTIONS|EXPERIENCES|INTERVIEW_PREP|CAREER_ADVICE|STUDENT_LIFE|GENERAL")
    String category,
    @NotBlank @Size(max = 180) String title,
    @NotBlank @Size(max = 10000) String body
) {}
