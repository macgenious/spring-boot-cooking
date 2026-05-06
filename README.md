# 🍳 ChefPath — Learn to Cook, Step by Step

> A cooking education platform built by a 20-year-old who really, truly, does not know how to cook.

---

## 🌱 Why I Built This

I'm 20 years old. Like a lot of people my age, I realized I had no idea how to feed myself beyond instant noodles and toast.

Cooking felt overwhelming — there are thousands of recipes, techniques, and terms that nobody ever taught me. I wanted a platform that felt less like a cookbook and more like a **structured course**, something that holds your hand from "how do I even boil water" all the way to "I can confidently cook a full meal for my friends."

I also wanted to learn **Spring Boot**, **Supabase**, and how to build and deploy a full-stack web application from scratch. ChefPath is the result of combining both of those goals.

**This project is for everyone who:**
- Grown up and doesn't know how to cook
- Is tired of scrolling through 3-page blog posts before getting to a recipe
- Wants a structured, progressive learning path instead of random YouTube rabbit holes
- Is young, curious, and wants to actually understand what they're doing in the kitchen

---

## 📸 What It Does

ChefPath is a **structured cooking curriculum** with **20 units and 100 lectures**, organized from absolute basics to more confident cooking:

| Unit Range | Topic |
|---|---|
| Units 1–3 | Kitchen basics, safety, essential tools |
| Units 4–6 | Heat, knives, and core techniques |
| Units 7–10 | Eggs, grains, vegetables, soups |
| Units 11–14 | Proteins, sauces, world cuisines |
| Units 15–17 | Meal planning, budget cooking, batch prep |
| Units 18–20 | Baking basics, special diets, next steps |

**Key features:**
- 🔥 Daily streak counter — keeps you consistent
- 🎓 Unit-by-unit progression with lecture navigation
- 👤 User accounts via Supabase Auth
- 📱 Works on desktop and mobile
- 🌙 Dark mode support

---

## 🏗️ Architecture

ChefPath uses a **three-layer architecture**:

```
Browser (HTML/CSS/JS)
       │
       ▼
Spring Boot Backend  ←──── acts as a secure API proxy
       │
       ▼
Supabase (PostgreSQL + Auth)
```

### Why a backend proxy?

The Spring Boot backend sits between the browser and Supabase. This is intentional:
- It keeps sensitive keys (service role key, etc.) off the client
- It validates and forwards the user's JWT so Supabase Row Level Security (RLS) works correctly
- It handles email sending via Resend

### Frontend

The frontend is plain **HTML + CSS + Vanilla JavaScript** — no frameworks, no build tools, no bundler. It lives in the `docs/` folder, making it trivially deployable to **GitHub Pages**.

The UI is inspired by [Ollama's](https://ollama.com) radical minimalism: strictly grayscale, pill-shaped interactive elements, zero shadows, clean typography.

### Backend

A **Spring Boot 4** REST API with:
- Async Supabase PostgREST calls
- Thymeleaf for the few server-rendered pages (login, dashboard, profile)
- Resend SDK for transactional emails
- Deployed on **DigitalOcean**

### Database

**Supabase (PostgreSQL)** with four tables:

| Table | Purpose |
|---|---|
| `users` | Stores progress %, streak, current lesson |
| `lectures` | All 100 lecture definitions |
| `units` | The 20 curriculum units |
| `completed_lectures` | Records which lectures each user finished |

Row Level Security (RLS) is enabled on all tables so users can only read and write their own data.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 + Spring Boot 4.0.5 |
| HTTP Client | Spring WebFlux `WebClient` |
| Templates | Thymeleaf |
| Frontend | HTML5 + Vanilla CSS + Vanilla JS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Email | Resend SDK |
| Deployment (backend) | DigitalOcean (Java runtime) |
| Deployment (frontend) | Vanilla js, html5 and css |
| Build tool | Maven |

---

## 🚀 Running Locally

### Prerequisites

- Java 21+
- Maven (or use the included `./mvnw` wrapper)
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for emails)

### 1. Clone the repository

```bash
git clone https://github.com/macgenious/spring-boot-cooking.git
cd spring-boot-cooking
```

### 2. Configure environment variables

Create a `.env` file in the project root (it is gitignored — never commit this):

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
ADMIN_EMAIL=your-admin-email@example.com
```

### 3. Set up the database

Run the SQL in your Supabase SQL editor to create the tables and enable RLS. See the schema in `src/main/resources/` or set it up via the Supabase dashboard.

### 4. Start the backend

```bash
./mvnw spring-boot:run
```

Then open `http://localhost:8081`. Make sure `docs/js/config.js` points to `http://localhost:8081` for local development.

---

## 📁 Project Structure

```
springboot-applications/
├── docs/                         # Static frontend (GitHub Pages)
│   ├── index.html                # Landing / dashboard
│   ├── login.html
│   ├── register.html
│   ├── js/
│   │   ├── config.js             # API URL + Supabase credentials
│   │   ├── app.js                # Main frontend logic
│   │   └── supabase-auth.js      # Auth helpers
│   └── css/
│       └── design-system.css     # Complete design system
│
├── src/main/java/.../cooking/
│   ├── controller/
│   │   └── LectureController.java   # REST endpoints
│   ├── service/
│   │   ├── EducationalService.java  # Progress + streak logic
│   │   └── EmailService.java        # Resend email wrapper
│   ├── config/
│   │   ├── CorsConfig.java
│   │   └── SupabaseClientConfig.java
│   └── exception/
│       └── GlobalExceptionHandler.java
│
├── src/main/resources/
│   ├── templates/                # Thymeleaf server-rendered pages
│   │   ├── dashboard.html
│   │   ├── lectures.html
│   │   ├── lesson.html
│   │   └── profile.html
│   └── application.properties
│
├── UNITS.md                      # Curriculum source of truth (all 100 lectures)
├── DESIGN.md                     # UI/UX specification
├── Dockerfile
├── render.yaml                   # Render deployment config
└── pom.xml
```

---

## 🎓 What I Learned Building This

This was my first real full-stack project deployed to the internet. Here's what I picked up:

**Java & Spring Boot**
- How to structure a Spring Boot project properly (controllers, services, DTOs, config)
- Using `WebClient` for reactive HTTP calls to external APIs (Supabase PostgREST)
- Dependency injection and `@Value` for configuration
- Writing proper Javadoc and meaningful log messages
- Global exception handling to keep API responses clean

**Databases & Security**
- PostgreSQL fundamentals: tables, foreign keys, constraints, indexes
- Supabase Row Level Security (RLS) — how to make data access safe by default
- JWT authentication flow: how tokens are issued, validated, and forwarded
- Why you never expose a service-role key to the browser

**Frontend**
- Building a complete design system from scratch with CSS custom properties
- Making a UI feel alive with micro-animations and transitions without a framework
- How Supabase JS Auth works in a browser (refresh tokens, session persistence)
- Making responsive layouts with CSS Grid and Flexbox

**DevOps & Deployment**
- Dockerizing a Java application with a multi-stage build
- Deploying a Spring Boot app on DigitalOcean
- Managing environment variables securely (`.env` files, never committed)
- CORS — why it exists and how to configure it correctly

**Design**
- Radical minimalism as a design philosophy
- Why grayscale with strong typography can feel more premium than colorful designs
- How to build a curriculum structure that feels approachable and progressive

---

## 🚢 Deployment

### Backend (Render)

The `render.yaml` file at the root configures the Render service. Connect your GitHub repo to Render and add the environment variables from `.env` in the Render dashboard.

```bash
# Build command
mvn clean package -DskipTests

# Start command  
java -jar target/springboot-applications-0.0.1-SNAPSHOT.jar
```

## ⚠️ Disclaimers

**No commercial intent.** This project is entirely non-commercial. It was built as a personal learning project. I am not monetizing it, running ads, or charging for access. Ever.

**Educational purposes only.** All cooking content in the curriculum is for general educational reference. It is not professional culinary advice. Always use common sense in the kitchen, especially when handling heat, sharp tools, and allergens.

**No affiliation.** ChefPath is not affiliated with, endorsed by, or connected to any cooking school, culinary brand, restaurant, or media company.

**Food safety.** Always follow food safety guidelines from a trusted authority (e.g. your local health department). When in doubt about whether food is safe to eat — throw it out.

**Allergies and dietary needs.** The platform does not account for individual allergies, dietary restrictions, or medical conditions. Always check ingredients yourself.

**No offence intended.** Recipes, techniques, and cuisines from around the world are presented with genuine curiosity and respect. If any content feels misrepresented or disrespectful to a culinary tradition, please open an issue — I genuinely want to get it right.

**Use at your own risk.** Cooking involves heat, sharp objects, and raw ingredients. Neither the author nor this platform is responsible for any accidents, injuries, or food disasters that occur.

---

## 🤝 Contributing

This is a personal project, but if you spot a bug, a factual error in the curriculum, or have a suggestion — feel free to open an issue or a pull request. I'm learning too.

---

## 📄 License

This project is open source. Feel free to fork it and build your own version. Just don't sell it.

---

*Made with curiosity, a lot of Stack Overflow, and the genuine desire to one day cook a proper meal — by a 20-year-old who is still figuring it out.* 🍜
