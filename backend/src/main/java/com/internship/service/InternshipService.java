package com.internship.service;

import com.internship.dto.InternshipResponse;
import com.internship.dto.RecommendationResponse;
import com.internship.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class InternshipService {
    private final JdbcTemplate jdbc;
    private final StudentService students;
    private final MatchingCalculator calculator;

    public InternshipService(JdbcTemplate jdbc, StudentService students, MatchingCalculator calculator) {
        this.jdbc = jdbc;
        this.students = students;
        this.calculator = calculator;
    }

    public List<InternshipResponse> findAll() {
        List<InternshipBase> rows = jdbc.query(BASE_SELECT + """
             WHERE i.status = 'OPEN'
               AND (i.application_deadline IS NULL OR i.application_deadline >= CURRENT_DATE)
             ORDER BY i.created_at DESC
            """, this::mapBase);
        return rows.stream().map(this::withSkills).toList();
    }

    public InternshipResponse findById(Long id) {
        List<InternshipBase> rows = jdbc.query(BASE_SELECT + " WHERE i.internship_id = ?", this::mapBase, id);
        if (rows.isEmpty()) throw new NotFoundException("Internship " + id + " was not found.");
        return withSkills(rows.get(0));
    }

    public List<RecommendationResponse> recommendations(Long studentId) {
        Set<String> studentSkills = new HashSet<>(students.findById(studentId).skills());
        List<RecommendationResponse> result = new ArrayList<>();
        for (InternshipResponse internship : findAll()) {
            Set<String> required = new HashSet<>(internship.requiredSkills());
            List<String> matched = required.stream().filter(studentSkills::contains)
                .sorted(String.CASE_INSENSITIVE_ORDER).toList();
            List<String> missing = required.stream().filter(s -> !studentSkills.contains(s))
                .sorted(String.CASE_INSENSITIVE_ORDER).toList();
            result.add(new RecommendationResponse(
                internship.internshipId(), internship.title(), internship.companyName(),
                internship.description(), internship.location(), internship.workMode(),
                internship.durationWeeks(), internship.stipendAmount(), internship.applicationDeadline(),
                internship.requiredSkills(), matched, missing, calculator.score(required, studentSkills)
            ));
        }
        result.sort(Comparator.comparingDouble(RecommendationResponse::matchScore).reversed()
            .thenComparing(RecommendationResponse::applicationDeadline,
                Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    private InternshipResponse withSkills(InternshipBase row) {
        List<String> skills = jdbc.query("""
            SELECT s.skill_name
            FROM internship_skills ix JOIN skills s ON s.skill_id = ix.skill_id
            WHERE ix.internship_id = ? ORDER BY s.skill_name
            """, (rs, n) -> rs.getString("skill_name"), row.id());
        return new InternshipResponse(row.id(), row.title(), row.company(), row.description(),
            row.location(), row.workMode(), row.duration(), row.stipend(), row.deadline(), row.status(), skills);
    }

    private InternshipBase mapBase(java.sql.ResultSet rs, int n) throws java.sql.SQLException {
        Date date = rs.getDate("application_deadline");
        return new InternshipBase(rs.getLong("internship_id"), rs.getString("title"),
            rs.getString("company_name"), rs.getString("description"), rs.getString("location"),
            rs.getString("work_mode"), (Integer) rs.getObject("duration_weeks"),
            rs.getBigDecimal("stipend_amount"), date == null ? null : date.toLocalDate(),
            rs.getString("status"));
    }

    private static final String BASE_SELECT = """
        SELECT i.internship_id, i.title, i.company_name, i.description, i.location,
               i.work_mode, i.duration_weeks, i.stipend_amount,
               i.application_deadline, i.status
        FROM internships i
        """;

    private record InternshipBase(Long id, String title, String company, String description,
        String location, String workMode, Integer duration, BigDecimal stipend,
        java.time.LocalDate deadline, String status) {}
}
