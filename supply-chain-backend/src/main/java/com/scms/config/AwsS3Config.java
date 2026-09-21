package com.scms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsS3Config {

    @Value("${scms.aws.s3.access-key}")
    private String accessKey;

    @Value("${scms.aws.s3.secret-key}")
    private String secretKey;

    @Value("${scms.aws.s3.region}")
    private String region;

    private software.amazon.awssdk.auth.credentials.AwsCredentialsProvider getCredentialsProvider() {
        if (accessKey == null || accessKey.isBlank() || accessKey.equalsIgnoreCase("dummy") || accessKey.contains("AWS_ACCESS_KEY_ID") ||
            secretKey == null || secretKey.isBlank() || secretKey.equalsIgnoreCase("dummy") || secretKey.contains("AWS_SECRET_ACCESS_KEY")) {
            System.out.println("[S3-CONFIG] S3 credentials missing or dummy. Using DefaultCredentialsProvider.");
            return software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider.create();
        }
        System.out.println("[S3-CONFIG] Using configured StaticCredentialsProvider.");
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
    }

    @Bean
    @org.springframework.context.annotation.Lazy
    public S3Client s3Client() {
        System.out.println("[S3-CONFIG] Initializing S3Client Bean lazily...");
        System.out.println("[S3-CONFIG] Target Region: " + region);
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(getCredentialsProvider())
                .build();
    }

    @Bean
    @org.springframework.context.annotation.Lazy
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(getCredentialsProvider())
                .build();
    }
}
