package com.informaticonfig.spring.app.springboot_applications.cooking.dto;

/**
 * Standardized error payload returned by the global exception handler.
 *
 * <p>Designed to suppress all technical stack traces and instead instruct the
 * frontend to display a friendly local image alongside a human-readable message.
 *
 * @param message   a user-friendly error message
 * @param imagePath the path to a local cute error image for the frontend
 * @param timestamp the epoch-millis timestamp when the error occurred
 *
 * @author informaticonfig
 * @since 1.0
 */
public record ErrorResponse(
        String message,
        String imagePath,
        long timestamp
) {}
