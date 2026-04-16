package com.informaticonfig.spring.app.springboot_applications.cooking.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.SendEmailRequest;
import com.informaticonfig.spring.app.springboot_applications.cooking.dto.SendEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service responsible for dispatching transactional e-mails via the Resend API.
 *
 * <p>All SDK-specific classes ({@link CreateEmailOptions}, {@link CreateEmailResponse})
 * are confined to this layer. Controllers and callers depend only on the project's
 * own DTO types ({@link SendEmailRequest}, {@link SendEmailResponse}).
 *
 * <p>Any {@link ResendException} thrown by the SDK is wrapped in a
 * {@link RuntimeException} so that the global exception handler can intercept it
 * and return a standardized error payload to the client.
 *
 * @author informaticonfig
 * @since 1.0
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    /** The verified "from" address configured in the Resend dashboard. */
    @Value("${resend.from.address:onboarding@resend.dev}")
    private String fromAddress;

    private final Resend resend;

    /**
     * Constructs the service with the injected {@link Resend} client bean.
     *
     * @param resend the Resend HTTP client (configured in {@code ResendConfig})
     */
    public EmailService(Resend resend) {
        this.resend = resend;
    }

    /**
     * Sends a transactional e-mail using the supplied request data.
     *
     * @param request the recipient address, subject, and HTML body
     * @return a {@link SendEmailResponse} containing the Resend message ID
     * @throws RuntimeException if the Resend API returns an error
     */
    public SendEmailResponse send(SendEmailRequest request) {
        log.info("email_send_attempt to={} subject=\"{}\"", request.to(), request.subject());

        CreateEmailOptions options = CreateEmailOptions.builder()
                .from(fromAddress)
                .to(request.to())
                .subject(request.subject())
                .html(request.html())
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(options);
            log.info("email_sent_ok id={} to={}", response.getId(), request.to());
            return new SendEmailResponse(response.getId(), "Email sent successfully.");
        } catch (ResendException ex) {
            log.error("email_send_failed to={} error={}", request.to(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to send email via Resend: " + ex.getMessage(), ex);
        }
    }
}
