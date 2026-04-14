package com.informaticonfig.spring.app.springboot_applications.cooking.controller;

import com.informaticonfig.spring.app.springboot_applications.cooking.dto.LectureResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.NavigationRequest;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.UserProgressResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.service.EducationalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing endpoints for the cooking education platform.
 *
 * <p>Provides lecture retrieval, user progress queries, and navigation actions
 * (Next, Previous, Complete). Every request extracts the caller's Supabase JWT
 * from the {@code Authorization} header and forwards it to the service layer
 * so that Supabase Row Level Security policies enforce per-user access.
 *
 * <p><strong>Navigation rules:</strong>
 * <ul>
 *   <li><em>Complete</em> — advances linear progression (+1% per lecture, updates streak).</li>
 *   <li><em>Next</em> — moves the lesson pointer forward without altering progress.</li>
 *   <li><em>Previous</em> — moves the lesson pointer backward without altering progress.</li>
 * </ul>
 *
 * @author informaticonfig
 * @since 1.0
 */
@RestController
@RequestMapping("/api")
public class LectureController {

    private static final Logger log = LoggerFactory.getLogger(LectureController.class);

    private final EducationalService educationalService;

    /**
     * Creates the controller with the required educational service dependency.
     *
     * @param educationalService the service handling all business logic
     */
    public LectureController(EducationalService educationalService) {
        this.educationalService = educationalService;
    }

    // ------------------------------------------------------------------
    // Lecture retrieval
    // ------------------------------------------------------------------

    /**
     * Retrieves a single lecture by its identifier, including the localized
     * image path and YouTube link.
     *
     * @param id            the lecture's database identifier
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return the matching {@link LectureResponse}
     */
    @GetMapping("/lectures/{id}")
    public ResponseEntity<LectureResponse> getLecture(
            @PathVariable long id,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("GET /api/lectures/{} requested", id);

        LectureResponse lecture = educationalService.getLectureById(id, jwt);
        return ResponseEntity.ok(lecture);
    }

    /**
     * Retrieves all lectures belonging to a specific unit, ordered by their
     * sort position within the curriculum.
     *
     * @param unitId        the parent unit's identifier
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return a list of {@link LectureResponse} records for the unit
     */
    @GetMapping("/lectures/unit/{unitId}")
    public ResponseEntity<List<LectureResponse>> getLecturesByUnit(
            @PathVariable long unitId,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("GET /api/lectures/unit/{} requested", unitId);

        List<LectureResponse> lectures = educationalService.getLecturesByUnit(unitId, jwt);
        return ResponseEntity.ok(lectures);
    }

    // ------------------------------------------------------------------
    // User progress
    // ------------------------------------------------------------------

    /**
     * Retrieves the current progress and streak data for a user.
     *
     * @param userId        the Supabase auth UUID
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return the user's {@link UserProgressResponse}
     */
    @GetMapping("/users/{userId}/progress")
    public ResponseEntity<UserProgressResponse> getUserProgress(
            @PathVariable String userId,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("GET /api/users/{}/progress requested", userId);

        UserProgressResponse progress = educationalService.getUserProgress(userId, jwt);
        return ResponseEntity.ok(progress);
    }

    // ------------------------------------------------------------------
    // Navigation & completion actions
    // ------------------------------------------------------------------

    /**
     * Marks a lecture as completed for the requesting user.
     *
     * <p>This advances linear progression: increments {@code progress_percentage}
     * by exactly 1% (each of the 100 total lectures equals 1%), updates the daily
     * streak count (used for the frontend animated fire icon), and advances
     * {@code current_lesson_id} to the next lecture.
     *
     * @param id            the lecture being completed
     * @param request       the request body containing the user's id
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return the updated {@link UserProgressResponse}
     */
    @PostMapping("/lectures/{id}/complete")
    public ResponseEntity<UserProgressResponse> completeLecture(
            @PathVariable long id,
            @RequestBody NavigationRequest request,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("POST /api/lectures/{}/complete userId={}", id, request.userId());

        UserProgressResponse updated = educationalService.completeLecture(
                request.userId(), id, jwt);
        return ResponseEntity.ok(updated);
    }

    /**
     * Navigates the user's current lesson pointer to the next lecture in order.
     *
     * <p>This does <strong>not</strong> mark any lecture as completed — progress
     * percentage and streak count remain unchanged.
     *
     * @param request       the request body containing the user's id
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return the updated {@link UserProgressResponse}
     */
    @PostMapping("/lectures/navigate/next")
    public ResponseEntity<UserProgressResponse> navigateNext(
            @RequestBody NavigationRequest request,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("POST /api/lectures/navigate/next userId={}", request.userId());

        UserProgressResponse updated = educationalService.navigateNext(
                request.userId(), jwt);
        return ResponseEntity.ok(updated);
    }

    /**
     * Navigates the user's current lesson pointer to the previous lecture.
     *
     * <p>This is strictly a <strong>backward navigation</strong> — the progress
     * percentage and streak count are never altered by this action.
     *
     * @param request       the request body containing the user's id
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return the updated {@link UserProgressResponse}
     */
    @PostMapping("/lectures/navigate/previous")
    public ResponseEntity<UserProgressResponse> navigatePrevious(
            @RequestBody NavigationRequest request,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("POST /api/lectures/navigate/previous userId={}", request.userId());

        UserProgressResponse updated = educationalService.navigatePrevious(
                request.userId(), jwt);
        return ResponseEntity.ok(updated);
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    /**
     * Extracts the bare JWT token from an {@code Authorization} header value.
     * Strips the {@code "Bearer "} prefix if present.
     *
     * @param authorization the raw header value
     * @return the JWT string
     */
    private String extractJwt(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return authorization;
    }
}
