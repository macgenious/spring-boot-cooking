# ChefPath: Cooking Education Platform

ChefPath is a Duolingo-inspired cooking education platform designed to guide users through a structured curriculum of culinary skills.

## Project Overview

- **Purpose:** A structured learning platform for cooking, featuring 20 units and 100 total lectures.
- **Architecture:** 
    - **Backend:** Spring Boot (Java 21) REST API. Acts as a secure proxy for Supabase.
    - **Frontend:** Static HTML/JS frontend located in the `docs/` directory, optimized for GitHub Pages.
    - **Database/Auth:** Supabase for user authentication and PostgreSQL database storage.
    - **Design:** Radical minimalism inspired by Ollama (grayscale, pill-shaped elements, zero shadows).

## Core Technologies

- **Java 21 & Spring Boot 4.0.5**: Primary backend framework.
- **Spring WebClient**: Used in `EducationalService` to communicate with Supabase PostgREST.
- **Thymeleaf**: Used for server-side template rendering (though many views are static in `docs/`).
- **Resend SDK**: Handles transactional emails.
- **Supabase JS SDK**: Used in the frontend for authentication and direct database interactions where appropriate.

## Building and Running

### Backend (Spring Boot)
- **Build:** `./mvnw clean package`
- **Run Locally:** `./mvnw spring-boot:run`
- **Start Jar:** `java -jar target/springboot-applications-0.0.1-SNAPSHOT.jar`
- **Tests:** `./mvnw test`

### Frontend (Static)
- The frontend is located in the `docs/` folder.
- **Local Development:** Serve the `docs/` folder using any static file server (e.g., `python -m http.server 8081`).
- **Configuration:** Update `docs/js/config.js` with your backend API URL and Supabase credentials.

## Development Conventions

### UI/UX (Ollama-inspired)
- **Palette:** Strictly grayscale. Primary text `#000000`, Background `#ffffff`, Neutral `#737373`.
- **Typography:** SF Pro Rounded for headings, system sans-serif for body.
- **Geometry:** 
    - **Interactive (Pill):** 9999px border-radius for buttons, inputs, tabs, and tags.
    - **Containers:** 12px border-radius for cards and code blocks.
- **Shadows:** Strictly zero shadows. Use borders (`1px solid #e5e5e5`) for depth.

### Backend Patterns
- **API Base:** All REST endpoints are prefixed with `/api`.
- **JWT Forwarding:** The backend expects a Supabase JWT in the `Authorization` header, which it forwards to Supabase to respect Row Level Security (RLS).
- **Service Layer:** `EducationalService` handles the core logic for progress tracking (1% per lecture) and daily streaks.
I want you to recreate the frontend of the application by looking at the Stitch project I created called "Culinary Streak Minimalist Course" and also at the 

DESIGN.md
file, I also uploaded already all the course data in the 

UNITS.md
file, delete all tables and rows from the supabase project and replace it with the data in this file please. The sum up of the project information is in the 

GEMINI.md
file.
### Database & Content
- **Curriculum:** `UNITS.md` serves as the source of truth for the curriculum content.
- **Storage:** Lectures and User Progress are stored in Supabase tables (`lectures`, `users`, `completed_lectures`).
- **Progression:** Each completed lecture increments progress by exactly 1%.

## Key File Locations

- `src/main/java/.../cooking/controller/`: REST Controllers.
- `src/main/java/.../cooking/service/`: Business logic and Supabase integration.
- `src/main/resources/application.properties`: Backend configuration.
- `docs/`: Frontend source code.
- `UNITS.md`: Curriculum content.
- `DESIGN.md`: Detailed UI/UX specification.
