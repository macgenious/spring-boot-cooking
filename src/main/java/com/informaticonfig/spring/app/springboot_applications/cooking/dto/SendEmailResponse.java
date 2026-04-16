package com.informaticonfig.spring.app.springboot_applications.cooking.dto;

/**
 * Outbound response payload for the {@code POST /api/email/send} endpoint.
 *
 * @param id      the unique message ID assigned by Resend
 * @param message a human-readable confirmation note
 *
 * @author informaticonfig
 * @since 1.0
 */
public record SendEmailResponse(
        String id,
        String message
) {}
