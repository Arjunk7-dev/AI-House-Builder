
# AI House Builder — Complete Working Project

AI House Builder is an AI-powered house planning application that converts natural-language requirements into structured house plans, 2D floor plans, and interactive 3D visualizations.

## Features

- React + Vite frontend
- Node.js + Express backend
- Gemini AI-powered room-plan generation
- Automatic 2D architectural floor plan
- Interactive open-roof 3D house view
- Room dimensions and area calculations
- Estimated construction cost
- Entry direction, plot facing, and road information
- Login and registration UI for local demonstration
- Responsive dark architectural interface

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- React Router
- React-based 2D/3D visualization components

**Backend**
- Node.js
- Express.js
- Google Gemini API

## Requirements

- Node.js 20 or later
- npm
- Google Gemini API key
- Git

## Project Structure

```text
AI-House-Builder/
├── backend/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/AI-House-Builder.git
cd AI-House-Builder
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory.

Add your configuration:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=YOUR_SUPPORTED_GEMINI_MODEL
PORT=5000
```

Replace the placeholder values with your actual configuration. Keep the `.env` file private and never commit it to GitHub.

Start the backend:

```bash
npm run dev
```

Backend URL: http://localhost:5000

> The backend start command depends on the scripts configured in `backend/package.json`.

### 3. Set Up the Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite. It is commonly:

http://localhost:5173

If Vite selects another port, use the URL printed in the terminal.

### 4. Test Prompt

Try this prompt in the AI House Builder generator:

```text
Design a modern 3BHK house on a 30x40 feet plot.

Requirements:
- 3 bedrooms
- 2 bathrooms
- Spacious living room
- Modular kitchen
- Dining area
- Car parking
- Small garden
- 1 balcony
- Good ventilation
- Practical room arrangement
```

## Security Notes

- Never upload `.env` files or API keys to GitHub.
- Keep the Gemini API key on the backend.
- Do not expose secret keys in frontend code.
- The current login and registration interface uses local browser storage for demonstration and is not production-grade authentication.

## Important Disclaimer

Generated floor plans and construction cost estimates are conceptual estimates. Verify dimensions, structural design, building regulations, and construction costs with qualified professionals before building.

## Future Improvements

- Secure backend authentication
- Database integration for user accounts and saved projects
- Downloadable floor plans
- Improved cost estimation
- Production deployment

## Author

Developed as an AI-powered house planning project using React, Express, and Google Gemini.
