# Karisma 5S Audit System

## Overview

This is a full-stack web application for managing 5S workplace organization audits. The system provides a comprehensive solution for scheduling, conducting, and tracking 5S audits with features for user management, action tracking, and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.
Data Guidelines: Use realistic names from existing team members (Calvin, Shukri, May, Azril, Chin, Alice, Joanne, Afiq, Jenn, Jennifer, Suzi, Poh_Chin, Jack, Hema, Maz, Lyn, Adel, Anne) for all dummy data instead of placeholder names. This ensures consistency and realism before full deployment.

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

## Recent Changes (January 2025)

### Enhanced Navigation System
- **Date**: January 15, 2025
- **Change**: Expanded sidebar navigation with comprehensive 5S audit management functions
- **Details**: 
  - Organized navigation into 4 logical sections: Core Functions, Management, Learning & Development, and System
  - Added 11 new functional areas: Zones, Teams, Learn 5S, Trainings, Feedback, Analytics, KPI Tracking, Documentation, and Access Control
  - Implemented home button functionality in audit pages for easy navigation back to dashboard
  - Created placeholder pages with realistic content for all new navigation items
  - **Resolution**: Fixed sidebar visibility issue - sidebar was rendering but required debugging to ensure proper display
- **Impact**: Provides complete navigation structure for full-featured 5S audit management system with working sidebar navigation

### Database Integration & Role-Based Access Control
- **Date**: January 15, 2025
- **Change**: Added PostgreSQL database support and implemented role-based user system
- **Details**:
  - Migrated from MemStorage to DatabaseStorage using PostgreSQL with Neon Database
  - Added database schema with proper Drizzle ORM integration
  - Created 21 seeded user accounts with default password "karisma123"
  - Implemented role-based authentication system (admin/user roles)
  - Admin users can view all data and manage system settings
  - Regular users can only view their own assigned actions and perform audits
  - Updated sidebar navigation to show different options based on user role
  - Modified dashboard and actions pages to filter data based on user permissions
  - Added sample action items for testing role-based filtering
- **Impact**: Provides secure, role-based access control with persistent data storage and proper user management

### Super Admin System Implementation
- **Date**: January 15, 2025
- **Change**: Added comprehensive super admin functionality with user management system
- **Details**:
  - Created super admin accounts: calvin, shukri, may, and azril (all with password "karisma123")
  - All admin users can access System Administration section with:
    - User Management: Full CRUD operations for user accounts
    - System Logs: Real-time audit logging and security monitoring
    - Settings: System configuration options
    - Access Control: Role and permission management
  - Enhanced user management features:
    - Create new users with default password "karisma123"
    - Edit user details, roles, and team assignments
    - Activate/deactivate user accounts
    - Reset passwords to default "karisma123"
    - View user activity and audit trails
  - Added comprehensive audit logging system:
    - Login attempts and security events
    - User actions and system changes
    - Export logs to CSV format
    - Real-time monitoring dashboard
  - Enhanced API security with role-based endpoint protection
- **Impact**: Provides complete administrative control with security monitoring and user management capabilities

### Enhanced Super Admin Features & Team Management
- **Date**: January 15, 2025
- **Change**: Added GoAudit-inspired super admin capabilities and corrected team member data
- **Details**:
  - Added Question Editor for audit customization with CRUD operations
  - Added Action Tracker for enhanced corrective action management
  - Added Notification Rules for automated alerts and notifications
  - Created PostgreSQL schemas for questions and notification_rules tables
  - Implemented role-based API endpoints for all new features
  - Updated team member data with correct names:
    - Galvanize: Azril (leader), Joanne, Afiq
    - Chrome: Calvin (leader), Jenn, Jennifer
    - Steel: Maz (leader), Suzi, Poh_Chin
    - Aluminum: Jack (leader), Hema, May
    - Copper: Shukri (leader), Chin, Alice
    - Titanium: Lyn (leader), Adel, Anne
  - All features integrated with existing authentication and sidebar navigation
- **Impact**: Provides comprehensive audit customization, enhanced action management, and accurate team structure for improved 5S audit operations

### Audit System Enhancements & Cancel Functionality
- **Date**: January 15, 2025
- **Change**: Fixed audit creation errors and added comprehensive 5S questionnaire with user-friendly cancel functionality
- **Details**:
  - Fixed audit creation API to properly handle date conversion and auditor assignment
  - Added comprehensive 5S questionnaire with 25 questions (5 per category):
    - 1S (Sort): Remove unnecessary items - 5 questions
    - 2S (Set in Order): Organize remaining items - 5 questions
    - 3S (Shine): Clean and inspect - 5 questions
    - 4S (Standardize): Maintain and improve - 5 questions
    - 5S (Sustain): Maintain discipline - 5 questions
  - Enhanced timestamp handling in audit update operations
  - Added cancel button with confirmation dialog for audit sessions
  - Cancel functionality preserves progress as draft and resets audit to scheduled status
  - Improved error handling in API request client for better user experience
  - All questions include detailed descriptions and are enabled for all zones
- **Impact**: Provides reliable audit creation, structured 5S assessment, and flexible user experience allowing users to change plans without losing progress

### Interactive Messaging System Implementation
- **Date**: January 15, 2025
- **Change**: Converted messaging from full page to interactive popup modal accessible from anywhere in the application
- **Details**:
  - Created MessagesModal component with compact, responsive design
  - Added MessagesButton component with unread message count badge
  - Integrated messages button into sidebar footer next to user profile
  - Removed Messages page route in favor of modal popup approach
  - Modal includes inbox/sent tabs, compose form, and message detail view
  - Real-time unread count updates every 30 seconds
  - Streamlined UI with smaller form inputs and condensed message list
  - All messaging functionality (send, read, delete) maintained in popup format
- **Impact**: Provides seamless team communication without navigation disruption, making messaging more accessible and interactive throughout the application

### AI-Powered PDF Question Extraction System
- **Date**: January 15, 2025
- **Change**: Added AI-powered PDF question extraction functionality to the 5S Question Editor using DeepSeek API
- **Details**:
  - Integrated DeepSeek API for intelligent text analysis and question extraction
  - Added PDF upload functionality with file validation (PDF only, 10MB limit)
  - Created comprehensive PDF text extraction using pdf-parse library
  - Implemented AI prompt engineering specifically for 5S methodology questions
  - Added interactive question selection interface with checkboxes
  - Questions are automatically categorized and assigned to all zones by default
  - Extracted questions show preview of source text and total count
  - Admin-only feature with proper role-based access control
  - PDF files are automatically cleaned up after processing
  - Real-time processing feedback with loading states and error handling
- **Impact**: Dramatically reduces manual effort in creating audit questions by automatically extracting and formatting questions from existing 5S documentation, training materials, and industry standards

### System-Wide Notification System Implementation & Removal
- **Date**: January 15, 2025
- **Change**: Implemented comprehensive system-wide notification system with real-time alerts and toast notifications, then removed at user request
- **Details**:
  - Initially created NotificationSystem component with bell icon and unread count badge
  - Added NotificationToast component for real-time popup notifications
  - Implemented notification panel with scrollable list and action buttons
  - Added notification generation system for audit assignments, overdue actions, team updates, and system alerts
  - Integrated notification bell into sidebar navigation next to messages
  - Created notification trigger test panel on dashboard for demonstration
  - Added comprehensive notification types: audit_assigned, audit_overdue, action_assigned, action_overdue, team_update, system_update
  - Notifications include priority levels (high, medium, low) with color-coded badges
  - Real-time notification fetching every 30 seconds from API
  - Toast notifications with auto-dismiss after 8 seconds
  - Click-to-action functionality for navigating to relevant pages
  - Mark as read/unread functionality with visual indicators
  - Backend API endpoints for notification management
  - **REMOVED**: System-wide notification bell and test panel removed from sidebar and dashboard at user request
- **Impact**: Notification system fully developed and tested, then removed to clean up UI. Backend infrastructure remains available for future use

### UI Improvements & Super Admin Settings
- **Date**: January 15, 2025
- **Change**: Removed notification system from UI, replaced "+ New Audit" button with Quick Actions dropdown, and created comprehensive Super Admin Settings
- **Details**:
  - Removed notification bell from sidebar and header completely
  - Removed notification test panel from dashboard
  - Replaced "+ New Audit" button with "Quick Actions" dropdown menu containing:
    - New Audit, Schedule Audit, Manage Teams, View Analytics
  - Created comprehensive Super Admin Settings page with 6 main tabs:
    - System: Configuration, backups, session timeouts, file limits, API rate limiting
    - Security: HTTPS enforcement, CORS, password policies, 2FA, audit logging
    - Notifications: System alerts, communication channels (email, SMS, Slack, Teams)
    - Integrations: LDAP, SSO, API keys, webhooks, AI services (DeepSeek)
    - Monitoring: System status, performance metrics, active users, resource usage
    - Maintenance: Database management, system actions, health checks
  - Fixed admin access to settings page (no more "Access Denied" for azril)
  - Added modern super admin features following latest enterprise trends
  - Fixed database notification generation errors
- **Impact**: Cleaner UI without notification clutter, improved admin experience with comprehensive system management capabilities, and enhanced Quick Actions menu for better workflow

### Deployment Issues Resolution
- **Date**: July 16, 2025
- **Change**: Fixed TypeScript compilation errors and deployment issues
- **Details**:
  - Installed missing type declarations: @types/react-csv, @types/pdf-parse, @types/papaparse, @types/bcrypt
  - Resolved database schema inconsistencies in server/storage.ts
  - Fixed duplicate function implementations and property mismatches
  - Enhanced TypeScript configuration with Set iteration support and additional compiler options
  - Corrected API response type definitions and field name mappings
  - Application now runs successfully on http://localhost:5000 with all endpoints functional
- **Impact**: Deployment-ready application with resolved TypeScript compilation errors, ensuring production readiness

### Hierarchical Zone Management & Realistic Data Implementation
- **Date**: January 15, 2025
- **Change**: Implemented hierarchical zone management with building > floor > zone structure and updated all dummy data to use realistic team member names
- **Details**:
  - Created PostgreSQL database tables for buildings and floors with proper foreign key relationships
  - Added buildings: "Karisma Main Factory", "Karisma Office Complex", "Karisma Warehouse"
  - Added floors: Ground Floor, First Floor, Second Floor, Mezzanine with realistic descriptions
  - Updated zones with Karisma-specific names: "Production Line A/B", "Reception & Customer Service", "Sales & Marketing Office", etc.
  - Created comprehensive API endpoints for building and floor management (GET, POST, PUT, DELETE)
  - Enhanced zones page with three view modes: Hierarchy View, Buildings, and All Zones
  - Fixed database schema inconsistency with floors table (order vs level column)
  - Updated storage layer with building and floor methods supporting hierarchical queries
  - Replaced all dummy names in feedback system with real team member names (Chin, Calvin, May)
  - Updated user preference guidelines to always use existing team member names for dummy data
- **Impact**: Provides complete organizational structure for zone management with realistic data that matches actual team composition, making the system ready for production deployment

### Official Zone List Update per 5S Planning Document
- **Date**: January 15, 2025
- **Change**: Updated zones to match official 5S planning document locations
- **Details**:
  - Replaced existing zones with 16 official audit locations from planning document
  - Office zones (14): Main Door, Receptionist, Shoes Area, Meeting Room (Ground Floor), Surau Area (In/Out), Meeting Room (First Floor), Pantry, Sales 1, Sales 2, Common Area (Second Floor), Account, Filing Room, Admin
  - Factory zones (2): Factory Zone 1, Factory Zone 2
  - Updated database records and frontend constants to sync across all components
  - Zones properly mapped to correct buildings and floors in hierarchical structure
  - All audit creation dropdowns, dashboard summaries, and admin panels now use official zone list
- **Impact**: Ensures audit system uses officially approved zone locations, maintaining consistency with organizational 5S planning standards

### Complete Zone-to-Team Assignment System
- **Date**: January 15, 2025
- **Change**: Implemented comprehensive zone-to-team assignments ensuring full coverage of all 16 zones
- **Details**:
  - Preserved Galvanize team (Azril, Afiq, Joanne) as requested - assigned Factory Zone 1, Main Door, Receptionist
  - Distributed all 16 zones across 6 teams with balanced workloads:
    - **Galvanize** (3 zones): Factory Zone 1, Main Door, Receptionist
    - **Chrome** (3 zones): Factory Zone 2, Meeting Room (Ground Floor), Shoes Area
    - **Steel** (3 zones): Common Area (Second Floor), Account, Filing Room
    - **Aluminum** (3 zones): Surau Area (In), Surau Area (Out), Admin
    - **Copper** (3 zones): Meeting Room (First Floor), Pantry, Sales 1
    - **Titanium** (1 zone): Sales 2
  - Added unassigned users to appropriate teams: Aemey→Chrome, Candy→Steel, Sherene→Aluminum
  - Updated both teams and users tables with synchronized zone assignments
  - Refreshed frontend constants to reflect actual team structure
- **Impact**: Provides complete zone coverage with clear team responsibility, enabling accurate audit assignments, dashboard metrics, and reporting throughout the system

### GoAudit-Inspired Stage 4 Enhancements
- **Date**: January 15, 2025  
- **Change**: Enhanced reporting and action tracking with GoAudit-inspired functionality for improved export capabilities and bulk operations
- **Details**:
  - **Reports Page Enhancements**:
    - Added CSV export functionality using react-csv with comprehensive audit data fields
    - Implemented PDF export with jsPDF and autoTable for professional report generation
    - Enhanced data filtering that applies to export operations (period, zone, status filters)
    - Added export buttons with proper metadata including generation date and applied filters
  - **Action Tracker Enhancements**:
    - Added "Show unresolved only" toggle switch for filtering non-completed actions
    - Implemented bulk update functionality for admin users with multi-select checkboxes
    - Added CSV/PDF export capabilities for action data with full field coverage
    - Enhanced filtering system with real-time search, status, priority, and zone filters
    - Created bulk actions modal for updating multiple actions simultaneously (assignee, status, priority, due date)
  - **Backend Improvements**:
    - Added `/api/actions/bulk` endpoint for bulk update operations with role-based access control
    - Enhanced error handling and validation for bulk operations
    - Implemented proper authentication token handling for all action updates
  - **Shared Types System**:
    - Created comprehensive type definitions for ActionItem, AuditReport, User, Zone interfaces
    - Added BulkUpdateRequest and ExportOptions types for better type safety
  - **UI/UX Improvements**:
    - Professional export buttons with appropriate icons (FileText, FileSpreadsheet)
    - Bulk action selection with select-all functionality
    - Enhanced modal systems for both individual and bulk action editing
    - Real-time feedback with toast notifications for all operations
- **Impact**: Provides enterprise-level action tracking and reporting capabilities with comprehensive export options, bulk operations, and professional PDF/CSV generation matching GoAudit standards