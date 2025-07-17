-- Add tags table
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6',
	"category" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Add tags column to checklist_items table
ALTER TABLE "checklist_items" ADD COLUMN "tags" text[] DEFAULT '{}';
--> statement-breakpoint

-- Add tags column to actions table
ALTER TABLE "actions" ADD COLUMN "tags" text[] DEFAULT '{}';
--> statement-breakpoint

-- Insert default tags
INSERT INTO "tags" ("name", "description", "color", "category", "is_active") VALUES 
('Safety Risk', 'Issues that pose safety hazards', '#ef4444', 'safety', true),
('Missing Label', 'Items or areas without proper labeling', '#f97316', 'organization', true),
('Blocked Access', 'Pathways or equipment with obstructed access', '#eab308', 'accessibility', true),
('Equipment Issue', 'Machinery or equipment malfunction', '#8b5cf6', 'maintenance', true),
('Cleanliness', 'Areas requiring cleaning or maintenance', '#06b6d4', 'cleanliness', true),
('Documentation', 'Missing or outdated documentation', '#10b981', 'quality', true);