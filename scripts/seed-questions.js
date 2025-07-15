import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { questions } from '../shared/schema.ts';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const sampleQuestions = [
  // Sort (Seiri) - Remove unnecessary items
  {
    category: 'sort',
    question: 'Are all unnecessary items removed from the work area?',
    description: 'Check for obsolete materials, broken tools, unused equipment, or personal items.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'sort',
    question: 'Are only necessary items kept in the designated area?',
    description: 'Verify that only items needed for current work are present.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'sort',
    question: 'Are damaged or defective items properly identified and disposed of?',
    description: 'Look for broken equipment, damaged materials, or items beyond repair.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Pantry', 'Filing Room', 'Admin']
  },
  {
    category: 'sort',
    question: 'Are expired or obsolete documents removed from the area?',
    description: 'Check for outdated procedures, expired certificates, or old notices.',
    isRequired: false,
    enabledZones: ['Filing Room', 'Admin', 'Account', 'Sales 1', 'Sales 2', 'Meeting Room (First Floor)', 'Meeting Room (Ground Floor)']
  },
  {
    category: 'sort',
    question: 'Are personal belongings stored in designated areas only?',
    description: 'Ensure personal items are not mixed with work materials.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },

  // Set in Order (Seiton) - Arrange necessary items
  {
    category: 'setInOrder',
    question: 'Are all tools and equipment stored in designated locations?',
    description: 'Check if each item has a specific place and is returned after use.',
    isRequired: true,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Pantry', 'Filing Room', 'Admin', 'Sales 1', 'Sales 2']
  },
  {
    category: 'setInOrder',
    question: 'Are storage areas clearly labeled and organized?',
    description: 'Verify that shelves, drawers, and storage units have clear labels.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'setInOrder',
    question: 'Are frequently used items easily accessible?',
    description: 'Ensure commonly used tools and materials are within easy reach.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Pantry', 'Filing Room', 'Admin', 'Sales 1', 'Sales 2', 'Receptionist']
  },
  {
    category: 'setInOrder',
    question: 'Are documents filed systematically and easy to retrieve?',
    description: 'Check filing systems, folder organization, and document accessibility.',
    isRequired: true,
    enabledZones: ['Filing Room', 'Admin', 'Account', 'Sales 1', 'Sales 2', 'Receptionist']
  },
  {
    category: 'setInOrder',
    question: 'Are visual management tools (signs, boards, charts) properly positioned?',
    description: 'Verify that information displays are visible and up-to-date.',
    isRequired: false,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Common Area (Second Floor)', 'Meeting Room (First Floor)', 'Sales 1', 'Sales 2']
  },

  // Shine (Seiso) - Clean and inspect
  {
    category: 'shine',
    question: 'Are all work surfaces clean and free from dust, dirt, and debris?',
    description: 'Check desks, tables, machines, and equipment surfaces.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'shine',
    question: 'Are floors clean, dry, and free from spills or hazards?',
    description: 'Inspect floor conditions for cleanliness and safety.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'shine',
    question: 'Are cleaning supplies available and properly stored?',
    description: 'Check availability and organization of cleaning materials.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Pantry', 'Surau Area (In)', 'Surau Area (Out)', 'Admin']
  },
  {
    category: 'shine',
    question: 'Are equipment and machines properly maintained and functioning?',
    description: 'Verify equipment cleanliness and operational status.',
    isRequired: true,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Pantry', 'Admin', 'Sales 1', 'Sales 2', 'Receptionist']
  },
  {
    category: 'shine',
    question: 'Are windows, lights, and display screens clean and clear?',
    description: 'Check visibility and cleanliness of all glass and display surfaces.',
    isRequired: false,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Admin', 'Meeting Room (First Floor)', 'Sales 1', 'Sales 2']
  },

  // Standardize (Seiketsu) - Maintain and improve
  {
    category: 'standardize',
    question: 'Are standard operating procedures clearly posted and followed?',
    description: 'Check if SOPs are visible and being implemented consistently.',
    isRequired: true,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Pantry', 'Admin', 'Sales 1', 'Sales 2', 'Receptionist', 'Filing Room']
  },
  {
    category: 'standardize',
    question: 'Are safety protocols and emergency procedures clearly displayed?',
    description: 'Verify safety information is posted and accessible.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Common Area (Second Floor)', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'standardize',
    question: 'Are work schedules and responsibilities clearly defined?',
    description: 'Check if roles and schedules are documented and visible.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Admin', 'Sales 1', 'Sales 2', 'Account', 'Filing Room']
  },
  {
    category: 'standardize',
    question: 'Are quality standards and specifications readily available?',
    description: 'Verify that quality requirements are documented and accessible.',
    isRequired: true,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Admin', 'Sales 1', 'Sales 2', 'Filing Room']
  },
  {
    category: 'standardize',
    question: 'Are improvement suggestions regularly collected and reviewed?',
    description: 'Check if there are systems for continuous improvement feedback.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Admin', 'Sales 1', 'Sales 2', 'Common Area (Second Floor)', 'Meeting Room (First Floor)', 'Meeting Room (Ground Floor)']
  },

  // Sustain (Shitsuke) - Maintain discipline
  {
    category: 'sustain',
    question: 'Are team members consistently following 5S practices?',
    description: 'Observe if staff maintain organization and cleanliness habits.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'sustain',
    question: 'Are 5S audits conducted regularly and documented?',
    description: 'Check if regular inspections are scheduled and recorded.',
    isRequired: true,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Admin', 'Sales 1', 'Sales 2', 'Filing Room', 'Account']
  },
  {
    category: 'sustain',
    question: 'Are corrective actions from previous audits implemented?',
    description: 'Verify that identified issues have been addressed.',
    isRequired: true,
    enabledZones: ['Main Door', 'Receptionist', 'Factory Zone 1', 'Factory Zone 2', 'Meeting Room (Ground Floor)', 'Shoes Area', 'Common Area (Second Floor)', 'Account', 'Filing Room', 'Surau Area (In)', 'Surau Area (Out)', 'Admin', 'Meeting Room (First Floor)', 'Pantry', 'Sales 1', 'Sales 2']
  },
  {
    category: 'sustain',
    question: 'Are employees trained on 5S principles and practices?',
    description: 'Check if staff understand and are trained in 5S methodology.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Admin', 'Sales 1', 'Sales 2', 'Common Area (Second Floor)', 'Meeting Room (First Floor)', 'Meeting Room (Ground Floor)']
  },
  {
    category: 'sustain',
    question: 'Are recognition and feedback systems in place for 5S compliance?',
    description: 'Verify that good 5S practices are acknowledged and rewarded.',
    isRequired: false,
    enabledZones: ['Factory Zone 1', 'Factory Zone 2', 'Admin', 'Sales 1', 'Sales 2', 'Common Area (Second Floor)', 'Receptionist']
  }
];

async function seedQuestions() {
  try {
    console.log('🌱 Seeding questions...');
    
    // Clear existing questions
    await db.delete(questions);
    console.log('✅ Cleared existing questions');
    
    // Insert new questions
    for (const question of sampleQuestions) {
      await db.insert(questions).values(question);
    }
    
    console.log(`✅ Successfully seeded ${sampleQuestions.length} questions`);
    console.log('📊 Questions by category:');
    
    const categories = ['sort', 'setInOrder', 'shine', 'standardize', 'sustain'];
    categories.forEach(cat => {
      const count = sampleQuestions.filter(q => q.category === cat).length;
      const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
      console.log(`   ${catLabel}: ${count} questions`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();