# Loopz - AI-Powered Journaling & Task Management

Loopz is a web application built with Next.js, Supabase, and OpenAI that helps users reflect on their thoughts through journaling and automatically generates actionable tasks based on their entries.

## Project Overview

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + ShadCN UI (Slate theme)
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API
- **Package Manager**: pnpm
- **Testing**: Jest, React Testing Library, Lighthouse CI
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- pnpm (install via `npm install -g pnpm`)
- Supabase account and project
- OpenAI API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd loopz
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    - Copy the example environment file:
      ```bash
      cp .env.example .env.local
      ```
    - Open `.env.local` and add your actual Supabase URL, Supabase Anon Key, and OpenAI API Key.
      ```
      # .env.local
      NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
      OPENAI_API_KEY=YOUR_OPENAI_API_KEY
      ```
    - **Important:** Ensure `.env.local` is listed in your `.gitignore` file.

4.  **Set up Supabase database:**
    - Connect to your Supabase project.
    - Run the SQL scripts located in `supabase/migrations` (or manually create the tables defined in `lib/supabase/database.types.ts`) to set up the required tables (`profiles`, `loops`, `tasks`). You might need a script or trigger to populate the `profiles` table when a new user signs up via `auth.users`.

### Running the Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Features (Planned/Implemented)

- [ ] User Authentication (Supabase Auth)
- [ ] Journal Entry Creation/Viewing (Loops)
- [ ] AI-Powered Summarization & Sentiment Analysis
- [ ] Automatic Task Generation from Loops (Tasks)
- [ ] Task Management (View, Complete, Delete)
- [ ] User Profiles
- [ ] Performance Benchmarking (Lighthouse CI)

## Deployment

This project is configured for deployment on platforms like Vercel.

---

*(Original create-next-app README content below)*

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
