# Nudge - Project Collaboration Platform

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white)
![SMTP](https://img.shields.io/badge/SMTP-FF6600?logo=minutemailer&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

[![Nudge Logo](Photos/Nudge.gif)](https://project-collab-app.vercel.app/)

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Subscription & Payment System](#subscription--payment-system)
   - [Subscription Tiers](#subscription-tiers)
   - [Auto-Accept Team Invitation](#auto-accept-team-invitation)
4. [🛠️ Technology Stack](#️-technology-stack)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [DevOps](#devops)
5. [Testing](#testing)
   - [Test Coverage](#test-coverage)
   - [Testing Technologies](#testing-technologies)
   - [Running Tests](#running-tests)
   - [Test Categories](#test-categories)
6. [Architecture](#architecture)
7. [Subscription System Architecture](#subscription-system-architecture)
   - [Payment Flow](#payment-flow)
8. [Security Features](#security-features)
   - [Authentication & Authorization](#authentication--authorization)
   - [Data Protection](#data-protection)
   - [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
   - [Security Headers](#security-headers)
9. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
10. [Local Development](#local-development)
11. [Contribution](#contribution)

---

## Overview

Nudge is a sophisticated project collaboration platform designed to streamline team workflows and enhance productivity through intuitive project management tools. This full-stack application provides teams with a centralized workspace to create, track, and complete projects with ease.

🔗 **Live Demo**: [project-collab-app.vercel.app](https://project-collab-app.vercel.app/)  
 **Backend**: Express.js API with PostgreSQL database deployed on Nortflank

**Accounts created with email/password require activation before login. You can sign up with Google or GitHub for instant verification.**

## Key Features

- **Project Management**: Create, edit, and organize projects
- **Team Collaboration**: Invite team members, assign roles, and track contributions
- **Role-Based Access Control**: Three-tiered permission system (Admin, Editor, Member) for secure collaboration
- **Task Management**: Create, assign, and track tasks with priority levels, due dates, and status tracking
- **Real-time Communication**: Integrated real-time chat system for both direct messaging and team discussions
- **Email Service**: Email system for account verification, password reset, project invitations, security notifications and much more
- **File Management**: Upload, organize, and share files within projects and tasks
- **Comprehensive Dashboard**: Visual overview of projects, tasks, and recent activities
- **Calendar & Deadlines**: Track important project milestones and deadlines
- **Kanban Board View**: Drag-and-drop task management with visual workflow stages
- **Responsive Design**: Fully mobile-responsive interface for collaboration on any device

![Nudge Logo](Photos/Messages.png)

## Subscription & Payment System

- **Flexible Subscription Plans**: Three-tiered pricing (Starter, Pro, Enterprise) with different limits and features
- **Stripe Integration**: Secure payment processing with Stripe Checkout and Billing Portal
- **Usage-Based Limits**: Project and team member limits based on subscription tier
- **Real-time Billing**: Automatic subscription management with webhook integration

### Subscription Tiers

| Plan           | Projects  | Team Members | Storage | Price     |
| -------------- | --------- | ------------ | ------- | --------- |
| **Starter**    | 5         | 4            | 100MB   | Free      |
| **Pro**        | 100       | 15           | 10GB    | $29/month |
| **Enterprise** | Unlimited | Unlimited    | 100GB   | $79/month |

![Nudge Logo](Photos/Subscription.png)

### Auto-Accept Team Invitation

For demo and testing purposes, any invitation sent to "pritam.amit26@gmail.com" to join a project as a member will be automatically accepted.

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **UI**: TailwindCSS with customized UI components
- **Authentication**: NextAuth.js with email/password and social authentication (Google, Github)
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: UploadThing integration

### Backend

- **Server**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time Communication**: Socket.IO server
- **Email Service**: Integrated with Resend/SMTP for notifications
- **Payment Processing**: Stripe integration with webhooks for subscription management

### DevOps

- **Docker** with multi-container setup
- **Docker Compose** for local development and deployment

## Testing

Nudge includes a comprehensive testing suite demonstrating modern testing practices and code quality assurance:

### Test Coverage

- **Backend Tests**: 40 tests covering authentication, validation, and utility functions
- **Frontend Tests**: 47 tests covering components, forms, and user interactions
- **Total Coverage**: 87 tests ensuring reliability and maintainability

### Testing Technologies

- **Backend**: Jest, Supertest, TypeScript testing with mocked dependencies
- **Frontend**: Jest, React Testing Library, user event simulation
- **Coverage Reporting**: Detailed coverage analysis with HTML and LCOV reports

### Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Categories

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing with mocked dependencies
- **Component Tests**: React component rendering and user interaction testing
- **Security Tests**: Input validation, sanitization, and authentication testing

## Architecture

Nudge is built on a modern, microservices-oriented architecture:

- **Frontend Container**: Next.js application serving the user interface
- **Backend Container**: Express API providing business logic and data access
- **Database Container**: PostgreSQL instance for persistent storage

The application uses a RESTful API for most operations, with Socket.io for real-time features like messaging and status updates.

![Nudge Logo](Photos/File-System.png)

## Subscription System Architecture

### Payment Flow

1. **Plan Selection**: Users choose from Starter, Pro, or Enterprise plans
2. **Stripe Checkout**: Secure payment processing through Stripe Checkout
3. **Webhook Processing**: Real-time subscription updates via Stripe webhooks
4. **Database Sync**: Automatic subscription status and limits updates
5. **Billing Portal**: Self-service billing management for customers

## Security Features

### Authentication & Authorization

- **Email Verification**: Required account activation for email/password registrations
- **Password Security**: Enforced strong password requirements with bcrypt hashing

### Data Protection

- **Input Validation**: Comprehensive request validation using Joi schemas
- **HTML Sanitization**: Protection against XSS attacks through input sanitization
- **SQL Injection Prevention**: Prisma ORM provides built-in protection against SQL injection
- **CORS Configuration**: Properly configured cross-origin resource sharing

### Rate Limiting & DDoS Protection

- **Global Rate Limiting**: 1000 requests per 15 minutes per IP
- **Authentication Rate Limiting**: 10 login attempts per 15 minutes per IP
- **Message Rate Limiting**: 300 messages per minute per IP
- **Targeted Protection**: Specific limits for sensitive endpoints

### Security Headers

- **Helmet.js Integration**: Comprehensive security headers including:
  - Content Security Policy (CSP)
  - X-Frame-Options (Clickjacking protection)
  - X-Content-Type-Options (MIME sniffing protection)
  - Referrer Policy controls
  - Permissions Policy restrictions

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/atpritam/project-collab-app.git
cd project-collab-app
```

2. Set up environment variables:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Required Environment Variables:**

**Backend (.env):**

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nudge_db"

# JWT
JWT_SECRET="your-jwt-secret"

# Email (Resend/SMTP)
EMAIL_FROM="noreply@yourdomain.com"
RESEND_API_KEY="your-resend-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="http://localhost:3000"

# Server
PORT=4000
```

**Frontend (.env.local):**

```bash
# API
NEXT_PUBLIC_API_URL="http://localhost:4000"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# UploadThing
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
```

3. Start the application with Docker:

```bash
docker-compose up
```

4. Set up Stripe (for subscription features):

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Linux/Windows - Download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:4000/api/subscriptions/webhook

# Copy the webhook secret to your backend .env file
```

5. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Prisma Studio (database explorer): http://localhost:5555

## Local Development

For local development without Docker:

1. Install dependencies:

   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd backend
   npm install
   ```

2. Set up the database:

   ```bash
   cd backend
   npx prisma migrate dev
   ```

3. Start the development servers:

   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd backend
   npm run dev
   ```

![Nudge Logo](Photos/Dashboard.png)

## Contribution

This project demonstrates my skills in full-stack development, architecture design, payment system integration, and creating intuitive user experiences. As a portfolio piece, it showcases my ability to build complex systems with modern web technologies including:

- **Full-Stack Development**: Next.js, Express.js, PostgreSQL, TypeScript
- **Payment Integration**: Stripe subscription management with webhooks
- **Real-time Features**: Socket.IO for messaging and live updates
- **Authentication & Security**: JWT, OAuth, rate limiting, input validation
- **Database Design**: PostgreSQL with complex relationships and queries
- **Testing & Quality Assurance**: Comprehensive test suite with Jest, React Testing Library, and Supertest
- **DevOps**: Docker containerization and deployment strategies

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

© 2025 Nudge. All rights reserved.
