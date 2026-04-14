package com.informaticonfig.spring.app.springboot_applications.cooking.dto;

/**
 * Request body for navigation and completion operations.
 *
 * @param userId the Supabase auth user UUID performing the action
 *
 * @author informaticonfig
 * @since 1.0
 */
public record NavigationRequest(String userId) {}
