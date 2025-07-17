// Authorized team members list - DO NOT MODIFY without approval
export const AUTHORIZED_TEAM_MEMBERS = [
  'Calvin', 'Jenn', 'Jennifer', 'Maz', 'Suzi', 'Aemey', 'Afiq', 'Poh Chin', 
  'Jack', 'Hema', 'May', 'Shukri', 'Chin', 'Alice', 'Azril', 'Lyn', 
  'Adel', 'Anne', 'Candy', 'Sherene', 'Joanne'
] as const;

// System-allowed users (includes authorized team members plus system accounts)
export const SYSTEM_ALLOWED_USERS = [
  ...AUTHORIZED_TEAM_MEMBERS,
  'admin', 
  'System Administrator'
] as const;

// Official team structure with proper assignments
export const TEAM_STRUCTURE = {
  'Galvanize': {
    leader: 'Azril',
    members: ['Azril', 'Afiq', 'Joanne'],
    assignedZones: ['Factory Zone 1', 'Main Door', 'Receptionist']
  },
  'Chrome': {
    leader: 'Calvin',
    members: ['Calvin', 'Jenn', 'Jennifer', 'Aemey'],
    assignedZones: ['Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area']
  },
  'Steel': {
    leader: 'Maz',
    members: ['Maz', 'Suzi', 'Poh Chin', 'Candy'],
    assignedZones: ['Common Area (Second Floor)', 'Account', 'Filing Room']
  },
  'Aluminum': {
    leader: 'Jack',
    members: ['Jack', 'Hema', 'May', 'Sherene'],
    assignedZones: ['Surau Area (In)', 'Surau Area (Out)', 'Admin']
  },
  'Copper': {
    leader: 'Shukri',
    members: ['Shukri', 'Chin', 'Alice'],
    assignedZones: ['Meeting Room (First Floor)', 'Pantry', 'Sales 1']
  },
  'Titanium': {
    leader: 'Lyn',
    members: ['Lyn', 'Adel', 'Anne'],
    assignedZones: ['Sales 2']
  }
} as const;

// Validation functions
export function isAuthorizedUser(name: string): boolean {
  return SYSTEM_ALLOWED_USERS.includes(name as any);
}

export function validateTeamMember(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required and must be a string' };
  }
  
  if (!isAuthorizedUser(name)) {
    return { 
      isValid: false, 
      error: `User "${name}" is not authorized. Only the following users are allowed: ${SYSTEM_ALLOWED_USERS.join(', ')}` 
    };
  }
  
  return { isValid: true };
}

export function getTeamByMember(memberName: string): string | null {
  for (const [teamName, teamData] of Object.entries(TEAM_STRUCTURE)) {
    if (teamData.members.includes(memberName as any)) {
      return teamName;
    }
  }
  return null;
}