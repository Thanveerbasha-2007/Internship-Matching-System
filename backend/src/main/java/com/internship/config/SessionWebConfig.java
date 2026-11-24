package com.internship.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SessionWebConfig implements WebMvcConfigurer {
    private final StudentSessionInterceptor studentSessionInterceptor;

    public SessionWebConfig(StudentSessionInterceptor studentSessionInterceptor) {
        this.studentSessionInterceptor = studentSessionInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(studentSessionInterceptor).addPathPatterns("/api/**");
    }
}
