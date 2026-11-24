package com.internship.dto;
import java.util.List;
public record StudentResponse(
    Long studentId, String fullName, String email, String department, Integer graduationYear, List<String> skills,
    String headline, String about, String location, String avatarUrl, String coverImageUrl,
    String linkedinUrl, String githubUrl, String portfolioUrl, String projects, String achievements
) {}
