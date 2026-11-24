package com.internship.service;

import com.internship.dto.NetworkOverviewResponse;
import com.internship.dto.StudentNetworkCardResponse;
import com.internship.exception.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class NetworkService {
    private final JdbcTemplate jdbc;
    public NetworkService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public NetworkOverviewResponse overview(Long studentId, String query) {
        ensureStudent(studentId);
        String normalized = query == null ? "" : query.trim().toLowerCase();
        String term = "%" + normalized + "%";
        List<StudentNetworkCardResponse> people = jdbc.query("""
            SELECT s.student_id, s.full_name, s.department, s.graduation_year,
                   p.headline, p.location, p.avatar_url,
                   CASE
                     WHEN EXISTS (SELECT 1 FROM student_connections c
                       WHERE c.status = 'ACCEPTED'
                         AND ((c.requester_student_id = ? AND c.recipient_student_id = s.student_id)
                           OR (c.requester_student_id = s.student_id AND c.recipient_student_id = ?))) THEN 'CONNECTED'
                     WHEN EXISTS (SELECT 1 FROM student_connections c
                       WHERE c.status = 'PENDING' AND c.requester_student_id = ?
                         AND c.recipient_student_id = s.student_id) THEN 'OUTGOING_PENDING'
                     WHEN EXISTS (SELECT 1 FROM student_connections c
                       WHERE c.status = 'PENDING' AND c.requester_student_id = s.student_id
                         AND c.recipient_student_id = ?) THEN 'INCOMING_PENDING'
                     ELSE 'NONE'
                   END AS relationship_status
            FROM students s
            LEFT JOIN student_profiles p ON p.student_id = s.student_id
            WHERE s.student_id <> ?
              AND (? = '' OR LOWER(CONCAT_WS(' ', s.full_name, s.department, p.headline, p.location)) LIKE ?)
            ORDER BY s.created_at DESC, s.student_id DESC LIMIT 100
            """, (rs, rowNum) -> new StudentNetworkCardResponse(
                rs.getLong("student_id"), rs.getString("full_name"), rs.getString("department"),
                (Integer) rs.getObject("graduation_year"), rs.getString("headline"),
                rs.getString("location"), rs.getString("avatar_url"), List.of(),
                rs.getString("relationship_status")),
            studentId, studentId, studentId, studentId, studentId, normalized, term)
            .stream().map(this::withSkills).toList();

        List<StudentNetworkCardResponse> connections = people.stream().filter(p -> "CONNECTED".equals(p.connectionStatus())).toList();
        List<StudentNetworkCardResponse> incoming = people.stream().filter(p -> "INCOMING_PENDING".equals(p.connectionStatus())).toList();
        List<StudentNetworkCardResponse> outgoing = people.stream().filter(p -> "OUTGOING_PENDING".equals(p.connectionStatus())).toList();
        List<StudentNetworkCardResponse> suggestions = people.stream().filter(p -> "NONE".equals(p.connectionStatus())).toList();
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM student_connections
            WHERE status = 'ACCEPTED' AND (requester_student_id = ? OR recipient_student_id = ?)
            """, Long.class, studentId, studentId);
        return new NetworkOverviewResponse(count == null ? 0L : count, connections, incoming, outgoing, suggestions);
    }

    public String relationshipStatus(Long viewerId, Long otherId) {
        if (viewerId.equals(otherId)) return "SELF";
        List<ConnectionRow> rows = jdbc.query("""
            SELECT requester_student_id, recipient_student_id, status FROM student_connections
            WHERE (requester_student_id = ? AND recipient_student_id = ?)
               OR (requester_student_id = ? AND recipient_student_id = ?)
            """, (rs, rowNum) -> new ConnectionRow(rs.getLong(1), rs.getLong(2), rs.getString(3)),
            viewerId, otherId, otherId, viewerId);
        if (rows.isEmpty()) return "NONE";
        ConnectionRow row = rows.get(0);
        if ("ACCEPTED".equals(row.status())) return "CONNECTED";
        return row.requesterId().equals(viewerId) ? "OUTGOING_PENDING" : "INCOMING_PENDING";
    }

    @Transactional
    public String requestConnection(Long requesterId, Long recipientId) {
        ensureStudent(requesterId);
        ensureStudent(recipientId);
        if (requesterId.equals(recipientId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot connect with your own account.");
        List<ConnectionRow> rows = jdbc.query("""
            SELECT requester_student_id, recipient_student_id, status FROM student_connections
            WHERE (requester_student_id = ? AND recipient_student_id = ?)
               OR (requester_student_id = ? AND recipient_student_id = ?) FOR UPDATE
            """, (rs, rowNum) -> new ConnectionRow(rs.getLong(1), rs.getLong(2), rs.getString(3)),
            requesterId, recipientId, recipientId, requesterId);
        if (rows.isEmpty()) {
            jdbc.update("INSERT INTO student_connections (requester_student_id, recipient_student_id, status) VALUES (?, ?, 'PENDING')",
                requesterId, recipientId);
        } else {
            ConnectionRow row = rows.get(0);
            if ("PENDING".equals(row.status()) && row.requesterId().equals(recipientId)) {
                jdbc.update("""
                    UPDATE student_connections SET status = 'ACCEPTED'
                    WHERE requester_student_id = ? AND recipient_student_id = ? AND status = 'PENDING'
                    """, recipientId, requesterId);
            }
        }
        return relationshipStatus(requesterId, recipientId);
    }

    @Transactional
    public void acceptRequest(Long recipientId, Long requesterId) {
        ensureStudent(recipientId);
        int changed = jdbc.update("""
            UPDATE student_connections SET status = 'ACCEPTED'
            WHERE requester_student_id = ? AND recipient_student_id = ? AND status = 'PENDING'
            """, requesterId, recipientId);
        if (changed == 0) throw new NotFoundException("That connection request is no longer pending.");
    }

    @Transactional
    public void removePendingRequest(Long currentId, Long otherId) {
        int changed = jdbc.update("""
            DELETE FROM student_connections WHERE status = 'PENDING'
              AND ((requester_student_id = ? AND recipient_student_id = ?)
                OR (requester_student_id = ? AND recipient_student_id = ?))
            """, currentId, otherId, otherId, currentId);
        if (changed == 0) throw new NotFoundException("No pending connection request was found.");
    }

    @Transactional
    public void removeConnection(Long currentId, Long otherId) {
        int changed = jdbc.update("""
            DELETE FROM student_connections WHERE status = 'ACCEPTED'
              AND ((requester_student_id = ? AND recipient_student_id = ?)
                OR (requester_student_id = ? AND recipient_student_id = ?))
            """, currentId, otherId, otherId, currentId);
        if (changed == 0) throw new NotFoundException("That connection was not found.");
    }

    private StudentNetworkCardResponse withSkills(StudentNetworkCardResponse p) {
        List<String> skills = jdbc.query("""
            SELECT s.skill_name FROM student_skills ss JOIN skills s ON s.skill_id = ss.skill_id
            WHERE ss.student_id = ? ORDER BY s.skill_name
            """, (rs, rowNum) -> rs.getString("skill_name"), p.studentId());
        return new StudentNetworkCardResponse(p.studentId(), p.fullName(), p.department(), p.graduationYear(),
            p.headline(), p.location(), p.avatarUrl(), skills, p.connectionStatus());
    }
    private void ensureStudent(Long id) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM students WHERE student_id = ?", Integer.class, id);
        if (count == null || count == 0) throw new NotFoundException("Student " + id + " was not found.");
    }
    private record ConnectionRow(Long requesterId, Long recipientId, String status) {}
}
