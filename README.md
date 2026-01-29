# Swing.ai

AI-Powered Golf Training App - Where competitive learning meets personalized coaching.

## Overview

Swing.ai is a gamified golf learning platform that combines:
- **AI-powered vision analysis** to assess your swing and skill level
- **Personalized training plans** tailored to your handicap and goals
- **Smart Reviews** using AI to help you refine lessons you've already learned
- **Competitive leaderboards** and challenges with players at your skill level
- **Remote, affordable, membership-based** golf training

Think of it as "Duolingo meets golf" - making golf lessons accessible, fun, and competitive.

## Project Structure

```
Swing.ai/
├── design/               # Original HTML design files (prototypes)
│   ├── home.html
│   ├── onboarding.html
│   ├── initial_swing_setup.html
│   ├── swing_recording.html
│   ├── swing_analysis.html
│   ├── personalized_plan_overview.html
│   ├── daily_lesson_content.html
│   ├── drill_details.html
│   ├── quick_drills_selection.html
│   ├── smart_review.html
│   ├── challenge_leaderboard.html
│   └── profile.html
│
├── src/
│   ├── screens/         # One React component per screen/page
│   ├── components/      # Reusable UI components
│   ├── styles/          # CSS files extracted from designs
│   ├── App.jsx          # Main app component with routing
│   └── main.jsx         # Entry point
│
├── package.json
├── vite.config.js
└── index.html
```

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **ESLint** - Code linting

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the Vite dev server. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Development Workflow

### Converting HTML Designs to React

1. **Pick an HTML file** from `design/` folder
2. **Create a screen component** in `src/screens/` (e.g., `HomeScreen.jsx`)
3. **Extract styles** to appropriate CSS file in `src/styles/`
4. **Extract reusable components** to `src/components/` if needed
5. **Add route** to `src/App.jsx`
6. **Test** the screen in the browser

### Naming Conventions

- **Screens**: `HomeScreen.jsx`, `ProfileScreen.jsx` (PascalCase + "Screen" suffix)
- **Components**: `Button.jsx`, `Header.jsx` (PascalCase)
- **Styles**: `HomeScreen.css`, `Button.css` (match component names)

## Features to Implement

- [ ] User onboarding flow
- [ ] Swing recording and analysis
- [ ] Personalized training plans
- [ ] Daily lessons and drills
- [ ] Smart review system
- [ ] Leaderboards and challenges
- [ ] User profile and progress tracking

## Future Enhancements

- Backend API integration
- Real-time video processing
- Social features (friends, groups)
- Push notifications
- Mobile app (React Native)

---

Built with ⛳ by the Swing.ai team

