package com.internship.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReportCommunityPostRequest(
    @NotBlank @Pattern(regexp = "SPAM|HARASSMENT|MISINFORMATION|INAPPROPRIATE|OTHER") String reason,
    @Size(max = 500) String details
) {}
