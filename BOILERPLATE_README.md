# 🔐 Supabase Auth + Google Sign-In Boilerplate for Next.js

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black)
![Supabase](https://img.shields.io/badge/Supabase-2.49.4-green)

A production-ready authentication system built with Next.js and Supabase featuring Google OAuth integration.

## Features

- 🔐 Secure OAuth authentication with Google
- 🔄 Server-side and client-side authentication handling
- 🛡️ Protected routes with Next.js middleware
- 🌐 SSR-compatible authentication flow
- 📦 Custom React hooks for authentication state
- 🛠️ Row Level Security (RLS) with Supabase

## Prerequisites

Before you begin, ensure you have:

- Node.js 18.x or later
- A Supabase account
- A Google Cloud Platform account

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/shsfwork/supabase-auth-nextjs-google-boilerplate.git
cd supabase-auth-nextjs-google-boilerplate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase

1. Create a new Supabase project
2. Run the SQL commands from the `schema.sql` file in the Supabase SQL editor
3. Configure Google authentication provider in Authentication > Providers
4. Add `http://localhost:3000/**` to the redirect URLs in Authentication > URL Configuration

### 5. Set up Google OAuth

1. Create a project in Google Cloud Console
2. Set up OAuth consent screen
3. Create OAuth 2.0 client ID
4. Configure authorized JavaScript origins and redirect URIs

### 6. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
├── app/
│   ├── (playground)/       # Example pages
│   │   ├── client/         # Client component example
│   │   ├── profile/      # Protected route example
│   │   └── server/         # Server component example
│   ├── auth/               # Authentication routes
│   │   ├── callback/       # OAuth callback handler
│   │   └── login/          # Login page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable UI components
├── constants/              # Application constants
├── hooks/                  # Custom React hooks
├── lib/
│   └── supabase/           # Supabase clients and middleware
├── middleware.ts           # Next.js middleware for auth
└── .env.local.example      # Environment variables example
```

## Authentication Flow

1. User clicks the "Login with Google" button
2. User is redirected to Google's OAuth consent screen
3. After authorization, Google redirects back to the callback URL
4. The callback handler exchanges the code for a Supabase session
5. The user is redirected to the original destination or home page
6. Profile routes are guarded by middleware

## Middleware

The middleware handles authentication checks before rendering protected routes:

- Redirects unauthenticated users to the login page
- Prevents authenticated users from accessing the login page
- Preserves the intended destination with the `next` parameter

## Hooks and Utilities

### `useUser` Hook

A custom hook that provides the current user state in client components:

```tsx
const { loading, error, user, session } = useUser();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!user) return <LoginPrompt />;

return <UserProfile user={user} />;
```

### Supabase Clients

The project uses two different Supabase clients:

- **Client-side**: For use in client components and hooks
- **Server-side**: For use in server components and API routes

## Database Schema

The project uses the following database structure:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

-- Automatically insert user data when a new user is created
CREATE OR REPLACE FUNCTION public.create_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## Production Considerations

### Environment Variables

For production, update:

- Redirect URLs in Supabase to your production domain
- Authorized origins and redirect URIs in Google Cloud Console
- Environment variables for your production deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Lucide Icons](https://lucide.dev/)
- [Shadcn](https://ui.shadcn.com/)

## Support

If you find this project helpful, please give it a ⭐️ on GitHub!

For issues, questions, or contributions, please open an issue or PR on GitHub.
