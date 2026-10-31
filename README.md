Zinnia AI
<p align="center">
  <strong>An AI assistant for thinking, solving, building, and exploring.</strong>
</p><p align="center">
  <em>Intelligent conversations, mathematical problem-solving, coding assistance, image understanding, live voice interaction, and more — in one workspace.</em>
</p><p align="center">
  <a href="https://github.com/sreemonghosh/Zinnia-AI"><img alt="GitHub repository" src="https://img.shields.io/badge/GitHub-Zinnia%20AI-181717?logo=github"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite">
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-enabled-FFCA28?logo=firebase">
</p>About Zinnia AI
Zinnia AI is an independent AI assistant product designed to bring multiple AI-powered workflows into one unified experience. It combines conversational assistance with dedicated capabilities for mathematical reasoning, numerical problem-solving, software development, image analysis, weather information, and real-time voice conversations.

Zinnia AI is being developed with a global audience in mind. It is an independent product initiative — not a college assignment or academic demonstration — with a focus on usability, capability, reliability, and a foundation that can evolve into a commercial service.
Our direction: make it easier for people to ask questions, understand difficult problems, create software, and get useful assistance in one place.

Core capabilities
The current repository includes the following product areas:
🤖 AI conversations
- Conversational question answering and general assistance.
- Multiple model choices and response styles.
- Conversation context and chat-session management.
- Image input and AI-powered image analysis.
🧮 Mathematical and scientific problem-solving
- Dedicated numerical-solving workflow.
- Deeper mathematical reasoning for multi-step problems.
- Step-by-step derivations with mathematical notation.
- Numerical, symbolic, and dimensional-consistency verification helpers.
💻 Coding assistance
- Coding-focused task detection and routing.
- Assistance with code generation, explanation, debugging, testing, and related development tasks.
- Server-side code execution support for Python and JavaScript/Node.js workflows.
🎙️ Live voice interaction
- Real-time voice conversation interface.
- Speech input and generated audio responses.
- WebSocket-based live communication workflow.
🌦️ Weather and location-aware information
- Weather lookup by location or coordinates.
- Current conditions and forecast data.
- Location-aware weather retrieval, subject to user permission and device/browser support.
👤 Accounts and chat history
- Email/password and Google sign-in flows using Firebase Authentication.
- User profile and account-management flows.
- Cloud chat synchronization using Cloud Firestore.
- Device-session management functionality.
- Firestore security rules included in the repository.
Feature availability can depend on configuration, API access, provider availability, deployment environment, and the current product release.

Product experience
Zinnia AI is designed around a unified assistant experience, with dedicated controls for different types of work:
- Standard AI chat
- Mathematical reasoning mode
- Numerical solver
- Coding assistant
- Image understanding
- Live voice mode
- Weather experience
- Chat sessions and history
- Profile and account settings
Technology
The current codebase uses the following technologies and services:
Area	Technology
Frontend	React 19, TypeScript
Build tooling	Vite 6
Styling	Tailwind CSS 4
Motion and icons	Motion, Lucide React
Backend	Node.js, Express
Real-time communication	WebSocket
AI integration	Google GenAI SDK
Authentication and data	Firebase Authentication, Cloud Firestore
Mathematical utilities	math.js, KaTeX
Markdown and code presentation	React Markdown, Prism.js
PDF generation	jsPDF
Weather data	Open-Meteo APIs
Geocoding	Open-Meteo Geocoding, OpenStreetMap Nominatim


Technology and provider choices may change as the product evolves.
Getting started
These instructions are for developers who have permission to run the source code locally.
Prerequisites
Install:
- Node.js (a currently supported LTS release)
- npm (included with Node.js)
- Git
1. Clone the repository
git clone https://github.com/sreemonghosh/Zinnia-AI.git
cd Zinnia-AI
2. Install dependencies
npm install
3. Configure environment variables
Create a local .env file in the project root:
GOOGLE_API_KEY=your_google_genai_api_key
GEMINI_API_KEY=your_google_genai_api_key
The repository includes .env.example as a starting point. Use a valid API key from the relevant provider and follow that provider's terms, quotas, and billing requirements.

Security: never commit real API keys, credentials, private certificates, or production secrets. Keep privileged keys on the server side and configure them through your deployment platform's secret manager in production.
4. Run the development server
npm run dev
Open the local URL printed in your terminal. The project currently defaults to port 3000 in development.
5. Build for production
npm run build
To start the server after building:
npm start
Available scripts
Command	Description
npm run dev	Starts the application server in development mode
npm run build	Builds the frontend for production
npm start	Starts the server
npm run preview	Runs Vite's local production preview
npm run lint	Runs the TypeScript compiler in no-emit mode
npm run clean	Removes the generated dist directory


Configuration and integrations
Google GenAI
The server reads the AI provider key from GEMINI_API_KEY or GOOGLE_API_KEY. Configure this secret in your local environment or deployment environment. Never expose a privileged server API key in client-side code.
Firebase
The project contains Firebase client configuration, authentication integration, cloud chat synchronization, and Firestore rules. Before deploying your own instance:
1. Create and configure a Firebase project.
2. Enable only the authentication providers you intend to support.
3. Configure Firebase application settings for the deployment environment.
4. Review and test Firestore security rules against your intended data model.
5. Configure authorized domains and production authentication settings.
Do not assume that a sample Firebase configuration or development project is suitable for production. Firebase client configuration is not a substitute for correct Authentication setup and secure Firestore rules.
Weather and geocoding
Weather and geocoding functionality uses third-party services. Review the applicable provider terms, attribution requirements, fair-use policies, rate limits, and production suitability before operating a public service.
Architecture at a glance
The repository is organized into a React client, service modules, and a Node.js/Express server.
Zinnia-AI/
├── server.ts                 # Express server, API routes, WebSocket setup
├── server/
│   ├── codingEngine.ts       # Coding workflow and execution helpers
│   ├── mathEngine.ts         # Mathematical verification helpers
│   └── reasoningAdapter.ts   # Reasoning service integration
├── src/
│   ├── components/           # User interface components
│   ├── hooks/                # React hooks and application state
│   ├── lib/                  # Shared utilities
│   ├── services/             # AI, auth, Firebase, chat and weather services
│   ├── App.tsx               # Main application experience
│   └── main.tsx              # Frontend entry point
├── public/                   # Static public assets
├── firestore.rules           # Firestore security rules
├── .env.example              # Environment variable example
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
Privacy, security, and responsible use
Zinnia AI is intended to handle user conversations and potentially personal information. Security and privacy must be treated as ongoing product requirements.
- Do not publish API keys or other secrets in source control.
- Enforce authentication and authorization on the server and in Firebase rules.
- Validate and limit all user input at API boundaries.
- Apply rate limiting, abuse prevention, request-size limits, and appropriate logging controls before public launch.
- Treat code execution as a security-sensitive capability. Run untrusted code only in a hardened, isolated environment with strict CPU, memory, time, filesystem, process, and network restrictions.
- Provide clear privacy disclosures and retention/deletion controls for user data.
- Review third-party provider policies and data handling before sending user content to external services.
Deployment notice: this repository is a source-code project, not a claim that a production SaaS environment is already provisioned or independently security-audited. Authentication, data isolation, server hardening, billing, monitoring, abuse prevention, backups, and compliance must be verified for the specific production deployment.
Roadmap
Zinnia AI is an evolving product. Future development may include improvements to:
- Reliability and quality of AI responses.
- Mathematical and coding evaluation and verification.
- Cross-device account and conversation experience.
- Performance, accessibility, and localization.
- Privacy controls and account management.
- Production observability, security, and scalability.
- Commercial plans and service administration.
Roadmap items are directional and should not be interpreted as currently available features.
Contributing
Zinnia AI is developed as an independent product. Contribution guidelines may be added as the project establishes its public development process.

For now, please use GitHub Issues to report reproducible bugs or suggest improvements. Include relevant environment details and steps to reproduce, but never include API keys, passwords, personal data, or other secrets.
- Report a bug or request a feature
- View the source code
Commercial use and licensing
Zinnia AI is intended to become a commercial product. No open-source license is currently declared in this repository. Until a license is added, no rights to use, copy, modify, redistribute, or commercially exploit this source code are granted by implication. Contact the project owner for permission.

Zinnia AI also integrates third-party libraries, APIs, and services, each of which is governed by its own license and terms. Commercial deployment requires reviewing those obligations and ensuring that the product's name, branding, and distribution do not infringe third-party rights.
Disclaimer
AI-generated responses can be incomplete, inaccurate, or unsuitable for a particular purpose. Users should independently verify important mathematical, technical, financial, legal, medical, or safety-critical decisions. Weather and other third-party data may be delayed, unavailable, or inaccurate.

Zinnia AI is provided on an evolving basis. Features, model availability, supported integrations, and service conditions may change.
About the creator
Zinnia AI is created and maintained by Sreemon Ghosh.
- GitHub: @sreemonghosh
- Project repository: Zinnia AI
<p align="center">
  <strong>Zinnia AI</strong><br>
  <em>Think clearly. Solve confidently. Create freely.</em>
</p>
