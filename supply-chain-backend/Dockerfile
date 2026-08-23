# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Runtime
FROM eclipse-temurin:17-jre

WORKDIR /app

# Install native Tesseract OCR library
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

# Copy local tessdata models into container path
COPY tessdata /app/tessdata

EXPOSE 10000

ENTRYPOINT ["java", \
"-Xms128m", \
"-Xmx256m", \
"-XX:+UseSerialGC", \
"-jar", \
"app.jar"]