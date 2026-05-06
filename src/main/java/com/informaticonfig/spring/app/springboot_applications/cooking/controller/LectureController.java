package com.informaticonfig.spring.app.springboot_applications.cooking.controller;

import com.informaticonfig.spring.app.springboot_applications.cooking.dto.LectureResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.NavigationRequest;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.SendEmailRequest;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.UserProgressResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.service.EducationalService;
import com.informaticonfig.spring.app.springboot_applications.cooking.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    private final EmailService emailService;

    @Value("${admin.email}")
    private String adminEmail;

    /**
     * Creates the controller with the required dependencies.
     *
     * @param educationalService the service handling all business logic
     * @param emailService       the service for sending transactional emails
     */
    public LectureController(EducationalService educationalService,
                             EmailService emailService) {
        this.educationalService = educationalService;
        this.emailService = emailService;
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
    // Account deletion
    // ------------------------------------------------------------------

    /**
     * Submits an account deletion request.
     *
     * <p>Sends a notification email to the administrator so they can review
     * and manually process the deletion. No data is removed immediately.
     * The user will receive a confirmation email once the admin acts.
     *
     * @param userId        the Supabase auth UUID requesting deletion
     * @param body          JSON body containing {@code email} of the requesting user
     * @param authorization the {@code Authorization} header containing the Supabase JWT
     * @return {@code 200 OK} with a confirmation message
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteAccount(
            @PathVariable String userId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authorization) {

        String jwt = extractJwt(authorization);
        log.info("DELETE /api/users/{} deletion request submitted", userId);

        String userEmail = body.getOrDefault("email", "unknown");

        emailService.send(new SendEmailRequest(
                adminEmail,
                "⚠️ Account Deletion Request — ChefPath",
                "<div style=\"font-family:system-ui,sans-serif;max-width:520px;margin:40px auto;color:#111;\">" +
                "<h2 style=\"font-weight:600;font-size:20px;margin-bottom:8px;\">Deletion Request</h2>" +
                "<p style=\"font-size:15px;color:#555;line-height:1.6;margin-bottom:16px;\">" +
                "A user has requested that their ChefPath account be deleted.</p>" +
                "<table style=\"width:100%;border-collapse:collapse;font-size:14px;\">" +
                "<tr><td style=\"padding:8px;background:#f8f8f8;font-weight:600;\">User Email</td>" +
                "<td style=\"padding:8px;background:#f8f8f8;\">" + userEmail + "</td></tr>" +
                "<tr><td style=\"padding:8px;font-weight:600;\">User ID</td>" +
                "<td style=\"padding:8px;\">" + userId + "</td></tr>" +
                "</table>" +
                "<p style=\"margin-top:24px;font-size:13px;color:#999;\">Review and delete via the Supabase dashboard if approved.</p>" +
                "</div>"
        ));

        log.info("admin_deletion_request_sent userEmail={} userId={}", userEmail, userId);
        return ResponseEntity.ok(Map.of("message", "Your deletion request has been submitted. We will review it and get back to you by email."));
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
