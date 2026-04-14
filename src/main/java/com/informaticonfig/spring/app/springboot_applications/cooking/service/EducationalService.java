package com.informaticonfig.spring.app.springboot_applications.cooking.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.LectureResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.UserProgressResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.exception.LectureNotFoundException;
import com.informaticonfig.spring.app.springboot_applications.cooking.exception.ProgressUpdateException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Core educational service that interfaces with Supabase PostgREST to fetch
 * cooking lectures and manage user progression.
 *
 * <p>All database operations are performed through the Supabase REST API.
 * The caller's Supabase JWT is forwarded in every request so that Row Level
 * Security policies enforce per-user data access.
 *
 * <p><strong>Progression rules:</strong>
 * <ul>
 *   <li>Completing any of the 100 total lectures increments progress by exactly 1%.</li>
 *   <li>Daily streak: if last activity was yesterday, streak increments; if earlier,
 *       streak resets to 1; if today, streak is unchanged.</li>
 *   <li>The "Previous" navigation moves backwards without altering progress or streak.</li>
 * </ul>
 *
 * @author informaticonfig
 * @since 1.0
 */
@Service
public class EducationalService {

    private static final Logger log = LoggerFactory.getLogger(EducationalService.class);

    private final WebClient supabaseWebClient;
    private final ObjectMapper objectMapper;
    private final int totalLectures;

    /**
     * Creates the service with a Supabase-configured {@link WebClient}.
     *
     * @param supabaseWebClient the pre-configured Supabase REST client
     * @param objectMapper      Jackson mapper for JSON deserialization
     * @param totalLectures     the total number of lectures in the curriculum
     */
    public EducationalService(
            WebClient supabaseWebClient,
            ObjectMapper objectMapper,
            @Value("${cooking.total-lectures}") int totalLectures) {
        this.supabaseWebClient = supabaseWebClient;
        this.objectMapper = objectMapper;
        this.totalLectures = totalLectures;
    }

    // ------------------------------------------------------------------ 
    // Lecture queries
    // ------------------------------------------------------------------ 

    /**
     * Fetches a single lecture by its database identifier.
     *
     * @param lectureId the lecture id to look up
     * @param jwt       the caller's Supabase JWT for RLS enforcement
     * @return the matching {@link LectureResponse}
     * @throws LectureNotFoundException if no lecture exists with the given id
     */
    public LectureResponse getLectureById(long lectureId, String jwt) {
        log.info("fetch_lecture id={}", lectureId);

        String json = supabaseWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/lectures")
                        .queryParam("id", "eq." + lectureId)
                        .queryParam("select", "id,unit_id,title,description,youtube_link,image_path,sort_order")
                        .build())
                .header("Authorization", "Bearer " + jwt)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        List<Map<String, Object>> rows = parseJsonArray(json);

        if (rows == null || rows.isEmpty()) {
            throw new LectureNotFoundException(lectureId);
        }

        return mapToLectureResponse(rows.getFirst());
    }

    /**
     * Fetches all lectures belonging to a specific unit, ordered by sort position.
     *
     * @param unitId the parent unit's id
     * @param jwt    the caller's Supabase JWT for RLS enforcement
     * @return a list of {@link LectureResponse} records, possibly empty
     */
    public List<LectureResponse> getLecturesByUnit(long unitId, String jwt) {
        log.info("fetch_lectures_by_unit unitId={}", unitId);

        String json = supabaseWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/lectures")
                        .queryParam("unit_id", "eq." + unitId)
                        .queryParam("select", "id,unit_id,title,description,youtube_link,image_path,sort_order")
                        .queryParam("order", "sort_order.asc")
                        .build())
                .header("Authorization", "Bearer " + jwt)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        List<Map<String, Object>> rows = parseJsonArray(json);

        return rows.stream()
                .map(this::mapToLectureResponse)
                .toList();
    }

    // ------------------------------------------------------------------ 
    // User progress
    // ------------------------------------------------------------------ 

    /**
     * Retrieves the current user's progress and streak data.
     *
     * @param userId the Supabase auth UUID
     * @param jwt    the caller's Supabase JWT for RLS enforcement
     * @return the user's {@link UserProgressResponse}
     * @throws ProgressUpdateException if the user record cannot be found
     */
    public UserProgressResponse getUserProgress(String userId, String jwt) {
        log.info("fetch_user_progress userId={}", userId);

        String json = supabaseWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users")
                        .queryParam("id", "eq." + userId)
                        .queryParam("select", "id,current_lesson_id,progress_percentage,streak_count")
                        .build())
                .header("Authorization", "Bearer " + jwt)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        List<Map<String, Object>> rows = parseJsonArray(json);

        if (rows == null || rows.isEmpty()) {
            throw new ProgressUpdateException("User record not found for userId: " + userId);
        }

        Map<String, Object> user = rows.getFirst();
        return new UserProgressResponse(
                userId,
                toLong(user.get("current_lesson_id")),
                toInt(user.get("progress_percentage")),
                toInt(user.get("streak_count"))
        );
    }

    // ------------------------------------------------------------------ 
    // Completion & navigation
    // ------------------------------------------------------------------ 

    /**
     * Marks a lecture as completed for the given user.
     *
     * <p>This method:
     * <ol>
     *   <li>Inserts a record into {@code completed_lectures} (idempotent via UPSERT).</li>
     *   <li>Increments the user's {@code progress_percentage} by exactly 1% (100 lectures = 100%).</li>
     *   <li>Updates the user's daily streak based on {@code last_activity_date}.</li>
     *   <li>Advances {@code current_lesson_id} to the next lecture.</li>
     * </ol>
     *
     * @param userId    the Supabase auth UUID
     * @param lectureId the lecture being completed
     * @param jwt       the caller's Supabase JWT for RLS enforcement
     * @return the updated {@link UserProgressResponse}
     * @throws ProgressUpdateException if the update operation fails
     */
    public UserProgressResponse completeLecture(String userId, long lectureId, String jwt) {
        log.info("complete_lecture userId={} lectureId={}", userId, lectureId);

        // 1. Record the completion (ON CONFLICT to make it idempotent)
        insertCompletedLecture(userId, lectureId, jwt);

        // 2. Fetch current user state to calculate streak
        UserProgressResponse current = getUserProgress(userId, jwt);

        // 3. Calculate new values
        int newProgress = Math.min(current.progressPercentage() + 1, 100);
        int newStreak = calculateStreak(userId, jwt);
        long nextLessonId = Math.min(lectureId + 1, totalLectures);

        // 4. Update user record
        updateUserProgress(userId, newProgress, newStreak, nextLessonId, jwt);

        return new UserProgressResponse(userId, nextLessonId, newProgress, newStreak);
    }

    /**
     * Advances the user's {@code current_lesson_id} to the next lecture in order.
     *
     * <p>This does <strong>not</strong> mark any lecture as completed and does not
     * alter progress or streak.
     *
     * @param userId the Supabase auth UUID
     * @param jwt    the caller's Supabase JWT for RLS enforcement
     * @return the updated {@link UserProgressResponse}
     */
    public UserProgressResponse navigateNext(String userId, String jwt) {
        log.info("navigate_next userId={}", userId);

        UserProgressResponse current = getUserProgress(userId, jwt);
        long nextLessonId = Math.min(current.currentLessonId() + 1, totalLectures);

        updateCurrentLesson(userId, nextLessonId, jwt);

        return new UserProgressResponse(
                userId, nextLessonId,
                current.progressPercentage(),
                current.streakCount()
        );
    }

    /**
     * Moves the user's {@code current_lesson_id} to the previous lecture.
     *
     * <p>This is a <strong>read-only navigation</strong> — progress percentage and
     * streak count are never altered by going backwards.
     *
     * @param userId the Supabase auth UUID
     * @param jwt    the caller's Supabase JWT for RLS enforcement
     * @return the updated {@link UserProgressResponse}
     */
    public UserProgressResponse navigatePrevious(String userId, String jwt) {
        log.info("navigate_previous userId={}", userId);

        UserProgressResponse current = getUserProgress(userId, jwt);
        long previousLessonId = Math.max(current.currentLessonId() - 1, 1);

        updateCurrentLesson(userId, previousLessonId, jwt);

        return new UserProgressResponse(
                userId, previousLessonId,
                current.progressPercentage(),
                current.streakCount()
        );
    }

    // ------------------------------------------------------------------ 
    // Private helpers — Supabase REST calls
    // ------------------------------------------------------------------ 

    /**
     * Inserts a completion record. Uses PostgREST's conflict resolution header
     * to make the operation idempotent.
     */
    private void insertCompletedLecture(String userId, long lectureId, String jwt) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "user_id", userId,
                    "lecture_id", lectureId
            ));

            supabaseWebClient.post()
                    .uri("/completed_lectures")
                    .header("Authorization", "Bearer " + jwt)
                    .header("Prefer", "resolution=merge-duplicates")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("inserted_completion userId={} lectureId={}", userId, lectureId);
        } catch (JsonProcessingException e) {
            throw new ProgressUpdateException("Failed to serialize completion record", e);
        }
    }

    /**
     * Calculates the daily streak based on {@code last_activity_date}.
     *
     * <ul>
     *   <li>If last activity was yesterday → streak increments by 1.</li>
     *   <li>If last activity was earlier than yesterday → streak resets to 1.</li>
     *   <li>If last activity is today → streak remains unchanged.</li>
     * </ul>
     */
    private int calculateStreak(String userId, String jwt) {
        String json = supabaseWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users")
                        .queryParam("id", "eq." + userId)
                        .queryParam("select", "streak_count,last_activity_date")
                        .build())
                .header("Authorization", "Bearer " + jwt)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        List<Map<String, Object>> rows = parseJsonArray(json);

        if (rows == null || rows.isEmpty()) {
            return 1;
        }

        Map<String, Object> user = rows.getFirst();
        int currentStreak = toInt(user.get("streak_count"));
        Object lastActivityRaw = user.get("last_activity_date");

        if (lastActivityRaw == null) {
            return 1;
        }

        LocalDate lastActivity = LocalDate.parse(lastActivityRaw.toString());
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        if (lastActivity.equals(today)) {
            // Already active today — no change
            return currentStreak;
        } else if (lastActivity.equals(yesterday)) {
            // Consecutive day — increment
            return currentStreak + 1;
        } else {
            // Streak broken — reset
            return 1;
        }
    }

    /**
     * Updates the user's progress percentage, streak count, current lesson, and
     * last activity date in a single PATCH call.
     */
    private void updateUserProgress(String userId, int progress, int streak,
                                    long currentLessonId, String jwt) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "progress_percentage", progress,
                    "streak_count", streak,
                    "current_lesson_id", currentLessonId,
                    "last_activity_date", LocalDate.now().toString(),
                    "updated_at", java.time.Instant.now().toString()
            ));

            supabaseWebClient.patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/users")
                            .queryParam("id", "eq." + userId)
                            .build())
                    .header("Authorization", "Bearer " + jwt)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("updated_user_progress userId={} progress={}% streak={} lesson={}",
                    userId, progress, streak, currentLessonId);
        } catch (JsonProcessingException e) {
            throw new ProgressUpdateException("Failed to serialize user progress update", e);
        }
    }

    /**
     * Updates only the user's current lesson pointer (for Next/Previous navigation).
     */
    private void updateCurrentLesson(String userId, long currentLessonId, String jwt) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "current_lesson_id", currentLessonId,
                    "updated_at", java.time.Instant.now().toString()
            ));

            supabaseWebClient.patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/users")
                            .queryParam("id", "eq." + userId)
                            .build())
                    .header("Authorization", "Bearer " + jwt)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("updated_current_lesson userId={} lesson={}", userId, currentLessonId);
        } catch (JsonProcessingException e) {
            throw new ProgressUpdateException("Failed to serialize lesson navigation update", e);
        }
    }

    // ------------------------------------------------------------------ 
    // JSON utilities
    // ------------------------------------------------------------------ 

    /**
     * Parses a JSON array string returned by Supabase PostgREST.
     */
    private List<Map<String, Object>> parseJsonArray(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new ProgressUpdateException("Failed to parse Supabase response", e);
        }
    }

    /**
     * Maps a raw Supabase row to a {@link LectureResponse} record.
     */
    private LectureResponse mapToLectureResponse(Map<String, Object> row) {
        return new LectureResponse(
                toLong(row.get("id")),
                toLong(row.get("unit_id")),
                (String) row.get("title"),
                (String) row.get("description"),
                (String) row.get("youtube_link"),
                (String) row.get("image_path"),
                toInt(row.get("sort_order"))
        );
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }
}
