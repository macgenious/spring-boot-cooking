package com.informaticonfig.spring.app.springboot_applications.cooking.config;

import com.resend.Resend;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the {@link Resend} HTTP client as a singleton Spring bean.
 *
 * <p>The API key is read from the {@code resend.api.key} property, which
 * must be provided via the {@code RESEND_API_KEY} environment variable at
 * runtime. It is intentionally never committed to source control.
 *
 * @author informaticonfig
 * @since 1.0
 */
@Configuration
public class ResendConfig {

    @Value("${resend.api.key}")
    private String apiKey;

    /**
     * Creates and returns a configured {@link Resend} client that can be
     * injected into any Spring-managed bean.
     *
     * @return a ready-to-use {@link Resend} instance
     */
    @Bean
    public Resend resend() {
        return new Resend(apiKey);
    }
}
