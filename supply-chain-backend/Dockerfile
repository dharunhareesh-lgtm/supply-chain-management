# ==========================================
# Stage 1: Build Java Spring Boot Application
# ==========================================
FROM maven:3.8.5-openjdk-17 AS builder
WORKDIR /build

# Copy Maven POM and dependency files
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN mvn package -DskipTests -B

# ==========================================
# Stage 2: Runtime Environment with OCR Engine
# ==========================================
FROM openjdk:17-jdk-slim
WORKDIR /app

# Install native Tesseract OCR libraries and English training models
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Copy the built jar from stage 1
COPY --from=builder /build/target/supply-chain-backend-0.0.1-SNAPSHOT.jar app.jar

# Copy local tessdata models into container path
COPY tessdata /app/tessdata

# Expose port and run application
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
