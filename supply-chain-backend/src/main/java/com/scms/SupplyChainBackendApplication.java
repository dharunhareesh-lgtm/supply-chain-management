package com.scms;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SupplyChainBackendApplication {

	public static void main(String[] args) {
		try {
			Dotenv dotenv = Dotenv.configure().directory("../").ignoreIfMissing().load();
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		} catch (Exception e) {
			System.err.println("Could not load root .env file: " + e.getMessage());
		}
		SpringApplication.run(SupplyChainBackendApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner dropObsoleteTables(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
		return args -> {
			String[] tables = {
				"village_aliases", "villages", "location_master", 
				"location_import_history", "location_alias", "coordinates_cache"
			};
			jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
			for (String table : tables) {
				try {
					jdbcTemplate.execute("DROP TABLE IF EXISTS " + table);
					System.out.println("✓ Successfully dropped table " + table + " if existed.");
				} catch (Exception e) {
					System.err.println("Could not drop table " + table + ": " + e.getMessage());
				}
			}
			jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
		};
	}
}
 