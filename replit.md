# Study Tracker App

## Overview

This is a full-stack study tracker application built with a modern web development stack. The app helps users schedule study sessions, track their progress, and stay motivated with features like a built-in timer, music player, and motivational quotes. It follows a mobile-first design approach with a clean, modern interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Storage**: PostgreSQL sessions with connect-pg-simple
- **Development**: Hot module replacement with Vite middleware integration

### Mobile-First Design
- **Layout**: Bottom navigation pattern optimized for mobile devices
- **Responsive**: Tailored for mobile screens with max-width constraints
- **Touch-Friendly**: Large touch targets and gesture-friendly interactions

## Key Components

### Database Schema (shared/schema.ts)
- **Study Sessions**: Core entity tracking scheduled study periods with subjects, duration, and completion status
- **Session Progress**: Daily progress tracking linked to study sessions
- **User Settings**: Personalization options including music preferences and notifications

### API Layer (server/routes.ts)
- RESTful endpoints for CRUD operations on study sessions
- Progress tracking endpoints with date range filtering
- User settings management
- Active session management for real-time timer functionality

### Storage Abstraction (server/storage.ts)
- Interface-based storage system allowing for multiple implementations
- In-memory storage for development/testing
- Database storage implementation using Drizzle ORM
- Async/await pattern throughout for consistent data access

### Core Features
- **Timer System**: Pomodoro-style timer with customizable durations
- **Music Player**: Background music with volume control and track selection
- **Progress Tracking**: Weekly and monthly progress visualization
- **Motivational System**: Daily quotes to encourage study habits

## Data Flow

1. **Client Requests**: React components make API calls through TanStack Query
2. **API Processing**: Express routes handle requests and interact with storage layer
3. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
4. **Response Handling**: JSON responses with proper error handling and logging
5. **State Updates**: React Query automatically updates UI when data changes

### Real-time Features
- Active session tracking allows users to resume sessions across page refreshes
- Timer state management with localStorage persistence
- Automatic progress updates when sessions are completed

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production
- **Drizzle Kit**: Database migrations and schema management
- **Connection Pooling**: Built-in connection management via Neon's serverless driver

### UI Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Consistent icon library for UI elements
- **Embla Carousel**: Touch-friendly carousel components
- **Date-fns**: Date manipulation and formatting utilities

### Development Tools
- **TSX**: TypeScript execution for development server
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment optimization with runtime error handling

## Deployment Strategy

### Development
- **Dev Server**: TSX runs the Express server with hot reloading
- **Frontend**: Vite dev middleware serves React app with HMR
- **Database**: Environment variable-based connection to Neon database

### Production
- **Build Process**: 
  1. Vite builds React app to `dist/public`
  2. ESBuild bundles Express server to `dist/index.js`
- **Serving**: Express serves static files and API routes from single process
- **Database**: Production Neon database via CONNECTION_URL environment variable

### Environment Configuration
- **Type Safety**: Shared TypeScript types between client and server
- **Path Aliases**: Consistent import paths using TypeScript path mapping
- **Asset Management**: Vite handles asset optimization and bundling

The application is designed to be easily deployable on platforms like Replit, Vercel, or traditional VPS hosting with minimal configuration required.