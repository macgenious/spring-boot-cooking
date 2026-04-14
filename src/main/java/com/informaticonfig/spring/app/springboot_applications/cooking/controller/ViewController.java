package com.informaticonfig.spring.app.springboot_applications.cooking.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * MVC controller that serves Thymeleaf-rendered HTML pages for the
 * cooking education platform.
 *
 * <p>Every view receives the Supabase project URL and publishable
 * anon key so the client-side JavaScript can authenticate users
 * directly against the Supabase GoTrue server. The REST API
 * controller ({@link LectureController}) remains the single source
 * for all data — these pages are thin shells that call that API.
 *
 * <p><strong>Route map:</strong>
 * <ul>
 *   <li>{@code /} and {@code /login} — sign-in / sign-up page</li>
 *   <li>{@code /dashboard} — progress ring and unit list</li>
 *   <li>{@code /lectures} — lecture list for a specific unit</li>
 *   <li>{@code /lecture} — single lecture detail with video and navigation</li>
 * </ul>
 *
 * @author informaticonfig
 * @since 1.0
 */
@Controller
public class ViewController {

    private final String supabaseUrl;
    private final String supabaseAnonKey;

    /**
     * Creates the view controller with injected Supabase configuration.
     *
     * @param supabaseUrl     the Supabase project URL
     * @param supabaseAnonKey the Supabase publishable anon key
     */
    public ViewController(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.anon-key}") String supabaseAnonKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseAnonKey = supabaseAnonKey;
    }

    // ------------------------------------------------------------------
    // Page routes
    // ------------------------------------------------------------------

    /**
     * Root redirect — sends unauthenticated visitors to the login page.
     *
     * @param model the Thymeleaf model
     * @return the login template name
     */
    @GetMapping("/")
    public String index(Model model) {
        addSupabaseAttributes(model);
        return "login";
    }

    /**
     * Login / sign-up page.
     *
     * @param model the Thymeleaf model
     * @return the login template name
     */
    @GetMapping("/login")
    public String login(Model model) {
        addSupabaseAttributes(model);
        return "login";
    }

    /**
     * Main dashboard: progress ring, streak badge, and the ten unit cards.
     *
     * @param model the Thymeleaf model
     * @return the dashboard template name
     */
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        addSupabaseAttributes(model);
        return "dashboard";
    }

    /**
     * Lecture list for a specific unit (selected via {@code ?unitId=N}).
     *
     * @param model the Thymeleaf model
     * @return the lectures list template name
     */
    @GetMapping("/lectures")
    public String lectures(Model model) {
        addSupabaseAttributes(model);
        return "lectures";
    }

    /**
     * Lecture detail view with video player and navigation bar
     * (selected via {@code ?id=N}).
     *
     * @param model the Thymeleaf model
     * @return the lecture detail template name
     */
    @GetMapping("/lecture")
    public String lecture(Model model) {
        addSupabaseAttributes(model);
        return "lecture";
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    /**
     * Injects the Supabase URL and anon key into the model so Thymeleaf
     * can render them as JavaScript variables for client-side auth.
     *
     * @param model the Thymeleaf model to populate
     */
    private void addSupabaseAttributes(Model model) {
        model.addAttribute("supabaseUrl", supabaseUrl);
        model.addAttribute("supabaseAnonKey", supabaseAnonKey);
    }
}
