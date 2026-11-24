package com.internship.service;

import com.internship.dto.CommunityCommentResponse;
import com.internship.dto.CommunityPostResponse;
import com.internship.dto.CommunityStudentProfileResponse;
import com.internship.dto.CreateCommunityCommentRequest;
import com.internship.dto.CreateCommunityPostRequest;
import com.internship.dto.ReportCommunityPostRequest;
import com.internship.dto.UpdateCommunityPostRequest;
import com.internship.exception.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class CommunityService {
    private static final Set<String> CATEGORIES = Set.of(
        "INTERNSHIP_QUESTIONS",
        "EXPERIENCES",
        "INTERVIEW_PREP",
        "CAREER_ADVICE",
        "STUDENT_LIFE",
        "GENERAL"
    );

    private static final String POST_SELECT = """
        SELECT p.post_id, p.author_student_id, s.full_name, s.department,
               p.category, p.title, p.body, p.created_at, p.updated_at,
               (SELECT COUNT(*) FROM community_post_votes v WHERE v.post_id = p.post_id) AS upvote_count,
               (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.post_id) AS comment_count,
               EXISTS(
                   SELECT 1 FROM community_post_votes mine
                   WHERE mine.post_id = p.post_id AND mine.student_id = ?
               ) AS upvoted_by_me
        FROM community_posts p
        JOIN students s ON s.student_id = p.author_student_id
        """;

    private final JdbcTemplate jdbc;

    public CommunityService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<CommunityPostResponse> findPosts(Long viewerId, String sort, String category, String query) {
        StringBuilder sql = new StringBuilder(POST_SELECT).append(" WHERE p.status = 'VISIBLE'");
        List<Object> params = new ArrayList<>();
        params.add(viewerId);

        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
            String normalizedCategory = category.trim().toUpperCase();
            if (!CATEGORIES.contains(normalizedCategory)) {
                throw new IllegalArgumentException("Choose a valid community category.");
            }
            sql.append(" AND p.category = ?");
            params.add(normalizedCategory);
        }

        if (query != null && !query.isBlank()) {
            sql.append(" AND (LOWER(p.title) LIKE ? OR LOWER(p.body) LIKE ? OR LOWER(s.full_name) LIKE ?)");
            String term = "%" + query.trim().toLowerCase() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }

        if ("TOP".equalsIgnoreCase(sort)) {
            sql.append(" ORDER BY upvote_count DESC, comment_count DESC, p.created_at DESC, p.post_id DESC");
        } else {
            sql.append(" ORDER BY p.created_at DESC, p.post_id DESC");
        }

        return jdbc.query(sql.toString(), this::mapPost, params.toArray());
    }

    public CommunityPostResponse findPost(Long postId, Long viewerId) {
        List<CommunityPostResponse> posts = jdbc.query(
            POST_SELECT + " WHERE p.status = 'VISIBLE' AND p.post_id = ?",
            this::mapPost,
            viewerId,
            postId
        );
        if (posts.isEmpty()) {
            throw new NotFoundException("Community post " + postId + " was not found.");
        }
        return posts.get(0);
    }

    @Transactional
    public CommunityPostResponse createPost(Long authorId, CreateCommunityPostRequest request) {
        ensureStudent(authorId);
        String category = normalizeCategory(request.category());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO community_posts (author_student_id, category, title, body) VALUES (?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, authorId);
            statement.setString(2, category);
            statement.setString(3, request.title().trim());
            statement.setString(4, request.body().trim());
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("The community post was created but no ID was returned.");
        return findPost(key.longValue(), authorId);
    }

    @Transactional
    public CommunityPostResponse updatePost(Long postId, Long studentId, UpdateCommunityPostRequest request) {
        ensurePostOwner(postId, studentId);
        jdbc.update(
            "UPDATE community_posts SET category = ?, title = ?, body = ? WHERE post_id = ? AND status = 'VISIBLE'",
            normalizeCategory(request.category()),
            request.title().trim(),
            request.body().trim(),
            postId
        );
        return findPost(postId, studentId);
    }

    @Transactional
    public void deletePost(Long postId, Long studentId) {
        ensurePostOwner(postId, studentId);
        jdbc.update(
            "UPDATE community_posts SET status = 'DELETED' WHERE post_id = ? AND status = 'VISIBLE'",
            postId
        );
    }

    public List<CommunityCommentResponse> findComments(Long postId) {
        findPost(postId, 0L);
        return jdbc.query(
            """
            SELECT c.comment_id, c.post_id, c.author_student_id, s.full_name,
                   s.department, c.body, c.created_at, c.updated_at
            FROM community_comments c
            JOIN students s ON s.student_id = c.author_student_id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC, c.comment_id ASC
            """,
            this::mapComment,
            postId
        );
    }

    @Transactional
    public CommunityCommentResponse createComment(Long postId, Long authorId, CreateCommunityCommentRequest request) {
        ensureStudent(authorId);
        findPost(postId, authorId);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO community_comments (post_id, author_student_id, body) VALUES (?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, postId);
            statement.setLong(2, authorId);
            statement.setString(3, request.body().trim());
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("The comment was created but no ID was returned.");
        return findComment(key.longValue());
    }

    @Transactional
    public void deleteComment(Long commentId, Long studentId) {
        List<Long> owners = jdbc.query(
            "SELECT author_student_id FROM community_comments WHERE comment_id = ?",
            (rs, rowNum) -> rs.getLong(1),
            commentId
        );
        if (owners.isEmpty()) throw new NotFoundException("Community comment " + commentId + " was not found.");
        if (!owners.get(0).equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can delete only your own comment.");
        }
        jdbc.update("DELETE FROM community_comments WHERE comment_id = ?", commentId);
    }

    @Transactional
    public CommunityPostResponse upvote(Long postId, Long studentId) {
        ensureStudent(studentId);
        findPost(postId, studentId);
        jdbc.update(
            "INSERT IGNORE INTO community_post_votes (post_id, student_id) VALUES (?, ?)",
            postId,
            studentId
        );
        return findPost(postId, studentId);
    }

    @Transactional
    public CommunityPostResponse removeUpvote(Long postId, Long studentId) {
        ensureStudent(studentId);
        findPost(postId, studentId);
        jdbc.update(
            "DELETE FROM community_post_votes WHERE post_id = ? AND student_id = ?",
            postId,
            studentId
        );
        return findPost(postId, studentId);
    }

    @Transactional
    public void reportPost(Long postId, Long reporterId, ReportCommunityPostRequest request) {
        ensureStudent(reporterId);
        findPost(postId, reporterId);
        String details = request.details() == null ? null : request.details().trim();
        jdbc.update(
            """
            INSERT IGNORE INTO community_reports (post_id, reporter_student_id, reason, details)
            VALUES (?, ?, ?, ?)
            """,
            postId,
            reporterId,
            request.reason().trim().toUpperCase(),
            details == null || details.isEmpty() ? null : details
        );
    }

    public CommunityStudentProfileResponse findStudentProfile(Long studentId, Long viewerId) {
        List<CommunityStudentProfileBase> profiles = jdbc.query(
            """
            SELECT s.student_id, s.full_name, s.department, s.graduation_year,
                   (SELECT COUNT(*) FROM community_posts p
                    WHERE p.author_student_id = s.student_id AND p.status = 'VISIBLE') AS discussion_count,
                   (SELECT COUNT(*) FROM community_comments c
                    WHERE c.author_student_id = s.student_id) AS comment_count
            FROM students s
            WHERE s.student_id = ?
            """,
            (rs, rowNum) -> new CommunityStudentProfileBase(
                rs.getLong("student_id"),
                rs.getString("full_name"),
                rs.getString("department"),
                (Integer) rs.getObject("graduation_year"),
                rs.getLong("discussion_count"),
                rs.getLong("comment_count")
            ),
            studentId
        );
        if (profiles.isEmpty()) {
            throw new NotFoundException("Student " + studentId + " was not found.");
        }

        CommunityStudentProfileBase profile = profiles.get(0);
        List<String> skills = jdbc.query(
            """
            SELECT s.skill_name
            FROM student_skills ss
            JOIN skills s ON s.skill_id = ss.skill_id
            WHERE ss.student_id = ?
            ORDER BY s.skill_name
            """,
            (rs, rowNum) -> rs.getString("skill_name"),
            studentId
        );

        List<CommunityPostResponse> recentDiscussions = findStudentPosts(studentId, viewerId, false);
        List<CommunityPostResponse> experiencePosts = findStudentPosts(studentId, viewerId, true);

        return new CommunityStudentProfileResponse(
            profile.studentId(),
            profile.fullName(),
            profile.department(),
            profile.graduationYear(),
            skills,
            profile.discussionCount(),
            profile.commentCount(),
            recentDiscussions,
            experiencePosts
        );
    }

    private List<CommunityPostResponse> findStudentPosts(Long studentId, Long viewerId, boolean experiencesOnly) {
        StringBuilder sql = new StringBuilder(POST_SELECT)
            .append(" WHERE p.status = 'VISIBLE' AND p.author_student_id = ?");
        if (experiencesOnly) {
            sql.append(" AND p.category = 'EXPERIENCES'");
        }
        sql.append(" ORDER BY p.created_at DESC, p.post_id DESC LIMIT ")
            .append(experiencesOnly ? "5" : "10");
        return jdbc.query(sql.toString(), this::mapPost, viewerId, studentId);
    }

    private record CommunityStudentProfileBase(Long studentId, String fullName, String department, Integer graduationYear, Long discussionCount, Long commentCount) {}\n\n    private CommunityCommentResponse findComment(Long commentId) {
        List<CommunityCommentResponse> comments = jdbc.query(
            """
            SELECT c.comment_id, c.post_id, c.author_student_id, s.full_name,
                   s.department, c.body, c.created_at, c.updated_at
            FROM community_comments c
            JOIN students s ON s.student_id = c.author_student_id
            WHERE c.comment_id = ?
            """,
            this::mapComment,
            commentId
        );
        if (comments.isEmpty()) throw new NotFoundException("Community comment " + commentId + " was not found.");
        return comments.get(0);
    }

    private void ensureStudent(Long studentId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM students WHERE student_id = ?",
            Integer.class,
            studentId
        );
        if (count == null || count == 0) throw new NotFoundException("Student " + studentId + " was not found.");
    }

    private void ensurePostOwner(Long postId, Long studentId) {
        List<Long> owners = jdbc.query(
            "SELECT author_student_id FROM community_posts WHERE post_id = ? AND status = 'VISIBLE'",
            (rs, rowNum) -> rs.getLong(1),
            postId
        );
        if (owners.isEmpty()) throw new NotFoundException("Community post " + postId + " was not found.");
        if (!owners.get(0).equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can edit or delete only your own post.");
        }
    }

    private String normalizeCategory(String category) {
        String normalized = category.trim().toUpperCase();
        if (!CATEGORIES.contains(normalized)) throw new IllegalArgumentException("Choose a valid community category.");
        return normalized;
    }

    private CommunityPostResponse mapPost(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new CommunityPostResponse(
            rs.getLong("post_id"),
            rs.getLong("author_student_id"),
            rs.getString("full_name"),
            rs.getString("department"),
            rs.getString("category"),
            rs.getString("title"),
            rs.getString("body"),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at")),
            rs.getLong("upvote_count"),
            rs.getLong("comment_count"),
            rs.getBoolean("upvoted_by_me")
        );
    }

    private CommunityCommentResponse mapComment(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new CommunityCommentResponse(
            rs.getLong("comment_id"),
            rs.getLong("post_id"),
            rs.getLong("author_student_id"),
            rs.getString("full_name"),
            rs.getString("department"),
            rs.getString("body"),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at"))
        );
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
