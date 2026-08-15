export const supportedCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "AED",
  "ETB",
  "JPY",
  "CHF",
  "CNY",
] as const;

export const incomeCategories = [
  "Salary",
  "Freelance",
  "Business",
  "Daily income",
  "Gift",
  "Refund",
  "Investment",
  "Other",
];

export const expenseCategories = [
  "Food",
  "Rent",
  "Transport",
  "Bills",
  "Subscriptions",
  "Health",
  "Education",
  "Shopping",
  "Entertainment",
  "Family",
  "Debt payment",
  "Other",
];

export const frequencies = [
  { value: "ONCE", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export type Frequency = (typeof frequencies)[number]["value"];