package com.informaticonfig.spring.app.springboot_applications.cooking.exception;

import com.informaticonfig.spring.app.springboot_applications.cooking.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Global exception handler that intercepts all exceptions from the cooking
 * platform's service and controller layers.
 *
 * <p>This handler <strong>completely suppresses</strong> standard technical
 * stack traces in API responses. Instead, it returns a standardized
 * {@link ErrorResponse} payload instructing the frontend to display a local
 * cute image alongside a user-friendly message.
 *
 * <p>Stack traces are still logged server-side at {@code ERROR} level for
 * debugging, but they never leak to the client.
 *
 * @author informaticonfig
 * @since 1.0
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** The user-friendly message returned for every error. */
    private static final String FRIENDLY_MESSAGE =
            "Oops! The website isn't accessible at the moment.";

    /** The local cute image path the frontend should display. */
    private static final String CUTE_ERROR_IMAGE = "/images/error-cute.png";

    /**
     * Handles {@link LectureNotFoundException}. Returned when a requested
     * lecture does not exist in the database.
     *
     * @param ex the caught exception
     * @return a 404 response with a standardized {@link ErrorResponse}
     */
    @ExceptionHandler(LectureNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleLectureNotFound(LectureNotFoundException ex) {
        log.error("lecture_not_found lectureId={}", ex.getLectureId());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse());
    }

    /**
     * Handles {@link ProgressUpdateException}. Returned when a progress or
     * streak update operation against the database fails.
     *
     * @param ex the caught exception
     * @return a 500 response with a standardized {@link ErrorResponse}
     */
    @ExceptionHandler(ProgressUpdateException.class)
    public ResponseEntity<ErrorResponse> handleProgressUpdateError(ProgressUpdateException ex) {
        log.error("progress_update_failed message={}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse());
    }

    /**
     * Catches any other unhandled exception as a last resort. Prevents raw
     * stack traces from ever reaching the client.
     *
     * @param ex the caught exception
     * @return a 500 response with a standardized {@link ErrorResponse}
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("unhandled_exception type={} message={}", 
                ex.getClass().getSimpleName(), ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse());
    }

    /**
     * Builds the standardized error payload with the friendly message,
     * cute image path, and current timestamp.
     *
     * @return a new {@link ErrorResponse}
     */
    private ErrorResponse buildErrorResponse() {
        return new ErrorResponse(
                FRIENDLY_MESSAGE,
                CUTE_ERROR_IMAGE,
                System.currentTimeMillis()
        );
    }
}
