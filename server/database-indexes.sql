-- Database indexes for performance optimization
-- Run these queries to add indexes to frequently queried columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Audits table indexes
CREATE INDEX IF NOT EXISTS idx_audits_zone ON audits(zone);
CREATE INDEX IF NOT EXISTS idx_audits_auditor ON audits(auditor);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_scheduled_date ON audits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_audits_zone_status ON audits(zone, status);
CREATE INDEX IF NOT EXISTS idx_audits_auditor_status ON audits(auditor, status);

-- Actions table indexes
CREATE INDEX IF NOT EXISTS idx_actions_assigned_to ON actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_actions_zone ON actions(zone);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_priority ON actions(priority);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at);
CREATE INDEX IF NOT EXISTS idx_actions_assigned_to_status ON actions(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_actions_zone_status ON actions(zone, status);
CREATE INDEX IF NOT EXISTS idx_actions_status_due_date ON actions(status, due_date);

-- Checklist items table indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_audit_id ON checklist_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_items_response ON checklist_items(response);
CREATE INDEX IF NOT EXISTS idx_checklist_items_requires_action ON checklist_items(requires_action);

-- Schedules table indexes
CREATE INDEX IF NOT EXISTS idx_schedules_zone ON schedules(zone);
CREATE INDEX IF NOT EXISTS idx_schedules_assigned_to ON schedules(assigned_to);
CREATE INDEX IF NOT EXISTS idx_schedules_is_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_frequency ON schedules(frequency);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_is_read ON messages(recipient, is_read);

-- Teams table indexes
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader);

-- Zones table indexes
CREATE INDEX IF NOT EXISTS idx_zones_building_id ON zones(building_id);
CREATE INDEX IF NOT EXISTS idx_zones_floor_id ON zones(floor_id);
CREATE INDEX IF NOT EXISTS idx_zones_type ON zones(type);
CREATE INDEX IF NOT EXISTS idx_zones_is_active ON zones(is_active);
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);

-- Buildings table indexes
CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings(name);
CREATE INDEX IF NOT EXISTS idx_buildings_is_active ON buildings(is_active);

-- Floors table indexes
CREATE INDEX IF NOT EXISTS idx_floors_building_id ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_floors_level ON floors(level);
CREATE INDEX IF NOT EXISTS idx_floors_is_active ON floors(is_active);

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_is_required ON questions(is_required);

-- Notification rules table indexes
CREATE INDEX IF NOT EXISTS idx_notification_rules_trigger ON notification_rules(trigger);
CREATE INDEX IF NOT EXISTS idx_notification_rules_is_active ON notification_rules(is_active);

-- Tags table indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_is_active ON tags(is_active);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audits_zone_date_status ON audits(zone, scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_actions_assignee_priority_status ON actions(assigned_to, priority, status);
CREATE INDEX IF NOT EXISTS idx_actions_zone_due_date_status ON actions(zone, due_date, status);
CREATE INDEX IF NOT EXISTS idx_checklist_audit_category ON checklist_items(audit_id, category);
CREATE INDEX IF NOT EXISTS idx_schedules_active_next_run ON schedules(is_active, next_run);

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_actions_open_due_date ON actions(due_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_audits_scheduled_date ON audits(scheduled_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_users_active_team ON users(team) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_zones_active_type ON zones(type) WHERE is_active = true;