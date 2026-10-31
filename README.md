
# 🌸 Zinnia AI

### Your Intelligent AI Companion — Think, Solve, Create.

<p align="center">
  <strong>One AI. Multiple Possibilities.</strong>
</p>

<p align="center">
  An intelligent AI assistant designed to help people solve complex problems, understand mathematics, write code, explore ideas, and accomplish more through AI-powered technology.
</p>

<p align="center">
  <a href="https://github.com/sreemonghosh/Zinnia-AI">
    <img src="https://img.shields.io/badge/GitHub-Zinnia%20AI-black?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Firebase-Integrated-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase">
</p>

---

## 🚀 About Zinnia AI

**Zinnia AI** is an independent artificial intelligence assistant developed to make advanced AI capabilities accessible through a unified, intelligent, and user-friendly platform.

The vision behind Zinnia AI is to create more than just another chatbot. It is designed as a comprehensive AI ecosystem that combines conversational intelligence, mathematical reasoning, numerical problem-solving, programming assistance, image understanding, and real-time voice interaction.

Whether someone wants to understand a complicated concept, solve a mathematical equation, develop software, debug programming errors, or simply explore an idea, Zinnia AI aims to provide an intelligent environment to accomplish these tasks.

Zinnia AI is being developed with a global audience and long-term commercial potential in mind.

### Our Mission

To make artificial intelligence more accessible, practical, reliable, and useful for everyone.

### Our Vision

To build an intelligent AI ecosystem that brings together advanced reasoning, computational capabilities, programming assistance, and everyday productivity in one unified platform.

---

## ✨ Key Features

### 🤖 1. Intelligent AI Assistant
- General-purpose AI conversations.
- Context-aware responses.
- Multiple AI model options.
- Natural language understanding.
- Image-based question answering.
- Conversation history and management.

### 🧮 2. Advanced Mathematical Reasoning
- Step-by-step mathematical solutions.
- Algebra and calculus.
- Differentiation and integration.
- Matrix operations.
- Mathematical simplification.
- Numerical computation.
- Engineering and scientific problem-solving.
- Mathematical verification utilities.

### 🔢 3. Numerical Problem Solver
- Dedicated numerical-solving workflow.
- Mathematical calculations.
- Multi-step problem-solving.
- Symbolic and numerical verification.
- Detailed solution explanations.

### 💻 4. Advanced Coding Assistant

Zinnia AI includes specialized coding workflows designed to support software developers and programmers.

Supported coding workflows include:

- Code Generation
- Code Debugging
- Code Explanation
- Code Optimization
- Code Conversion
- Data Structures and Algorithms
- Project Architecture
- SQL and Database Assistance
- Test Case Generation
- Coding Interview Preparation

The AI can assist with a wide range of programming languages, including:

- Python
- JavaScript
- TypeScript
- C
- C++
- Java
- HTML
- CSS
- SQL
- PHP
- And other programming languages.

**Code Execution:** The current execution implementation supports Python 3 and JavaScript (Node.js). Other languages may receive code-generation assistance without native execution support.

### 🖼️ 5. AI Image Understanding
- Upload images and ask questions.
- AI-powered image analysis.
- Visual content interpretation.
- Image-based problem-solving.

### 🎙️ 6. Live Voice Assistant
- Real-time voice interaction.
- Speech-based communication.
- AI-generated audio responses.
- Conversational voice experience.

### 🌦️ 7. Smart Weather Assistant
- Location-based weather information.
- Current weather conditions.
- Temperature and humidity.
- Weather forecasting.
- Geolocation-based weather retrieval.

### 👤 8. User Authentication and Accounts
- Email and password authentication.
- Google sign-in.
- User profile management.
- Password reset functionality.
- Email verification.
- Device session management.
- Cross-device account access.

### ☁️ 9. Cloud-Based Chat Synchronization
- Cloud-synchronized conversations.
- Access chat history across devices.
- Real-time conversation updates.
- Save, pin, archive, and delete conversations.
- Persistent account-based chat history.

### 📚 10. Chat History Management
- Conversation history.
- Multiple chat sessions.
- Conversation organization.
- Message editing and deletion.
- Saved conversations.
- Archived conversations.

---

## 🛠️ Technology Stack

Zinnia AI is developed using modern web technologies and cloud-based services.

| Category | Technology |
|---|---|
| Frontend | React 19 |
| Programming Language | TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Backend | Node.js |
| Server Framework | Express.js |
| AI Integration | Google GenAI SDK |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Real-Time Communication | WebSocket |
| Mathematical Processing | math.js |
| Mathematical Rendering | KaTeX |
| Markdown Rendering | React Markdown |
| Code Highlighting | Prism.js |
| Weather Services | Open-Meteo |
| Geocoding | OpenStreetMap Nominatim |

---

## 🏗️ Application Architecture

Zinnia AI follows a modern client-server architecture.

```text
Zinnia AI
│
├── Frontend
│   ├── React
│   ├── TypeScript
│   ├── Tailwind CSS
│   └── Vite
│
├── Backend
│   ├── Node.js
│   ├── Express.js
│   ├── AI API Routes
│   ├── Reasoning Engine
│   └── Coding Engine
│
├── AI Services
│   ├── General AI Assistant
│   ├── Mathematical Reasoning
│   ├── Numerical Solver
│   ├── Coding Assistant
│   └── Image Understanding
│
├── Firebase
│   ├── Authentication
│   ├── Cloud Firestore
│   └── Chat Synchronization
│
└── Additional Services
    ├── Live Voice
    ├── Weather API
    └── Geolocation
```

---

## 💻 Installation and Setup

Follow these instructions to run Zinnia AI locally.

### Prerequisites

Make sure you have installed:

- Node.js (supported LTS version)
- npm
- Git
- A code editor such as Visual Studio Code

### Step 1: Clone the Repository

```bash
git clone https://github.com/sreemonghosh/Zinnia-AI.git
```

### Step 2: Navigate to the Project

```bash
cd Zinnia-AI
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root.

Add your Google AI API key:

```env
GOOGLE_API_KEY=your_google_ai_api_key
GEMINI_API_KEY=your_google_ai_api_key
```

Use the actual environment variables required by your configured services.

Never upload private API keys or credentials to GitHub.

### Step 5: Configure Firebase

1. Create a Firebase project.
2. Configure Firebase Authentication.
3. Enable Google authentication if required.
4. Configure Cloud Firestore.
5. Review Firestore security rules.
6. Configure your authorized domains.
7. Verify your Firebase application configuration.

### Step 6: Start the Development Server

```bash
npm run dev
```

Open the local development URL displayed in your terminal.

### Step 7: Build for Production

```bash
npm run build
```

### Step 8: Start the Production Server

```bash
npm start
```

---

## 📂 Project Structure

```text
Zinnia-AI/
│
├── public/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── server/
│   ├── codingEngine.ts
│   ├── mathEngine.ts
│   └── reasoningAdapter.ts
│
├── server.ts
│
├── firestore.rules
├── firebase-applet-config.json
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔐 Security and Privacy

Security and privacy are important requirements for the development of Zinnia AI.

The project incorporates Firebase Authentication and user-specific Firestore data structures.

Before production deployment, the following areas must be reviewed and hardened:

- Secure API key management.
- Authentication and authorization.
- Firestore security rules.
- User data isolation.
- Secure session management.
- API rate limiting.
- Abuse prevention.
- Secure code execution.
- Data retention and account deletion.
- Privacy and data protection policies.

**Important:** The current repository should not be considered independently security-audited or production-hardened. In particular, user-submitted code execution must be moved into a properly isolated execution environment before exposing it to public users.

---

## 🌍 Global Product Vision

Zinnia AI is being developed as an independent AI product with the ambition of reaching users worldwide.

The long-term objective is to create an intelligent platform that combines:

- AI-powered productivity.
- Advanced mathematical reasoning.
- Programming and software development.
- Scientific and engineering assistance.
- Natural voice interaction.
- Intelligent personal assistance.

The goal is to continuously improve the platform through research, engineering, innovation, and user feedback.

---

## 🗺️ Development Roadmap

Zinnia AI is an evolving product.

Planned areas of continued development include:

- [ ] Improve mathematical reasoning accuracy.
- [ ] Expand programming language execution support.
- [ ] Improve AI response reliability.
- [ ] Enhance cross-device synchronization.
- [ ] Strengthen account security.
- [ ] Introduce subscription and payment infrastructure.
- [ ] Develop advanced personalization.
- [ ] Improve mobile experience.
- [ ] Expand international language support.
- [ ] Improve infrastructure scalability.
- [ ] Introduce advanced user privacy controls.

Roadmap items represent development goals, not necessarily currently available features.

---

## 🤝 Feedback and Support

Your feedback can help improve Zinnia AI.

If you discover a bug, experience an issue, or have an idea for improvement, please open an issue on GitHub.

**GitHub Issues:**

https://github.com/sreemonghosh/Zinnia-AI/issues

---

## 📜 License and Commercial Use

Zinnia AI is intended to be developed as an independent commercial AI product.

The repository currently does not declare an open-source license.

Unless the project owner explicitly grants permission, no rights to copy, redistribute, modify, or commercially exploit this source code are granted.

Third-party dependencies and integrations remain subject to their respective licenses and terms.

---

## 👨‍💻 Creator

**Created and Developed by Sreemon Ghosh**

Independent Developer | AI Product Development

GitHub: https://github.com/sreemonghosh

Project: https://github.com/sreemonghosh/Zinnia-AI

---

<p align="center">
  <h2 align="center">🌸 Zinnia AI</h2>
  <p align="center">
    <strong>Think Clearly. Solve Confidently. Create Freely.</strong>
  </p>
  <p align="center">
    Building a smarter future with artificial intelligence.
  </p>
</p>

---

<p align="center">
  Made with ❤️ and Artificial Intelligence.
</p>
