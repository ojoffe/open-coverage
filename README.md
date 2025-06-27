# Open Coverage 🏥

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

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for beautiful interfaces
- **OpenAI GPT-4** for intelligent document analysis
- **Zustand** for state management
- **PDF parsing** for document processing
- **Vercel** for deployment

## 🏗️ Project Structure

```
app/
├── api/chat/           # AI-powered chat endpoint
├── analyze-compare/    # Policy comparison interface
├── health-profile/     # Family health management
├── assistant.tsx       # AI chat component
└── page.tsx           # Homepage

components/
├── app-sidebar.tsx    # Navigation
├── assistant-ui/      # Chat interface components
└── ui/               # Reusable UI components

lib/
├── health-profile-store.ts  # Health data management
├── sbc-schema.ts           # Insurance document schemas
└── pdf-utils.ts            # Document processing
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/open-coverage.git
cd open-coverage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app running.

### Development Commands

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run linter
```

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

## 📊 Current Features

- ✅ **SBC Document Processing** - Parse Summary of Benefits and Coverage documents
- ✅ **Health Profile Management** - Store family health information securely
- ✅ **AI Chat Interface** - Ask questions about your insurance in natural language
- ✅ **Policy Comparison** - Side-by-side analysis of multiple policies
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Privacy-First** - All data stored locally in your browser

## 🗺️ Roadmap

### 🎯 Phase 1: Foundation (Current)
- [x] Core policy analysis engine
- [x] Basic UI and document upload
- [x] Health profile management
- [ ] Enhanced comparison algorithms
- [ ] Export/sharing features

### 🚀 Phase 2: Advanced Features (Q1 2025)
- [ ] Provider network analysis
- [ ] Prescription drug coverage checker
- [ ] HSA/FSA optimization calculator
- [ ] Mobile app (React Native)
- [ ] Multi-language support

### 🌟 Phase 3: Community Platform (Q2 2025)
- [ ] User-generated policy reviews
- [ ] Community-driven policy database
- [ ] Integration with healthcare.gov
- [ ] Enterprise/broker tools
- [ ] API for third-party integrations

## 🔒 Privacy & Security

- **Local-first** - Your health data never leaves your device
- **No tracking** - We don't collect personal information
- **Open source** - Audit our code anytime
- **No vendor lock-in** - Export your data whenever you want

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [v0.dev](https://v0.dev) for rapid prototyping
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)
- Hosted on [Vercel](https://vercel.com)

## 📞 Connect With Us

- 🌐 **Website**: [open-coverage.com](https://open-coverage.com)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/open-coverage/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/open-coverage/issues)
- 📧 **Email**: hello@open-coverage.com

---

**Made with ❤️ by the Open Coverage community**

*Together, we're making healthcare decisions more transparent, accessible, and affordable for everyone.*
