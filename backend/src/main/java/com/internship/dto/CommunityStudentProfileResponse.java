package com.internship.dto;
import java.util.List;
public record CommunityStudentProfileResponse(
    Long studentId, String fullName, String department, Integer graduationYear, List<String> skills,
    Long discussionCount, Long commentCount, List<CommunityPostResponse> recentDiscussions,
    List<CommunityPostResponse> experiencePosts,
    String headline, String about, String location, String avatarUrl, String coverImageUrl,
    String linkedinUrl, String githubUrl, String portfolioUrl, String projects, String achievements,
    Long connectionCount, String connectionStatus
) {}
