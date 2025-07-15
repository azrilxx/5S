export const FIVE_S_CATEGORIES = {
  '1S': 'Sort',
  '2S': 'Set in Order',
  '3S': 'Shine',
  '4S': 'Standardize',
  '5S': 'Sustain'
};

export const FIVE_S_QUESTIONS = {
  '1S': [
    'Only required materials, WIP, and stock are present in the work area',
    'Only required tools and equipment are present',
    'Only necessary paperwork (e.g., signage) is present',
    'Only required items (furniture, rails) are in place',
    'All required items are unobstructed and accessible'
  ],
  '2S': [
    'Locations for materials, WIP, stock, scrap are visible and accessible',
    'Locations for equipment/tools (incl. bins, spill kits) are clearly marked',
    'Paperwork storage is labeled and visible',
    'Areas for personal belongings are defined',
    'Walkways and work area boundaries are clearly marked',
    'Items follow proper color-coding standards (paint/markings not faded)'
  ],
  '3S': [
    'Cleaning procedures and time allocations are defined and communicated',
    'Machines (fans, extractors) are free of dust/oil leaks',
    'Tools are cleaned after use',
    'Paperwork and work surfaces are clean and damage-free',
    'Personal item areas are clean and damage-free',
    'Walls, stairs, walkways are clean, uncluttered, and undamaged',
    'Hard-to-reach areas are cleaned per schedule'
  ],
  '4S': [
    'Material/WIP/scrap storage locations are standardized and known',
    'Equipment operation/cleaning SOPs are standardized and visible',
    'Tools are stored properly, undamaged, and not modified',
    'Paperwork and 6S boards are clearly labeled',
    'Personal belonging areas are labeled and standardized'
  ],
  '5S': [
    'All materials/WIP/stock are stored correctly and checked regularly',
    'Equipment is operated and cleaned as per SOPs and audited regularly',
    'Tools and labels are maintained and reviewed periodically',
    'Audit results are visible and shared with both floor and management',
    'Recognition is given to teams practicing 5S',
    'Cleaning routines comply with the schedule and allocated time'
  ]
};

export const ZONES = [
  "Main Door",
  "Receptionist",
  "Shoes Area", 
  "Meeting Room (Ground Floor)",
  "Surau Area (In)",
  "Surau Area (Out)",
  "Factory Zone 1",
  "Factory Zone 2",
  "Meeting Room (First Floor)",
  "Pantry",
  "Sales 1",
  "Sales 2",
  "Common Area (Second Floor)",
  "Account",
  "Filing Room",
  "Admin"
];

export const TEAMS = [
  'Galvanize', 'Chrome', 'Steel', 'Aluminum', 'Copper', 'Titanium'
];

export const PRIORITIES = ['Low', 'Medium', 'High'];

export const AUDIT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DRAFT: 'draft'
};

export const ACTION_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  AUDITOR: 'auditor',
  SUPERVISOR: 'supervisor',
  VIEWER: 'viewer'
};
