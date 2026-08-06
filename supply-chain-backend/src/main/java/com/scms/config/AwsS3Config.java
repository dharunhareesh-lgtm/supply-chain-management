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

    @Bean
    public S3Client s3Client() {
        System.out.println("[S3-CONFIG] Initializing S3Client Bean...");
        System.out.println("[S3-CONFIG] Target Region: " + region);
        System.out.println("[S3-CONFIG] Access Key Present: " + (accessKey != null && !accessKey.isBlank()));
        if (accessKey != null) {
            System.out.println("[S3-CONFIG] Access Key Length: " + accessKey.length());
            System.out.println("[S3-CONFIG] Access Key Value: " + (accessKey.length() > 5 ? accessKey.substring(0, 5) + "..." : accessKey));
        }
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .build();
    }
}
