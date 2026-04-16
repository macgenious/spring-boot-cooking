package com.informaticonfig.spring.app.springboot_applications.cooking.dto;

/**
 * Inbound request payload for the {@code POST /api/email/send} endpoint.
 *
 * @param to      the recipient e-mail address
 * @param subject the e-mail subject line
 * @param html    the HTML body of the e-mail
 *
 * @author informaticonfig
 * @since 1.0
 */
public record SendEmailRequest(
        String to,
        String subject,
        String html
) {}
