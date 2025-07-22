# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese e-commerce system prototype (飲食店向け通信販売システム) built for a software development course. The system consists of a React frontend and Node.js/Express backend with SQLite database, implementing basic CRUD operations and image upload functionality.

## Architecture

**Frontend**: React application using functional components and hooks for state management
- Located in `frontend/src/`
- Uses environment variables for API URL configuration
- Implements product search, CRUD operations, and image upload

**Backend**: Express.js REST API server
- Located in `backend/`
- Uses SQLite database (`Inshokuten.sqlite3`)
- Provides image serving via static middleware
- Implements transaction-based database operations

**Database Schema**:
- `TestTable`: Development table with ID, Name, Price
- `Products`: Product master with ProductID, Name, Price
- `Stocks`: Inventory with ProductID, StockQuantity1 (actual), StockQuantity2 (available)

## Development Commands

### Frontend (React)
```bash
cd frontend/src
npm start      # Start development server (port 3000)
npm run build  # Build for production
npm test       # Run tests
```

### Backend (Node.js)
```bash
cd backend
node server2.js  # Start server (port 3001)
```

### Database
The SQLite database file `Inshokuten.sqlite3` exists in both root and backend directories. Backend uses local copy.

## Environment Configuration

**Local Development**: 
- Frontend configured to use `http://localhost:3001`

**Codespaces/Remote**: 
- Update `frontend/.env` with the assigned URL's port 3001
- Example: `REACT_APP_API_URL=https://ideal-space-succotash-vxj749x67r4cw6vr-3001.app.github.dev`

## API Endpoints

### Product Management
- `GET /api/products?q={query}` - Search products by name
- `GET /api/TestTable` - Get all test data
- `POST /api/TestTable` - Create new record
- `PUT /api/TestTable/:id` - Update record
- `DELETE /api/TestTable/:id` - Delete record

### File Upload
- `POST /api/upload` - Upload image with ID (renames to `{id}.jpg`)
- `GET /images/{id}.jpg` - Serve uploaded images

## Key Implementation Details

**Database Operations**: All write operations use transactions with rollback on error

**Image Management**: 
- Images stored in `backend/public/images/`
- Automatic renaming to ID-based filenames
- Fallback to placeholder.jpg for missing images

**State Management**: React hooks for local state, no external state management library

**Error Handling**: Basic error responses with status codes and messages

## Development Notes

- Backend lacks input validation and security measures (prototype only)
- File uploads overwrite existing files without confirmation
- Database connection uses verbose mode for debugging
- No authentication or authorization implemented
- Comments and console logs are in Japanese

## File Structure
```
├── backend/
│   ├── server2.js (main server file)
│   ├── package.json
│   ├── Inshokuten.sqlite3
│   └── public/images/
├── frontend/src/
│   ├── src/App.js (main React component)
│   ├── package.json
│   └── .env
└── Definition_of_Elements/ (project documentation)
```