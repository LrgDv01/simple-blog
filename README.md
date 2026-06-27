# SimpleBlog

SimpleBlog is a modern blog platform built with React, TypeScript, Vite, Redux Toolkit, Tailwind CSS, and Supabase.
It supports user authentication, blog post creation and editing, Markdown rendering, image uploads, commenting with replies, and account deactivation/reactivation flows.

## Overview

This project is designed as a personal publishing space where users can:

- Register and sign in with Supabase Auth
- Create, edit, and delete blog posts
- Upload featured images for posts
- Write content in Markdown and preview it before publishing
- Read post details with formatted Markdown rendering
- Leave comments and replies on posts
- Deactivate and reactivate accounts while preserving content ownership

The app uses Redux Toolkit for state management, Supabase for backend services, and Tailwind CSS for styling.

## Features

- Authentication with session persistence
- Protected routes for dashboard, post creation, editing, and account actions
- Blog post CRUD
- Markdown support with live preview
- Image upload support through Supabase Storage
- Comment system with optimistic updates
- Pagination on the dashboard
- Dark mode support
- Toast notifications for success and error feedback

## Tech Stack

- React 19
- TypeScript
- Vite
- Redux Toolkit
- React Redux
- React Router DOM
- Supabase
- Tailwind CSS
- React Hook Form
- Zod
- React Markdown
- remark-gfm
- date-fns
- react-hot-toast

## Project Structure

```text
src/
  app/              # Redux store and typed hooks
  assets/           # Static assets
  components/       # Reusable UI components
  context/          # Theme context
  features/
    auth/           # Authentication slice
    blog/           # Blog and comment slice
  lib/              # Supabase client setup
  pages/            # Route-level screens
  types/            # Shared TypeScript types
```

## Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project with Auth, database tables, and Storage configured

## Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add your Supabase values:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:

```bash
npm run dev
```

## Available Scripts

```bash
npm run dev         # Start the Vite dev server
npm run build       # Type-check and build for production
npm run preview     # Preview the production build locally
npm run lint        # Run ESLint across the project
npm run type-check  # Run TypeScript checks without emitting files
```

## Core Pages

- `/register` - Create a new account
- `/login` - Sign in to an existing account
- `/dashboard` - View paginated blog posts
- `/create` - Write a new post
- `/post/:id` - Read a full post and its comments
- `/edit/:id` - Update an existing post
- `/deactivate-account` - Deactivate the current account

## Supabase Requirements

This app expects the following Supabase features to be available:

- Auth enabled for email/password sign-up and sign-in
- `posts` table for blog content
- `comments` table for discussion threads and replies
- `blog-images` Storage bucket for featured image uploads

The code also assumes posts and comments can store ownership fields such as `user_id`, `original_user_id`, and `author_email`.

## Notes

- Routing uses `HashRouter`, which works well for static hosting environments.
- The UI is optimized for both light and dark themes.
- Markdown is rendered in the post detail view and previewed while creating content.

## Build And Deploy

Run a production build before deploying:

```bash
npm run build
```

If you are deploying to a static host such as Vercel, Netlify, or GitHub Pages, make sure the Supabase environment variables are added in the deployment settings.

## License

No license file is currently included in the repository.
