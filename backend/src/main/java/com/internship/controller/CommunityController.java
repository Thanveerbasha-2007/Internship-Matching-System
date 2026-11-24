package com.internship.controller;

import com.internship.dto.CommunityCommentResponse;
import com.internship.dto.CommunityPostResponse;
import com.internship.dto.CreateCommunityCommentRequest;
import com.internship.dto.CreateCommunityPostRequest;
import com.internship.dto.ReportCommunityPostRequest;
import com.internship.dto.UpdateCommunityPostRequest;
import com.internship.service.CommunityService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
public class CommunityController {
    private final CommunityService community;

    public CommunityController(CommunityService community) {
        this.community = community;
    }

    @GetMapping("/posts")
    public List<CommunityPostResponse> posts(
        @RequestParam(defaultValue = "NEWEST") String sort,
        @RequestParam(defaultValue = "ALL") String category,
        @RequestParam(required = false) String q,
        HttpSession session
    ) {
        return community.findPosts(currentStudentId(session), sort, category, q);
    }

    @GetMapping("/posts/{postId}")
    public CommunityPostResponse post(@PathVariable Long postId, HttpSession session) {
        return community.findPost(postId, currentStudentId(session));
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityPostResponse createPost(
        @Valid @RequestBody CreateCommunityPostRequest request,
        HttpSession session
    ) {
        return community.createPost(currentStudentId(session), request);
    }

    @PutMapping("/posts/{postId}")
    public CommunityPostResponse updatePost(
        @PathVariable Long postId,
        @Valid @RequestBody UpdateCommunityPostRequest request,
        HttpSession session
    ) {
        return community.updatePost(postId, currentStudentId(session), request);
    }

    @DeleteMapping("/posts/{postId}")
    public Map<String, String> deletePost(@PathVariable Long postId, HttpSession session) {
        community.deletePost(postId, currentStudentId(session));
        return Map.of("message", "Post deleted.");
    }

    @PostMapping("/posts/{postId}/upvote")
    public CommunityPostResponse upvote(@PathVariable Long postId, HttpSession session) {
        return community.upvote(postId, currentStudentId(session));
    }

    @DeleteMapping("/posts/{postId}/upvote")
    public CommunityPostResponse removeUpvote(@PathVariable Long postId, HttpSession session) {
        return community.removeUpvote(postId, currentStudentId(session));
    }

    @GetMapping("/posts/{postId}/comments")
    public List<CommunityCommentResponse> comments(@PathVariable Long postId) {
        return community.findComments(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityCommentResponse createComment(
        @PathVariable Long postId,
        @Valid @RequestBody CreateCommunityCommentRequest request,
        HttpSession session
    ) {
        return community.createComment(postId, currentStudentId(session), request);
    }

    @DeleteMapping("/comments/{commentId}")
    public Map<String, String> deleteComment(@PathVariable Long commentId, HttpSession session) {
        community.deleteComment(commentId, currentStudentId(session));
        return Map.of("message", "Comment deleted.");
    }

    @PostMapping("/posts/{postId}/report")
    public Map<String, String> report(
        @PathVariable Long postId,
        @Valid @RequestBody ReportCommunityPostRequest request,
        HttpSession session
    ) {
        community.reportPost(postId, currentStudentId(session), request);
        return Map.of("message", "Thanks. Your report has been recorded for review.");
    }

    private Long currentStudentId(HttpSession session) {
        return (Long) session.getAttribute("studentId");
    }
}
