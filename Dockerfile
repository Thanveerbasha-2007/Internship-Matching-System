# Build the React frontend first.
FROM node:22-alpine AS frontend-build
WORKDIR /frontend

COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Package the Spring Boot API and the built React assets into one application.
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace

COPY backend/pom.xml ./pom.xml
COPY backend/src ./src
COPY --from=frontend-build /frontend/dist ./src/main/resources/static
RUN mvn -B -DskipTests package

# Small runtime image.
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=backend-build /workspace/target/internship-matching-api-0.1.0.jar app.jar

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
