package com.internship.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class StudentSessionInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")
            || path.equals("/api/health")
            || path.startsWith("/api/internships")
            || path.startsWith("/api/skills")) {
            return true;
        }

        HttpSession session = request.getSession(false);
        Object studentId = session == null ? null : session.getAttribute("studentId");
        if (!(studentId instanceof Long)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":401,\"message\":\"Please sign in to continue.\"}");
            return false;
        }

        String[] parts = path.split("/");
        if (parts.length >= 4 && "students".equals(parts[2])) {
            try {
                long requestedId = Long.parseLong(parts[3]);
                if (requestedId != (Long) studentId) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":403,\"message\":\"You cannot access another student's profile.\"}");
                    return false;
                }
            } catch (NumberFormatException ignored) {
                // Non-ID student routes such as /api/students/me are authenticated above.
            }
        }
        return true;
    }
}
