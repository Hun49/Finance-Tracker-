import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const email = "demo@finance.app";
const password = "demopassword123";

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: { name: "Demo User", email, passwordHash, emailVerifiedAt: new Date() },
    update: {},
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      mainCurrency: "USD",
      startingBalance: 2500,
      incomeFrequency: "MONTHLY",
      expectedIncomeAmount: 3000,
      salaryDay: 25,
    },
    update: {},
  });

  const now = new Date();
  const hasIncome = (await prisma.income.count({ where: { userId: user.id } })) > 0;

  if (!hasIncome) {
    await prisma.income.createMany({
      data: [
        {
          userId: user.id,
          amount: 3000,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 3000,
          source: "Monthly salary",
          category: "Salary",
          date: new Date(now.getFullYear(), now.getMonth(), 25),
          frequency: "MONTHLY",
          isRecurring: true,
        },
        {
          userId: user.id,
          amount: 120,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 120,
          source: "Freelance",
          category: "Freelance",
          date: new Date(now.getFullYear(), now.getMonth(), 10),
          frequency: "ONCE",
          isRecurring: false,
        },
      ],
    });

    await prisma.expense.createMany({
      data: [
        {
          userId: user.id,
          amount: 800,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 800,
          category: "Rent",
          date: new Date(now.getFullYear(), now.getMonth(), 1),
          frequency: "MONTHLY",
          isRecurring: true,
        },
        {
          userId: user.id,
          amount: 260,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 260,
          category: "Food",
          date: new Date(now.getFullYear(), now.getMonth(), 12),
          frequency: "ONCE",
          isRecurring: false,
        },
        {
          userId: user.id,
          amount: 40,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 40,
          category: "Transport",
          date: new Date(now.getFullYear(), now.getMonth(), 8),
          frequency: "ONCE",
          isRecurring: false,
        },
      ],
    });

    await prisma.subscription.createMany({
      data: [
        {
          userId: user.id,
          name: "Netflix",
          amount: 10.99,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 10.99,
          billingCycle: "MONTHLY",
          nextPaymentDate: new Date(now.getFullYear(), now.getMonth() + 1, 3),
          category: "Subscriptions",
          status: "ACTIVE",
        },
        {
          userId: user.id,
          name: "Gym",
          amount: 25,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 25,
          billingCycle: "MONTHLY",
          nextPaymentDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
          category: "Subscriptions",
          status: "ACTIVE",
        },
      ],
    });

    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        personName: "Marcus",
        type: "THEY_OWE_ME",
        originalAmount: 500,
        currency: "USD",
        exchangeRate: 1,
        convertedOriginalAmount: 500,
        paidAmount: 150,
        remainingAmount: 350,
        deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        status: "PARTIALLY_PAID",
      },
    });

    await prisma.debtPayment.create({
      data: {
        debtId: debt.id,
        userId: user.id,
        amount: 150,
        currency: "USD",
        exchangeRate: 1,
        convertedAmount: 150,
        paymentDate: new Date(now.getFullYear(), now.getMonth(), 14),
        direction: "PAID_TO_ME",
      },
    });
  }

  console.log(`Demo account ready.
Email:    ${email}
Password: ${password}
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());