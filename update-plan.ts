import { prisma } from './lib/prisma';

async function main() {
  const userId = '899d5547-7992-49ae-ad96-2898df857e93';
  
  const updated = await prisma.userProfile.update({
    where: { userId },
    data: { 
      userPlan: 'PRO', 
      planStartedAt: new Date(),
      dailyAiCount: 0,
      dailyReadingCount: 0,
      lastAiReset: new Date(),
      lastReadingReset: new Date()
    },
    select: { userId: true, userPlan: true, planStartedAt: true }
  });
  
  console.log('User upgraded successfully:');
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch(e => {
    console.error("Error updating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    // just exit process instead of explicit disconnect
    process.exit(0);
  });
