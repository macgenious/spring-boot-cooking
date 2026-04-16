package com.informaticonfig.spring.app.springboot_applications.cooking.controller;

import com.informaticonfig.spring.app.springboot_applications.cooking.dto.SendEmailRequest;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.SendEmailResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller that exposes the transactional e-mail endpoint.
 *
 * <h2>Endpoint</h2>
 * <pre>POST /api/email/send</pre>
 *
 * <h2>Request body (JSON)</h2>
 * <pre>
 * {
 *   "to":      "recipient@example.com",
 *   "subject": "Hello from Cooking Platform",
 *   "html":    "&lt;p&gt;Your message here&lt;/p&gt;"
 * }
 * </pre>
 *
 * <h2>Response (201 Created)</h2>
 * <pre>
 * {
 *   "id":      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *   "message": "Email sent successfully."
 * }
 * </pre>
 *
 * <p>Errors are handled by {@code GlobalExceptionHandler} and will return a
 * standardized {@code ErrorResponse} body.
 *
 * @author informaticonfig
 * @since 1.0
 */
@RestController
@RequestMapping("/api/email")
public class EmailController {

    private static final Logger log = LoggerFactory.getLogger(EmailController.class);

    private final EmailService emailService;

    /**
     * Constructs the controller with the required email service dependency.
     *
     * @param emailService the service responsible for dispatching e-mails
     */
    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Sends a transactional e-mail using the Resend API.
     *
     * @param request the request payload containing recipient, subject, and HTML body
     * @return {@code 201 Created} with the Resend message ID on success
     */
    @PostMapping("/send")
    public ResponseEntity<SendEmailResponse> send(@RequestBody SendEmailRequest request) {
        log.info("POST /api/email/send to={}", request.to());
        SendEmailResponse response = emailService.send(request);
        return ResponseEntity.status(201).body(response);
    }
}
