package com.internship.service;

import org.springframework.stereotype.Component;
import java.util.Collection;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Component
public class MatchingCalculator {
    /** Transparent baseline: matched required skills / all distinct required skills. */
    public double score(Collection<String> requiredSkills, Collection<String> studentSkills) {
        Set<String> required = normalize(requiredSkills);
        Set<String> student = normalize(studentSkills);
        if (required.isEmpty()) return 0.0;
        long matched = required.stream().filter(student::contains).count();
        return Math.round((matched * 1000.0) / required.size()) / 10.0;
    }

    private Set<String> normalize(Collection<String> skills) {
        Set<String> result = new HashSet<>();
        if (skills != null) {
            for (String skill : skills) {
                if (skill != null && !skill.isBlank()) result.add(skill.trim().toLowerCase(Locale.ROOT));
            }
        }
        return result;
    }
}
