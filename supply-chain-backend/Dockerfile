# ==============================================================================
# Multi-stage Dockerfile for Dravix SCM Backend (Spring Boot 3 + Java 17)
# ==============================================================================

# --- Stage 1: Build Application ---
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy backend source code
COPY src ./src

# Build production jar skipping tests (tests executed in CI)
RUN mvn clean package -DskipTests -B

# --- Stage 2: Production Runtime ---
FROM eclipse-temurin:17-jre-alpine

# Install Tesseract OCR native libraries, data, and curl
RUN apk update && apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-dev \
    tesseract-ocr-data-eng \
    curl \
    libc6-compat

WORKDIR /app

# Create necessary runtime directories
RUN mkdir -p /app/uploads /app/tessdata

# Copy built artifact from builder stage
COPY --from=builder /app/target/supply-chain-backend-*.jar /app/app.jar

# Expose backend HTTP port
EXPOSE 8082

# Configure JVM memory limits, profile, and graceful flags
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENV PORT=8082
ENV TESSDATA_PATH=/app/tessdata

# Healthcheck to verify Spring Boot Actuator health endpoint
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=40s \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]