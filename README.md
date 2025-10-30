# Luminix Broadcast

A modern, full-featured email broadcast management system built with Next.js, tRPC, and Resend. Manage subscribers, create broadcasts, and send beautiful emails with ease.

## Features

- **📧 Email Broadcasting:** Create and send beautiful email broadcasts to your subscribers
- **👥 Subscriber Management:** Add, import, and manage your subscriber list with ease
- **🎨 Rich Text Editor:** Compose emails with a powerful WYSIWYG editor
- **📱 Responsive Design:** Fully responsive interface that works on all devices
- **🔒 Type-Safe:** End-to-end type safety with TypeScript and tRPC
- **📤 Bulk Import:** Import subscribers via CSV or manual entry
- **📧 Email Preview:** Preview your broadcasts before sending

## Tech Stack

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[tRPC](https://trpc.io/)** - End-to-end typesafe APIs
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM for SQL databases
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[Resend](https://resend.com/)** - Modern email API for developers
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[React Hook Form](https://react-hook-form.com/)** - Performant form validation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm/yarn
- **PostgreSQL** database
- **Resend Account** (free tier available)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/luminix-broadcast.git
cd luminix-broadcast
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Set Up PostgreSQL Database

This project uses [Neon](https://neon.tech/) - a serverless PostgreSQL database.

#### Option 1: Using Neon (Recommended)

1. Go to [Neon.tech](https://neon.tech) and sign up for a free account
2. Click **Create a project**
3. Give your project a name (e.g., "Luminix Broadcast")
4. Select a region closest to your users
5. Click **Create project**
6. Copy the connection string from the **Connection Details** section
7. Add it to your `.env` file as `DATABASE_URL`

### 4. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/luminix_broadcast"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Email Service
RESEND_API_KEY=re_123456789abcdefghijklmnop
RESEND_AUDIENCE_ID=abc12345-6789-defg-hijk-lmnopqrstuv
NEXT_PUBLIC_RESEND_DOMAIN_EMAIL=noreply@yourdomain.com
```

### 5. Set Up Resend

#### Step 1: Create a Resend Account

1. Go to [Resend.com](https://resend.com) and sign up for a free account
2. Verify your email address

#### Step 2: Add and Verify Your Domain

1. Navigate to **Domains** in your Resend dashboard
2. Click **Add Domain**
3. Enter your domain name (e.g., `yourdomain.com`)
4. Add the provided DNS records to your domain registrar:
   - **MX Record** (for receiving bounces)
   - **TXT Record** (for SPF verification)
   - **CNAME Records** (for DKIM authentication)
5. Wait for DNS propagation (usually 5-15 minutes, can take up to 48 hours)
6. Click **Verify** in Resend dashboard

**Note:** If you don't have a custom domain, you can use Resend's test domain for development, but emails will only be sent to your verified email address.

#### Step 3: Get Your API Key

1. Go to **API Keys** in your Resend dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "Luminix broadcast")
4. Select the appropriate permissions (Full Access for development)
5. Copy the API key and add it to your `.env` file as `RESEND_API_KEY`

**⚠️ Important:** Keep your API key secure and never commit it to version control.

#### Step 4: Create an Audience (Optional but Recommended)

1. Go to **Audiences** in your Resend dashboard
2. Click on **API Reference** to view your existing audience ID
3. Or click **Create Audience** to create a new one:
   - Give it a name (e.g., "broadcast Subscribers")
   - Configure your audience settings
4. Copy the Audience ID and add it to your `.env` file as `RESEND_AUDIENCE_ID`

**Note:** Using Audiences helps you manage bounces, complaints, and unsubscribes automatically.

#### Step 5: Set Your Sender Email

In your `.env` file, set `NEXT_PUBLIC_RESEND_DOMAIN_EMAIL` to an email address using your verified domain:
```env
NEXT_PUBLIC_RESEND_DOMAIN_EMAIL=noreply@yourdomain.com
```

### 6. Run Database Migrations
```bash
pnpm db:push
# or
npm run db:push
```

### 7. Start the Development Server
```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure
```
luminix-broadcast/
├── app/
│   ├── (dashboard)/          # Dashboard routes with shared layout
│   │   ├── broadcasts/       # Broadcast management pages
│   │   ├── subscribers/      # Subscriber management pages
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   ├── api/                  # API routes
│   │   └── trpc/             # tRPC endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── sidebar/              # Sidebar navigation components
│   └── ui/                   # shadcn/ui components
├── db/
│   ├── drizzle.ts            # Database connection
│   └── schema.ts             # Database schema
├── emails/
│   └── broadcast-email.tsx   # Email templates
├── modules/
│   ├── broadcast/            # Broadcast feature module
│   │   ├── server/           # Server-side procedures
│   │   └── ui/               # Client components
│   └── subscribers/          # Subscribers feature module
│       ├── server/           # Server-side procedures
│       └── ui/               # Client components
├── trpc/
│   ├── routers/              # tRPC router definitions
│   ├── client.tsx            # tRPC client setup
│   └── init.ts               # tRPC initialization
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment variables template
└── package.json              # Project dependencies
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:push` - Push database schema changes
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

## Key Features Explained

### Broadcasting System

- Create and schedule email broadcasts
- Rich text editor with formatting options
- Preview emails before sending
- Send to all subscribers or specific segments

### Subscriber Management

- Add subscribers manually
- Bulk import via CSV
- View subscriber details and activity
- Remove subscribers

### Email Templates

- Professional, responsive email templates
- Customizable branding

## Deployment

### Deploy to Vercel

The easiest way to deploy this application:

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's project settings
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/luminix-broadcast)

### Environment Variables for Production

Make sure to set these in your Vercel project settings:

- `DATABASE_URL` - Your production PostgreSQL database URL
- `NEXT_PUBLIC_APP_URL` - Your production domain (e.g., https://yourdomain.com)
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_AUDIENCE_ID` - Your Resend Audience ID
- `NEXT_PUBLIC_RESEND_DOMAIN_EMAIL` - Your verified sender email

## Troubleshooting

### Emails Not Sending

- Verify your domain is properly configured in Resend
- Check that your API key has the correct permissions
- Ensure `NEXT_PUBLIC_RESEND_DOMAIN_EMAIL` uses your verified domain
- Check Resend dashboard for any error logs

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check that database migrations have been applied

### Type Errors

- Run `pnpm install` to ensure all dependencies are installed
- Restart your TypeScript server in your IDE

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

If you have any questions or run into issues, please:

1. Check the [Issues](https://github.com/azacdev/luminix-broadcast/issues) page
2. Create a new issue if your problem isn't already listed
3. Contact support at support@azacdev.com

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Resend](https://resend.com/) for the reliable email API
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful components
- [tRPC](https://trpc.io/) for type-safe APIs

---
