# SMS Server Frontend

Next.js 14 frontend application for SMS Server Management.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Element Plus
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Theme

- **Background**: rgb(45, 45, 45) - Dark gray
- **Primary Color**: #c2905e - Gold-brown
- **Design System**: Glassmorphism with backdrop blur effects

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # Reusable React components
│   ├── lib/              # Utilities and helpers
│   │   ├── api.ts        # Axios client with auth
│   │   └── types.ts      # TypeScript interfaces
│   └── styles/
│       └── globals.css   # Tailwind + glassmorphism utilities
├── public/               # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── Dockerfile
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Type Check

```bash
npm run type-check
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Docker

Build and run with Docker:

```bash
docker build -t sms-server-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:8080/api sms-server-frontend
```

## Styling

### Glassmorphism Utilities

- `glass` - Basic glass effect with backdrop blur
- `glass-card` - Glass card with padding and rounded corners
- `glass-hover` - Glass effect with hover transition

### Custom Buttons

- `btn-primary` - Primary button with gold-brown background
- `btn-secondary` - Secondary button with glass effect

## API Integration

The Axios client in `src/lib/api.ts` handles:

- Automatic JWT Bearer token injection
- 401 error handling with auto-redirect
- Request/response interceptors
