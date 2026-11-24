package com.internship.controller;

import com.internship.dto.SkillResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private final JdbcTemplate jdbcTemplate;

    public SkillController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<SkillResponse> getSkills() {
        return jdbcTemplate.query(
            "SELECT skill_id, skill_name, category FROM skills ORDER BY skill_name",
            (rs, rowNum) -> new SkillResponse(
                rs.getLong("skill_id"),
                rs.getString("skill_name"),
                rs.getString("category")
            )
        );
    }
}
