# Quiniela App

A football tournament prediction application built with React, Node.js, and MySQL.

## Setup

### Requirements

- Node.js 18.x
- MySQL 8.0 or higher

### Environment Setup

1. Copy the example environment file to create your own:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your MySQL database details:

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

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

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
