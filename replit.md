# Weather Application

## Overview

This is a full-stack weather application built with React and Express.js that provides comprehensive weather information including current conditions, forecasts, weather alerts, and interactive maps. The application uses a modern tech stack with TypeScript, React Query for state management, shadcn/ui for components, and Tailwind CSS for styling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Data Storage**: In-memory storage implementation with interface for easy database integration
- **API Design**: RESTful endpoints for weather data, location search, alerts, and forecasts
- **Development**: Hot reload support with Vite integration in development mode

### Database Schema
The application defines comprehensive database schemas for:
- **Locations**: Geographic data with coordinates, names, and regional information
- **Weather Data**: Current conditions including temperature, humidity, wind, and atmospheric data
- **Weather Alerts**: Emergency weather notifications with severity levels and time ranges
- **Forecast Data**: Multi-day weather predictions
- **Hourly Forecast**: Detailed hourly weather projections

### API Architecture
RESTful API endpoints organized by functionality:
- `/api/locations/*` - Location search and coordinate-based lookups
- `/api/weather/*` - Current weather data retrieval
- `/api/alerts/*` - Weather alert management
- `/api/forecast/*` - Multi-day forecast data
- `/api/hourly/*` - Hourly forecast information

### Component Architecture
Modular React components organized by feature:
- **Weather Components**: Current weather display, forecasts, alerts, and interactive maps
- **UI Components**: Reusable design system components from shadcn/ui
- **Layout Components**: Application shell and navigation structure
- **Hook Components**: Custom React hooks for mobile detection and toast notifications

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database using `@neondatabase/serverless`
- **Drizzle Kit**: Database migration and schema management tools

### Weather APIs
- **National Weather Service API**: Primary weather data source for US locations (no API key required)
- **Fallback Mock Data**: For international locations and development testing

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives for all interactive components
- **Lucide React**: Icon library providing consistent iconography throughout the application
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Class Variance Authority**: Type-safe component variant management

### Development and Build Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Static typing for both frontend and backend code
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Runtime and Utilities
- **React Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities
- **Zod**: Schema validation for API requests and responses
- **Wouter**: Lightweight routing solution for single-page application navigation