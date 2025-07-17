// Authorized team members list - DO NOT MODIFY without approval
export const AUTHORIZED_TEAM_MEMBERS = [
  "Calvin",
  "Jenn",
  "Jennifer",
  "Maz",
  "Suzi",
  "Aemey",
  "Afiq",
  "Poh Chin",
  "Jack",
  "Hema",
  "May",
  "Shukri",
  "Chin",
  "Alice",
  "Azril",
  "Lyn",
  "Adel",
  "Anne",
  "Candy",
  "Sherene",
  "Joanne",
] as const;

// System-allowed users (includes authorized team members plus system accounts)
export const SYSTEM_ALLOWED_USERS: string[] = [
  ...AUTHORIZED_TEAM_MEMBERS,
  "admin",
  "System Administrator",
];

// Locked admin users - DO NOT MODIFY without approval
export const LOCKED_ADMINS = ['Azril', 'Shukri'] as const;

// Official team structure with proper assignments
export const TEAM_STRUCTURE = {
  Galvanize: {
    leader: "Azril",
    members: ["Azril", "Afiq", "Joanne"],
    assignedZones: ["Factory Zone 1", "Main Door", "Receptionist"],
  },
  Chrome: {
    leader: "Calvin",
    members: ["Calvin", "Jenn", "Jennifer", "Aemey"],
    assignedZones: [
      "Factory Zone 2",
      "Meeting Room (Ground Floor)",
      "Shoes Area",
    ],
  },
  Steel: {
    leader: "Maz",
    members: ["Maz", "Suzi", "Poh Chin", "Candy"],
    assignedZones: ["Common Area (Second Floor)", "Account", "Filing Room"],
  },
  Aluminum: {
    leader: "Jack",
    members: ["Jack", "Hema", "May", "Sherene"],
    assignedZones: ["Surau Area (In)", "Surau Area (Out)", "Admin"],
  },
  Copper: {
    leader: "Shukri",
    members: ["Shukri", "Chin", "Alice"],
    assignedZones: ["Meeting Room (First Floor)", "Pantry", "Sales 1"],
  },
  Titanium: {
    leader: "Lyn",
    members: ["Lyn", "Adel", "Anne"],
    assignedZones: ["Sales 2"],
  },
} as const;

// Validation functions
export function isAuthorizedUser(name: string): boolean {
  return SYSTEM_ALLOWED_USERS.includes(name);
}

export function validateTeamMember(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Name is required and must be a string" };
  }

  if (!isAuthorizedUser(name)) {
    return {
      isValid: false,
      error: `User "${name}" is not authorized. Only the following users are allowed: ${SYSTEM_ALLOWED_USERS.join(", ")}`,
    };
  }

  return { isValid: true };
}

export function getTeamByMember(memberName: string): string | null {
  // Check each team directly
  if (TEAM_STRUCTURE.Galvanize.members.includes(memberName as any)) return "Galvanize";
  if (TEAM_STRUCTURE.Chrome.members.includes(memberName as any)) return "Chrome";
  if (TEAM_STRUCTURE.Steel.members.includes(memberName as any)) return "Steel";
  if (TEAM_STRUCTURE.Aluminum.members.includes(memberName as any)) return "Aluminum";
  if (TEAM_STRUCTURE.Copper.members.includes(memberName as any)) return "Copper";
  if (TEAM_STRUCTURE.Titanium.members.includes(memberName as any)) return "Titanium";
  return null;
}

// Get role by name - static role assignment for specific users
export function getRoleByName(name: string): 'admin' | 'user' {
  if (LOCKED_ADMINS.includes(name as any)) {
    return 'admin';
  }
  return 'user';
}
