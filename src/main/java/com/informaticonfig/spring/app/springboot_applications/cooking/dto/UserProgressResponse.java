package com.informaticonfig.spring.app.springboot_applications.cooking.dto;

/**
 * Immutable response payload representing a user's current progress.
 *
 * @param userId             the Supabase auth user UUID
 * @param currentLessonId    the lecture the user should see next
 * @param progressPercentage overall completion (0–100), each of 100 lectures = 1%
 * @param streakCount        consecutive daily activity count (drives the fire icon)
 *
 * @author informaticonfig
 * @since 1.0
 */
public record UserProgressResponse(
        String userId,
        long currentLessonId,
        int progressPercentage,
        int streakCount
) {}
