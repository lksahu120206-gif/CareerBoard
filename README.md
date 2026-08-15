```markdown
# 🚀 CareerBoard

A comprehensive, dynamic job application tracking system designed to streamline the job hunt. CareerBoard allows users to manage their job pipeline, track application analytics, and securely store resumes all in one centralized dashboard. 

This project was built and deployed as part of the **Pinnacle Labs Cloud Computing 2026 Internship Program** to fulfill the "Host a Dynamic Website" task.

---

## ✨ Features

*   **Kanban-Style Pipeline:** Visually track job applications across different stages (Wishlist, Applied, Interviewing, Offer, Rejected) with drag-and-drop functionality.
*   **Real-Time Analytics:** An automated dashboard that calculates response rates, offer rates, and provides a visual breakdown of your active pipeline.
*   **Resume Management Hub:** Securely upload, store, and manage primary resumes using Supabase Storage with strict Row-Level Security (RLS).
*   **Secure Authentication:** User login and registration powered by Supabase Auth (supports Email/Password, Google, and GitHub OAuth).
*   **Customizable UI:** Fully responsive design complete with a seamless Dark/Light mode toggle for an optimal viewing experience.

---

## 🛠️ Tech Stack

**Frontend:**
*   React 
*   TypeScript
*   Vite (Build Tool)
*   CSS (Inline/Module styling for scoped components)

**Backend & Database:**
*   Supabase (PostgreSQL Database)
*   Supabase Auth (Authentication & Authorization)
*   Supabase Storage (Resume File Hosting)

**Hosting & Deployment:**
*   Vercel (Frontend CI/CD & Hosting)

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/lksahu120206-gif/CareerBoard.git](https://github.com/lksahu120206-gif/CareerBoard.git)
cd CareerBoard

```

### 2. Install dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

```

### 4. Database Setup (Supabase)

You will need to configure your Supabase backend with the following tables:

* `jobs`: To store job application cards (company, role, status, salary, dates).
* `resumes`: To store file metadata (name, size, public URL).

**Important:** Ensure your `resumes` storage bucket is created and Row-Level Security (RLS) policies are configured to allow authenticated users to `INSERT` and `DELETE` their own files within their specific `user_id` folder.

### 5. Start the Development Server

```bash
npm run dev

```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 👨‍💻 Author

**Lalit Kishor Sahu**

* GitHub: [@lksahu120206-gif](https://www.google.com/search?q=https://github.com/lksahu120206-gif)

---

> **Note:** This project demonstrates cloud scalability, secure data handling, and efficient content delivery for dynamic web applications.

```

```
