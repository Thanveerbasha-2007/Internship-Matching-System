package com.internship.dto;
import java.util.List;
public record StudentNetworkCardResponse(
    Long studentId, String fullName, String department, Integer graduationYear,
    String headline, String location, String avatarUrl, List<String> skills, String connectionStatus,
    Long followerCount, boolean followedByMe
) {}
