# Fine-Tune Studio - File Tree

```
fine-tune-studio/
├── .env.example                    # Environment variables template
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── FILE_TREE.md                    # This file
├── README.md                       # Project documentation
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
│
├── app/                            # Next.js App Router
│   ├── api/                        # API routes
│   │   ├── files/
│   │   │   └── upload/
│   │   │       └── route.ts        # File upload endpoint
│   │   ├── fine-tune/
│   │   │   ├── create/
│   │   │   │   └── route.ts        # Create fine-tuning job
│   │   │   ├── jobs/
│   │   │   │   └── route.ts        # List all jobs
│   │   │   └── [jobId]/
│   │   │       ├── route.ts        # Get job status
│   │   │       └── events/
│   │   │           └── route.ts    # Get job events
│   │   ├── models/
│   │   │   └── route.ts             # List available models
│   │   ├── test/
│   │   │   ├── respond/
│   │   │   │   └── route.ts         # Single model test
│   │   │   └── ab/
│   │   │       ├── [id]/
│   │   │       │   └── route.ts     # Update A/B run
│   │   │       └── route.ts         # A/B comparison
│   │   └── training-drafts/
│   │       ├── export/
│   │       │   └── route.ts         # Export drafts to JSONL
│   │       └── route.ts             # List/create drafts
│   ├── train/
│   │   └── page.tsx                 # Training page UI
│   ├── test/
│   │   └── page.tsx                 # Testing page UI
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
│
├── lib/                             # Shared libraries
│   ├── jsonl-validator.ts           # Server-side JSONL validator
│   ├── jsonl-validator.client.ts    # Client-side JSONL validator
│   ├── openai.ts                    # OpenAI client (server-only)
│   └── prisma.ts                    # Prisma client
│
└── prisma/
    └── schema.prisma                # Database schema
```

## Key Files

### Configuration
- `package.json` - All dependencies and npm scripts
- `tsconfig.json` - TypeScript compiler configuration
- `next.config.js` - Next.js configuration with file upload size limits
- `tailwind.config.ts` - Tailwind CSS configuration
- `.env.example` - Template for environment variables

### Database
- `prisma/schema.prisma` - Defines all database models:
  - FineTuneFile
  - FineTuneJob
  - TestRun
  - ABRun
  - TrainingDraft

### API Routes (Server-Side Only)
All API routes are in `app/api/` and handle:
- File uploads to OpenAI
- Fine-tuning job creation and monitoring
- Model testing and A/B comparisons
- Training draft management

### Pages (Client Components)
- `app/page.tsx` - Home page with navigation
- `app/train/page.tsx` - Training interface with file upload and job monitoring
- `app/test/page.tsx` - Testing interface with A/B comparison and draft creation

### Libraries
- `lib/openai.ts` - OpenAI SDK client (server-only, reads from env)
- `lib/prisma.ts` - Prisma client singleton
- `lib/jsonl-validator.ts` - Server-side JSONL validation
- `lib/jsonl-validator.client.ts` - Client-side JSONL validation

## Security Notes

- All OpenAI API calls are made server-side only
- API key is read from `process.env.OPENAI_API_KEY` (never exposed to browser)
- File validation happens both client-side and server-side
- Database uses SQLite (local file, not exposed)
