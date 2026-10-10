const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAnalytics() {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsers = await prisma.user.count();
  const usersLast7d = await prisma.user.count({ where: { createdAt: { gte: last7Days } } });
  const usersLast30d = await prisma.user.count({ where: { createdAt: { gte: last30Days } } });

  const planDist = await prisma.user.groupBy({ by: ["plan"], _count: true });

  const subs = await prisma.subscription.findMany({
    where: { status: "active" },
    select: { plan: true, price: true },
  });

  const mrr = subs.reduce((sum, s) => sum + s.price, 0);
  const paidUsers = await prisma.user.count({ where: { plan: { in: ["pro", "business"] } } });
  const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(2) : 0;

  console.log("\n📊 ═══════ NOVA PULSE ANALYTICS ═══════");
  console.log(`\n👥 USERS:`);
  console.log(`   Total:      ${totalUsers}`);
  console.log(`   Last 7d:    ${usersLast7d}`);
  console.log(`   Last 30d:   ${usersLast30d}`);

  console.log(`\n💎 PLAN DISTRIBUTION:`);
  planDist.forEach((p) => console.log(`   ${p.plan.padEnd(10)}: ${p._count}`));

  console.log(`\n💰 REVENUE:`);
  console.log(`   MRR:        Rp ${mrr.toLocaleString("id-ID")}`);
  console.log(`   Active:     ${subs.length} subscriptions`);
  console.log(`   Conversion: ${conversionRate}%`);

  console.log(`\n🎯 PROGRESS KE 100 USER:`);
  console.log(`   ${usersLast30d}/100 (${((usersLast30d / 100) * 100).toFixed(1)}%)`);

  console.log("\n═══════════════════════════════════════\n");
}

getAnalytics().catch(console.error).finally(() => prisma.$disconnect());
