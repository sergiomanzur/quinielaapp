# ⚽ Quiniela App

A comprehensive football tournament prediction application that allows users to create tournaments, add matches, and make predictions. Built by Sergio Manzur.

![Quiniela App](https://img.shields.io/badge/Quiniela-App-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Overview

Quiniela App is a full-stack application that allows users to:
- Create football tournament prediction pools (quinielas)
- Add matches to tournaments
- Make predictions for match outcomes
- Track points based on prediction accuracy
- View real-time statistics and leaderboards

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **React Router v7** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Moment.js** - Date handling and formatting

### Backend
- **Node.js 18.x** - JavaScript runtime
- **Express** - Web framework
- **MySQL 8** - Relational database
- **mysql2** - MySQL client for Node.js

### Development & Deployment Tools
- **Vercel** - Deployment platform
- **ESLint** - Code linting
- **dotenv** - Environment variable management
- **Concurrently** - Run multiple scripts simultaneously

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- MySQL 8.0 or higher
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/quiniela.git
cd quiniela
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your MySQL database details:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_DATABASE=quiniela_db
DB_PORT=25060
```

### Database Setup

1. Create a MySQL database:

```sql
CREATE DATABASE quiniela_db;
```

2. Initialize the database tables and default users:

```bash
npm run db:init
```

This script creates all necessary tables and adds two admin users:
- sergiom2010@gmail.com (password: abc0123abc)
- sergiomanzur1@gmail.com (password: abc0123abc)

### Running the Application

1. Start the development server:

```bash
npm run dev
```

The application should now be running at http://localhost:5173.

## API Endpoints

### Authentication
- `POST /api/users/login` - Log in with email and password
- `POST /api/users/register` - Register a new user

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Quiniela Management
- `GET /api/quinielas` - Get all quinielas
- `POST /api/quinielas` - Save all quinielas

### System Status
- `GET /api/health` - Check system health

## Database Schema

The database consists of the following tables:
- `users` - User accounts and authentication
- `quinielas` - Football tournament definitions
- `matches` - Individual matches within tournaments
- `participants` - Users participating in tournaments
- `predictions` - User predictions for matches
