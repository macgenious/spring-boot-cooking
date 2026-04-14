package com.informaticonfig.spring.app.springboot_applications.cooking.exception;

/**
 * Thrown when a progress or streak update operation fails against the database.
 *
 * @author informaticonfig
 * @since 1.0
 */
public class ProgressUpdateException extends RuntimeException {

    /**
     * Creates a new exception with a descriptive message.
     *
     * @param message details about why the progress update failed
     */
    public ProgressUpdateException(String message) {
        super(message);
    }

    /**
     * Creates a new exception with a descriptive message and root cause.
     *
     * @param message details about why the progress update failed
     * @param cause   the underlying exception
     */
    public ProgressUpdateException(String message, Throwable cause) {
        super(message, cause);
    }
}
