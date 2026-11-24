package com.internship.dto;

import java.time.LocalDateTime;

public record CommunityCommentResponse(
    Long commentId,
    Long postId,
    Long authorStudentId,
    String authorName,
    String authorDepartment,
    String body,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
