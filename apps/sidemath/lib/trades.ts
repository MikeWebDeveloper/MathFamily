/**
 * SideMath spoke dataset — UK side-hustle / self-employed TRADE TYPES.
 *
 * App-local. Each trade carries a *typical* gross-income and expenses profile so the
 * spoke page can show a worked, plausible estimate. These profiles are ILLUSTRATIVE
 * ranges for a part-time side hustle — they are NOT survey data and are clearly framed
 * as "a typical example" on-page, never as a benchmark or guarantee. The tax maths
 * applied to them is the same verified gov.uk maths used on the home calculator.
 */

export interface Trade {
  slug: string;
  name: string; // e.g. "Courier / delivery driver"
  shortName: string; // e.g. "courier"
  /** One-line description of who this is for. */
  blurb: string;
  /** Typical annual gross trading income for a part-time side hustle, in pence. */
  typicalGrossPence: number;
  /** Typical allowable expenses, in pence (fuel, materials, fees, etc.). */
  typicalExpensesPence: number;
  /** The main expense categories a person in this trade can usually claim. */
  commonExpenses: string[];
  /** A trade-specific note about the £1,000 trading allowance for this hustle. */
  allowanceNote: string;
}

export const TRADES: Trade[] = [
  {
    slug: "courier",
    name: "Courier & delivery driver",
    shortName: "courier",
    blurb: "Self-employed delivery driving for the likes of food and parcel apps, alongside another job.",
    typicalGrossPence: 1_800_000, // £18,000
    typicalExpensesPence: 600_000, // £6,000
    commonExpenses: [
      "Fuel and mileage (or actual running costs)",
      "Vehicle insurance and servicing",
      "Phone and data used for the app",
      "Insulated bags and equipment"
    ],
    allowanceNote:
      "Couriers usually have real fuel and vehicle costs above £1,000, so deducting actual expenses normally beats the £1,000 trading allowance."
  },
  {
    slug: "tutor",
    name: "Private tutor",
    shortName: "tutor",
    blurb: "Tutoring on the side — online or in person — on top of a teaching or other day job.",
    typicalGrossPence: 800_000, // £8,000
    typicalExpensesPence: 80_000, // £800
    commonExpenses: [
      "Tutoring platform or booking fees",
      "Teaching materials and subscriptions",
      "A share of home broadband and utilities",
      "DBS check and professional membership"
    ],
    allowanceNote:
      "Tutors often have low costs, so the £1,000 trading allowance can beat claiming actual expenses — compare both."
  },
  {
    slug: "etsy-seller",
    name: "Etsy & online seller",
    shortName: "Etsy seller",
    blurb: "Selling handmade or resold goods through Etsy, eBay, Vinted or your own shop.",
    typicalGrossPence: 1_200_000, // £12,000
    typicalExpensesPence: 500_000, // £5,000
    commonExpenses: [
      "Materials and stock",
      "Etsy / eBay listing and seller fees",
      "Postage and packaging",
      "Payment-processing fees"
    ],
    allowanceNote:
      "Makers and resellers usually buy materials or stock above £1,000, so actual expenses normally beat the trading allowance."
  },
  {
    slug: "cleaner",
    name: "Self-employed cleaner",
    shortName: "cleaner",
    blurb: "Domestic or office cleaning as a sole trader, often around other commitments.",
    typicalGrossPence: 1_400_000, // £14,000
    typicalExpensesPence: 200_000, // £2,000
    commonExpenses: [
      "Cleaning products and equipment",
      "Travel between jobs",
      "Public liability insurance",
      "Advertising and booking fees"
    ],
    allowanceNote:
      "If your products and travel come to more than £1,000 a year, claim actual expenses rather than the trading allowance."
  },
  {
    slug: "freelance-designer",
    name: "Freelance designer & creative",
    shortName: "freelance designer",
    blurb: "Design, illustration, photography or writing freelanced alongside employment.",
    typicalGrossPence: 1_500_000, // £15,000
    typicalExpensesPence: 250_000, // £2,500
    commonExpenses: [
      "Software subscriptions (Adobe, Figma, etc.)",
      "A share of home-office and broadband costs",
      "Hardware and equipment",
      "Portfolio site and marketplace fees"
    ],
    allowanceNote:
      "Software and equipment usually push a designer's costs over £1,000, so actual expenses tend to win — but check both."
  },
  {
    slug: "hairdresser",
    name: "Mobile hairdresser & beautician",
    shortName: "hairdresser",
    blurb: "Hair, nails or beauty done mobile or chair-rental, as a self-employed side income.",
    typicalGrossPence: 1_600_000, // £16,000
    typicalExpensesPence: 450_000, // £4,500
    commonExpenses: [
      "Products and consumables",
      "Chair rental or travel costs",
      "Tools and equipment",
      "Insurance and training"
    ],
    allowanceNote:
      "Product and chair-rental costs are normally well over £1,000, so claim actual expenses instead of the trading allowance."
  },
  {
    slug: "dog-walker",
    name: "Dog walker & pet sitter",
    shortName: "dog walker",
    blurb: "Dog walking, pet sitting or home boarding as a flexible self-employed sideline.",
    typicalGrossPence: 900_000, // £9,000
    typicalExpensesPence: 120_000, // £1,200
    commonExpenses: [
      "Travel to and from walks",
      "Leads, equipment and treats",
      "Public liability and pet insurance",
      "Booking-app or directory fees"
    ],
    allowanceNote:
      "If your travel and kit stay near or below £1,000, the £1,000 trading allowance may beat claiming actual expenses."
  },
  {
    slug: "handyman",
    name: "Handyman & odd-job trade",
    shortName: "handyman",
    blurb: "Repairs, assembly, gardening and odd jobs done as a self-employed sole trader.",
    typicalGrossPence: 1_700_000, // £17,000
    typicalExpensesPence: 550_000, // £5,500
    commonExpenses: [
      "Materials and consumables",
      "Tools and equipment",
      "Van fuel and running costs",
      "Public liability insurance"
    ],
    allowanceNote:
      "Materials, tools and van costs almost always exceed £1,000, so deducting actual expenses normally beats the trading allowance."
  }
];

export function getTrade(slug: string): Trade | null {
  return TRADES.find((t) => t.slug === slug) ?? null;
}
