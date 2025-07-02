# Open Coverage 🏥
<img width="500" alt="Screenshot 2025-07-01 at 6 24 55 PM" src="https://github.com/user-attachments/assets/af224fa4-176a-487b-99d9-7505e907de82" />
<img width="500" alt="Screenshot 2025-07-01 at 6 25 01 PM" src="https://github.com/user-attachments/assets/a3cc91a9-a397-4b05-9b4b-15fca572d7de" />


> **Democratizing health insurance decision-making through open-source tools**

[![Website](https://img.shields.io/badge/Website-open--coverage.com-blue?style=for-the-badge)](https://open-coverage.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/aaron-landys-projects/v0-coverage-wtf-wm85bd2i4hr)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

## 🌟 Why Open Coverage Exists

Health insurance is one of the most important financial decisions families make, yet the tools to analyze and compare policies are either:
- **Locked behind commercial paywalls** 🔒
- **Built for brokers, not consumers** 💼
- **Overly simplified and unhelpful** 📊
- **Biased toward specific insurers** 🎯

**Open Coverage changes this.** We're building the first truly open-source ecosystem of health insurance tools that put consumers first. No vendor lock-in, no hidden agendas, no subscription fees—just powerful, transparent tools that help you make the best healthcare decisions for your family.

## 🚀 Our Mission

**To make health insurance analysis accessible, transparent, and free for everyone.**

We believe that:
- 🔓 **Healthcare decisions should be transparent** - You deserve to understand exactly how your policy works
- 🛠️ **Tools should be built by and for the community** - Open source means accountable, improvable software
- 💰 **Essential services shouldn't cost extra** - Healthcare is expensive enough without paying for analysis tools
- 🎯 **Consumer interests come first** - No insurer partnerships or broker commissions influencing recommendations

## 🎯 The Health Policy Analyzer

**Our flagship tool** - Upload your health insurance policy documents (Summary of Benefits and Coverage) and get:

- 📋 **Complete policy breakdown** - Every benefit, clearly explained
- 🔍 **Side-by-side comparisons** - Multiple policies analyzed simultaneously  
- 👥 **Personalized recommendations** - Based on your family's actual health profile
- 💡 **Cost projections** - Estimate your total annual healthcare expenses
- 🤖 **AI-powered insights** - Ask questions about your coverage in plain English

### How It Works

1. **Upload** your insurance policy documents (SBC/SPD files)
2. **Configure** your family's health profile (conditions, medications, expected visits)
3. **Analyze** - Our AI processes your documents and health needs
4. **Compare** - See which policy saves you the most money
5. **Decide** with confidence, backed by data

## 🛠️ Built With Modern Tech

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for beautiful interfaces
- **Anthropic Claude & Groq** for intelligent document analysis
- **@assistant-ui/react** for AI chat interface
- **Zustand** for state management
- **Zod** for schema validation
- **PDF parsing** for document processing
- **Vercel** for deployment
- **Bun** for fast JS runtime & package management

## 🏗️ Project Structure

```
app/
├── actions/            # Server actions for AI operations
├── analysis/           # Policy analysis pages
├── analyze-compare/    # Policy comparison interface
├── analyze-compare-v2/ # Enhanced comparison interface
├── analyze-policy/     # Single policy analysis
├── api/                # API endpoints
│   ├── analyze-health-profile/
│   ├── chat/          # AI-powered chat endpoint
│   ├── health-suggestions/
│   ├── search-treatment-cost/
│   └── treatment-costs/
├── compare-policies/   # Policy comparison tools
├── cost-analysis/      # Healthcare cost analysis
├── find-providers/     # Provider discovery
├── health-profile/     # Family health management
├── assistant.tsx       # AI chat component
├── error.tsx          # Error handling pages
├── global-error.tsx   # Global error boundary
├── layout.tsx         # Root layout
├── not-found.tsx      # 404 page
└── page.tsx           # Homepage

components/
├── app-sidebar.tsx    # Navigation sidebar
├── assistant-ui/      # Chat interface components
├── error-boundaries/  # Error handling components
├── health-profile/    # Health profile components
├── ui/               # Reusable UI components (shadcn)
├── policy-*.tsx      # Policy-specific components
├── cost-analysis-summary.tsx
├── healthcare-information-modal.tsx
├── premium-input-modal.tsx
├── profile-completeness.tsx
├── risk-assessment-display.tsx
├── treatment-cost-display.tsx
└── utilization-display.tsx

lib/
├── services/              # Business logic and AI operations
│   ├── insurance-ai-service.ts
│   ├── policy-comparison-service.ts
│   └── policy-service.ts
├── hooks/                 # Utility hooks
│   ├── use-health-ai.ts
│   ├── use-screen-reader.tsx
│   └── use-treatment-costs.ts
├── analysis-store.ts      # Analysis state management
├── enhanced-health-profile-store.ts
├── health-profile-store.ts
├── health-risk-assessment.ts
├── insurance-calculator.ts
├── medication-cost-calculator.ts
├── pdf-utils.ts           # Document processing
├── sbc-schema.ts          # Insurance document schemas
├── treatment-cost-service.ts
├── unified-analysis-service.ts
└── utilization-engine.ts

hooks/
├── use-category-analysis.ts    # AI category management
├── use-comparison-history.ts   # Comparison history
├── use-healthcare-information.ts
├── use-insurance-settings.ts   # Centralized settings
├── use-mobile.ts              # Mobile detection
├── use-situation-suggestions.ts # Healthcare suggestions
└── use-toast.ts               # Toast notifications

types/
├── schemas.ts         # Consolidated Zod schemas
└── insurance.ts       # Type definitions

policy-templates/      # Sample policy templates

__tests__/            # Test files
```

### Architecture Overview

The project follows a service-layer architecture pattern:

- **Service Layer First**: All AI operations go through `lib/services/`
- **Type Safety**: Zod schemas for all validation and type generation
- **Error Boundaries**: Graceful degradation with `AIErrorBoundary` components
- **Custom Hooks**: Single responsibility hooks for business logic
- **Multi-Model AI**: Fallback strategies with Anthropic Claude and Groq models

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 20+
- API keys for Groq, Anthropic (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/aaln/open-coverage.git
cd open-coverage

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local (see Environment Variables section below)

# Start development server
bun run dev
```

Visit `http://localhost:3000` to see the app running.

### Development Commands

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run linter
bun run fetch:plans  # Fetch sample insurance plans
```

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# AI Model APIs
GROQ_API_KEY=           # For Groq AI models
ANTHROPIC_API_KEY=      # For Claude models

# Document Processing
UNSTRUCTURED_API_KEY=   # For PDF parsing

# Storage & Background Jobs
BLOB_READ_WRITE_TOKEN=  # For file storage
TRIGGER_SECRET_KEY=     # For background jobs

# CMS.gov APIs (optional - for discovery features)
GOV_MARKETPLACE_API_KEY= # For Marketplace API
GOV_FINDER_API_KEY=      # For Finder API
```

### Obtaining CMS.gov API Keys

Note: The discovery section of the site won't work if these keys aren't available.

To get API keys for the CMS Healthcare APIs:

1. Visit [CMS Developer Portal](https://developer.cms.gov)
2. Click "Sign Up" to create a CMS Enterprise Portal account
3. For Marketplace API (GOV_MARKETPLACE_API_KEY):
   - Navigate to "Marketplace API" section
   - Click "Request Access"
   - Fill out the application form 
   - Submit and await approval

4. For Finder API (GOV_FINDER_API_KEY):
   - Navigate to "Finder API" section
   - Click "Request Access"
   - Complete similar application process
   - Specify intended usage for finding private health plans

## 🤝 Contributing

We welcome contributions from developers, healthcare professionals, insurance experts, and anyone passionate about making healthcare more accessible!

### Ways to Contribute

- 🐛 **Report bugs** - Found an issue? Let us know!
- 💡 **Suggest features** - Have ideas for improvement?
- 📝 **Improve documentation** - Help others understand the project
- 🔧 **Submit code** - Fix bugs or add new features
- 🧪 **Test policies** - Try the tool with different insurance documents
- 📢 **Spread the word** - Help others discover Open Coverage

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Cursor IDE Integration

This project includes comprehensive [Cursor IDE](https://cursor.sh/) rules for enhanced development experience. The `.cursor/rules/` directory contains:

- **Global Rules** - Core development standards and architecture patterns
- **Server Actions** - Guidelines for Next.js server actions
- **Self-Updating Rules** - Dynamic rule system that adapts to project changes
- **Build Agent** - Automated build, linting, and formatting

## 📊 Current Features

- ✅ **SBC Document Processing** - Parse Summary of Benefits and Coverage documents
- ✅ **Health Profile Management** - Store family health information securely
- ✅ **AI Chat Interface** - Ask questions about your insurance in natural language
- ✅ **Policy Comparison** - Side-by-side analysis of multiple policies
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Privacy-First** - All data stored locally in your browser

## 🔒 Privacy & Security

- **Local-first** - Your health data never leaves your device
- **No tracking** - We don't collect personal information
- **Open source** - Audit our code anytime
- **No vendor lock-in** - Export your data whenever you want

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Together, we're making healthcare decisions more transparent, accessible, and affordable for everyone.*
