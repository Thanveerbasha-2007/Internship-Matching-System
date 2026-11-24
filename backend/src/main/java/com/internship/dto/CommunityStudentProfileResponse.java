package com.internship.dto;

import java.util.List;

public record CommunityStudentProfileResponse(
    Long studentId,
    String fullName,
    String department,
    Integer graduationYear,
    List<String> skills,
    Long discussionCount,
    Long commentCount,
    List<CommunityPostResponse> recentDiscussions,
    List<CommunityPostResponse> experiencePosts
) {}
