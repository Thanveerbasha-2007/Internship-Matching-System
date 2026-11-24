package com.internship.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

class MatchingCalculatorTest {
    private final MatchingCalculator calculator = new MatchingCalculator();

    @Test
    void returnsOneHundredWhenEveryRequiredSkillMatches() {
        assertEquals(100.0, calculator.score(
            List.of("Java", "Spring Boot"), List.of("Java", "Spring Boot", "SQL")));
    }

    @Test
    void returnsFiftyWhenHalfOfRequiredSkillsMatch() {
        assertEquals(50.0, calculator.score(
            List.of("Java", "Spring Boot"), List.of("Java")));
    }

    @Test
    void returnsZeroWhenNoRequiredSkillMatches() {
        assertEquals(0.0, calculator.score(
            List.of("Java", "Spring Boot"), List.of("Python")));
    }

    @Test
    void comparesNamesWithoutCaseSensitivity() {
        assertEquals(100.0, calculator.score(
            List.of("JAVA", "MySQL"), List.of("java", "mysql")));
    }

    @Test
    void returnsZeroForEmptyRequirements() {
        assertEquals(0.0, calculator.score(List.of(), List.of("Java")));
    }
}
