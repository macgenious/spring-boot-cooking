package com.informaticonfig.spring.app.springboot_applications.cooking.dto;

/**
 * Immutable response payload representing a single lecture.
 *
 * @param id          the lecture's database identifier
 * @param unitId      the parent unit's identifier
 * @param title       the lecture title
 * @param description a text description of the lecture's content
 * @param youtubeLink a YouTube video URL for the lecture
 * @param imagePath   a local image path for the lecture's visual
 * @param sortOrder   the lecture's linear position (1–100)
 *
 * @author informaticonfig
 * @since 1.0
 */
public record LectureResponse(
        long id,
        long unitId,
        String title,
        String description,
        String youtubeLink,
        String imagePath,
        int sortOrder
) {}
