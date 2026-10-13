# AI House Builder — Complete Working Project

## Features
- React + Vite frontend
- Express backend
- Gemini AI room-plan generation
- Automatic 2D architectural floor plan
- Interactive 3D open-roof style view
- Room dimensions, area and cost estimate
- Entry/facing/road information
- Login/register UI for local demo
- Responsive dark architectural UI

## Requirements
- Node.js 20+ (Node 24 is supported)
- Gemini API key

## 1. Backend
```bash
cd backend
npm install
copy .env.example .env
```
Open `backend/.env` and put your Gemini API key:
```env
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```
Then:
```bash
npm run dev
```
Backend: http://localhost:5000

## 2. Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally http://localhost:5173

## 3. Test prompt
```text
Design a modern 3BHK house on a 30x40 feet plot.
Requirements:
- 3 bedrooms
- 2 bathrooms
- spacious living room
- modular kitchen
- dining area
- car parking
- small garden
- 1 balcony
- good ventilation
- practical room arrangement
```

## Important
The ZIP intentionally does NOT contain a real API key. Put your key in `backend/.env` after extracting the project.
