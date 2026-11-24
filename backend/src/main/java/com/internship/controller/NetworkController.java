package com.internship.controller;

import com.internship.dto.NetworkOverviewResponse;
import com.internship.service.NetworkService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/network")
public class NetworkController {
    private final NetworkService network;
    public NetworkController(NetworkService network) { this.network = network; }

    @GetMapping
    public NetworkOverviewResponse overview(@RequestParam(required = false) String q, HttpSession session) {
        return network.overview(currentStudentId(session), q);
    }
    @PostMapping("/{studentId}/request")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> request(@PathVariable Long studentId, HttpSession session) {
        return Map.of("relationshipStatus", network.requestConnection(currentStudentId(session), studentId));
    }
    @PatchMapping("/requests/{requesterId}/accept")
    public Map<String, String> accept(@PathVariable Long requesterId, HttpSession session) {
        Long current = currentStudentId(session);
        network.acceptRequest(current, requesterId);
        return Map.of("relationshipStatus", network.relationshipStatus(current, requesterId));
    }
    @DeleteMapping("/requests/{otherStudentId}")
    public Map<String, String> dismiss(@PathVariable Long otherStudentId, HttpSession session) {
        network.removePendingRequest(currentStudentId(session), otherStudentId);
        return Map.of("relationshipStatus", "NONE");
    }
    @DeleteMapping("/connections/{otherStudentId}")
    public Map<String, String> remove(@PathVariable Long otherStudentId, HttpSession session) {
        network.removeConnection(currentStudentId(session), otherStudentId);
        return Map.of("relationshipStatus", "NONE");
    }
    private Long currentStudentId(HttpSession session) { return (Long) session.getAttribute("studentId"); }
}
