# Karisma 5S Audit System

## Overview

This is a full-stack web application for managing 5S workplace organization audits. The system provides a comprehensive solution for scheduling, conducting, and tracking 5S audits with features for user management, action tracking, and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Upload**: Multer for handling image uploads
- **Session Management**: PostgreSQL-backed sessions

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migration Strategy**: Database migrations stored in `/migrations` directory
- **Connection**: Uses Neon Database serverless connection

## Key Components

### Authentication System
- JWT-based authentication with token storage in localStorage
- Role-based access control (admin, auditor, supervisor, viewer)
- Password hashing using bcrypt
- Protected routes with authentication middleware

### Audit Management
- Complete audit lifecycle from scheduling to completion
- 5S methodology implementation with predefined questions for each S
- Checklist-based audit forms with photo upload capabilities
- Real-time progress tracking and scoring

### User Management
- Multi-role user system with team assignments
- Zone-based access control
- User profile management with team and zone associations

### Action Tracking
- Action item creation from audit findings
- Assignment and priority management
- Status tracking and completion monitoring
- Integration with audit results

### Scheduling System
- Recurring audit scheduling
- Calendar-based view of scheduled audits
- Automated reminders and notifications
- Team and zone-based scheduling

### Reporting System
- Dashboard with key metrics and KPIs
- Audit history and trend analysis
- Action item reporting
- Zone and team performance tracking

## Data Flow

1. **User Authentication**: Login → JWT token → Stored in localStorage → API requests include Bearer token
2. **Audit Creation**: Schedule audit → Generate checklist items → Conduct audit → Calculate scores → Generate actions
3. **Action Management**: Create from audit findings → Assign to users → Track progress → Mark complete
4. **Reporting**: Aggregate data from audits and actions → Display metrics and trends

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Uses `@neondatabase/serverless` driver
- **Environment**: Requires `DATABASE_URL` environment variable

### Authentication
- **JWT**: JSON Web Tokens for stateless authentication
- **bcrypt**: Password hashing and comparison
- **Sessions**: PostgreSQL-backed session storage using `connect-pg-simple`

### File Management
- **Multer**: File upload middleware for audit photos
- **File Storage**: Local file system storage (uploads directory)
- **Validation**: Image type validation (JPEG, PNG, GIF, WebP)

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching
- **Recharts**: Data visualization for reports
- **date-fns**: Date manipulation and formatting

## Deployment Strategy

### Development
- **Script**: `npm run dev` starts development server with hot reload
- **Server**: tsx for TypeScript execution
- **Client**: Vite dev server with HMR

### Production Build
- **Build Process**: Vite builds client assets, esbuild bundles server
- **Output**: Client assets in `dist/public`, server bundle in `dist/index.js`
- **Start**: `npm start` runs production server

### Environment Configuration
- **Database**: Requires `DATABASE_URL` for PostgreSQL connection
- **JWT**: Uses `JWT_SECRET` environment variable (defaults to hardcoded value)
- **File Uploads**: Configurable upload directory and file size limits

### Database Management
- **Migrations**: `npm run db:push` applies schema changes
- **Schema**: Shared TypeScript definitions with Zod validation
- **Seeding**: Manual user creation through registration endpoints

The application follows a monorepo structure with shared types and schemas, making it easy to maintain consistency between frontend and backend while providing a robust foundation for 5S audit management.