package com.informaticonfig.spring.app.springboot_applications.cooking.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configures infrastructure beans for the Supabase integration.
 *
 * <p>Provides a {@link WebClient} pre-wired with the Supabase PostgREST
 * base URL and the project's anon API key, as well as a Jackson
 * {@link ObjectMapper} for JSON serialization/deserialization.
 *
 * <p>Every outgoing request includes the {@code apikey} header required by
 * Supabase. The caller's JWT is added per-request by the service layer so
 * that Row Level Security policies enforce per-user access.
 *
 * @author informaticonfig
 * @since 1.0
 */
@Configuration
public class SupabaseClientConfig {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    /**
     * Creates a {@link WebClient} targeting the Supabase PostgREST endpoint.
     *
     * @return a pre-configured {@link WebClient} instance
     */
    @Bean
    public WebClient supabaseWebClient() {
        return WebClient.builder()
                .baseUrl(supabaseUrl + "/rest/v1")
                .defaultHeader("apikey", supabaseAnonKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    /**
     * Provides a Jackson {@link ObjectMapper} for JSON processing.
     *
     * @return a default {@link ObjectMapper} instance
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
