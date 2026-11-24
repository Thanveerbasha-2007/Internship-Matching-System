package com.internship.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record StudentUpdateRequest(
    @NotBlank @Size(max = 120) String fullName,
    @Size(max = 120) String department,
    @Min(2020) @Max(2100) Integer graduationYear,
    Set<Long> skillIds,
    @Size(max = 180) String headline,
    @Size(max = 5000) String about,
    @Size(max = 160) String location,
    @Size(max = 500) @Pattern(regexp = "^(https?://[^\\s]+)?$") String avatarUrl,
    @Size(max = 500) @Pattern(regexp = "^(https?://[^\\s]+)?$") String coverImageUrl,
    @Size(max = 500) @Pattern(regexp = "^(https?://[^\\s]+)?$") String linkedinUrl,
    @Size(max = 500) @Pattern(regexp = "^(https?://[^\\s]+)?$") String githubUrl,
    @Size(max = 500) @Pattern(regexp = "^(https?://[^\\s]+)?$") String portfolioUrl,
    @Size(max = 5000) String projects,
    @Size(max = 5000) String achievements
) {}
