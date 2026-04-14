package com.informaticonfig.spring.app.springboot_applications.cooking.exception;

/**
 * Thrown when a lecture cannot be found by its identifier.
 *
 * @author informaticonfig
 * @since 1.0
 */
public class LectureNotFoundException extends RuntimeException {

    private final long lectureId;

    /**
     * Creates a new exception for the given lecture identifier.
     *
     * @param lectureId the identifier that was not found
     */
    public LectureNotFoundException(long lectureId) {
        super("Lecture not found with id: " + lectureId);
        this.lectureId = lectureId;
    }

    /**
     * Returns the lecture identifier that was not found.
     *
     * @return the missing lecture id
     */
    public long getLectureId() {
        return lectureId;
    }
}
