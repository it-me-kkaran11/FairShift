import { seedDatabase } from '../src/lib/db/seed.ts';

try {
  seedDatabase();
  console.log('Database successfully initialized with synthetic demo data.');
  process.exit(0);
} catch (error) {
  console.error('Failed to seed database:', error);
  process.exit(1);
}
