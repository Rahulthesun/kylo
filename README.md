🧠 Kylo

Build focus. Ship faster.

Kylo is an AI-powered productivity execution layer built with Electron + React + Supabase.

It helps you break work into structured tasks, manage projects, and execute with clarity — powered by intelligent assistance.

🌐 Landing: https://kylo.buildify-web.com

⸻

🚀 What is Kylo?

Kylo is not just a task manager.

It is a focused execution environment that combines:
	•	🗂 Project-based organization
	•	✅ Task & subtask management
	•	🎯 Priority marking
	•	🧠 AI-assisted task breakdown
	•	🔐 Secure authentication
	•	☁️ Supabase backend persistence

Designed to feel minimal. Built to scale.

⸻

✨ Core Features

📁 Projects
	•	Color-based project creation
	•	Default Inbox for general tasks
	•	Automatic project-based filtering
	•	Persistent storage via Supabase

✅ Tasks
	•	Add / Delete tasks
	•	Mark as complete
	•	Toggle important (⭐)
	•	Deadline support
	•	Estimated duration (minutes)

🔎 Subtasks
	•	Nested subtasks
	•	Individual completion toggles
	•	Persistent relational storage
	•	Synced across sessions

🔐 Authentication
	•	Email / Password login
	•	Signup support
	•	Session persistence
	•	Secure sign out

🤖 AI Layer (In Progress)
	•	GPT-4o integration via Supabase Edge Functions
	•	Secure Azure OpenAI backend
	•	Planned structured task generation

⸻

🏗 Tech Stack
	•	⚛ React + TypeScript
	•	⚡ Vite
	•	🖥 Electron
	•	🎨 TailwindCSS
	•	🗄 Supabase (Auth + Postgres + Edge Functions)
	•	🤖 Azure OpenAI (GPT-4o)

  PROJECTR STRUCTURE :

  kylo/
├── electron/
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── App.tsx
├── supabase/
│   └── functions/
├── package.json
└── vite.config.ts