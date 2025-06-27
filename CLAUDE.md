# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Open Coverage** (available at open-coverage.com), an open-source initiative focused on democratizing health insurance analysis tools. Our mission is to make health insurance decision-making accessible, transparent, and free for everyone through community-driven, open-source software.

### Why Open Coverage Exists

Health insurance tools are typically:
- Locked behind commercial paywalls
- Built for brokers, not consumers  
- Overly simplified and unhelpful
- Biased toward specific insurers

Open Coverage changes this by providing truly open-source health insurance analysis tools that put consumers first, with no vendor lock-in, hidden agendas, or subscription fees.

### The Health Policy Analyzer

Our flagship product is the Health Policy Analyzer, which allows users to:
- Upload health insurance policy documents (SBC/SPD files)
- Configure their family's health profile (conditions, medications, expected visits)
- Get AI-powered analysis of their documents and health needs
- Compare multiple policies side-by-side
- Receive personalized recommendations based on their actual health profile
- Get cost projections and insights in plain English

Key features:
- Health insurance SBC (Summary of Benefits and Coverage) document processing
- Multi-policy comparison tools with personalized cost analysis
- Health profile management for family-based recommendations
- AI-powered chat interface for insurance questions
- Privacy-first design (all data stored locally)

## Development Commands

```bash
# Start development server
npm run dev

# Build the project
npm run build

# Run linter
npm run lint

# Start production server
npm run start
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **UI Components**: Radix UI primitives with custom UI components
- **Styling**: Tailwind CSS with shadcn/ui design system
- **State Management**: Zustand with persistence
- **AI Integration**: AI SDK with OpenAI GPT-4o
- **Chat Interface**: assistant-ui/react components
- **Form Handling**: React Hook Form with Zod validation
- **PDF Processing**: pdf-parse for SBC document analysis

### Project Structure

```
app/
├── api/chat/route.ts         # AI chat API endpoint
├── analyze-compare/          # Policy comparison page
├── health-profile/           # Health profile management
├── assistant.tsx             # AI chat interface component
├── layout.tsx                # Root layout with sidebar
└── page.tsx                  # Homepage

components/
├── app-sidebar.tsx           # Main navigation sidebar
├── assistant-ui/             # Custom chat UI components
└── ui/                       # shadcn/ui components

lib/
├── health-profile-store.ts   # Zustand store for health data
├── sbc-schema.ts            # Zod schema for SBC document structure
├── pdf-utils.ts             # PDF processing utilities
└── utils.ts                 # General utilities
```

### Key Components

**Health Profile Store** (`lib/health-profile-store.ts`): Manages family health information including medical conditions, medications, and visit frequencies using Zustand with localStorage persistence.

**SBC Schema** (`lib/sbc-schema.ts`): Comprehensive Zod schema defining the structure of health insurance Summary of Benefits and Coverage documents, including all common medical event service types.

**AI Chat Integration** (`app/api/chat/route.ts`): Edge runtime API endpoint using OpenAI GPT-4o with streaming responses and frontend tool integration.

**Assistant UI** (`app/assistant.tsx`): Chat interface built with assistant-ui/react providing thread management and message handling.

### Important Configuration

The project uses relaxed TypeScript and ESLint settings for rapid development:
- `ignoreDuringBuilds: true` for both ESLint and TypeScript
- Image optimization disabled for compatibility
- Path aliases configured with `@/*` pointing to root

### Data Models

**Health Profile**: Stores family member information including age, medical conditions, medications, allergies, and expected medical visits.

**SBC Processing**: Handles insurance document parsing with support for 30+ common medical service types including primary care, specialist visits, diagnostic tests, medications, and emergency services.

## Development Notes

- The project is auto-synced with v0.dev, so changes may be automatically pushed from external deployments
- Uses edge runtime for AI API endpoints with 30-second timeout
- Persistent health profile data is stored in localStorage via Zustand
- PDF processing capabilities for insurance document analysis
- Responsive design with mobile-first approach using Tailwind CSS