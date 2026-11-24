package com.internship.dto;

import java.time.LocalDateTime;

public record CommunityPostResponse(
    Long postId,
    Long authorStudentId,
    String authorName,
    String authorDepartment,
    String category,
    String title,
    String body,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    Long upvoteCount,
    Long commentCount,
    boolean upvotedByMe
) {}
