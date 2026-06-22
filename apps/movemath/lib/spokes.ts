/**
 * Spoke-page content model. MoveMath's spoke axis is BUYER TYPE × PRICE BAND.
 *
 * Each spoke is a real worked example: a representative price for a band, computed for a buyer
 * type, with a full cost-to-move breakdown. This keeps each page distinct (anti-thin-content):
 * the SDLT figure, total, and copy differ per slug because the inputs differ.
 */

import { formatPence } from "@mathfamily/engine";
import { calculateMoveCost, type MoveCostResult } from "./cost";
import { BUYER_TYPE_LABELS, type BuyerType } from "./sdlt";

export interface Spoke {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heading: string;
  buyerType: BuyerType;
  /** Representative purchase price for the worked example, in pence. */
  pricePence: number;
  priceBandLabel: string;
  removalsKey: string;
  surveyKey: string;
  isSelling: boolean;
  includeMortgageFee: boolean;
  intro: string;
}

/** The 8 MVP spokes: buyer type crossed with price band. */
export const SPOKES: Spoke[] = [
  {
    slug: "first-time-buyer-250k",
    buyerType: "first-time-buyer",
    pricePence: 250_000_00,
    priceBandLabel: "£250,000",
    removalsKey: "removals-1-2-bed",
    surveyKey: "survey-level-2",
    isSelling: false,
    includeMortgageFee: true,
    title: "Cost of moving for a first-time buyer at £250,000",
    metaTitle: "First-time buyer moving costs at £250,000 — stamp duty + fees | MoveMath",
    metaDescription:
      "What does it cost a first-time buyer to move into a £250,000 home in England? Stamp duty (with first-time-buyer relief), removals, conveyancing and survey, itemised.",
    heading: "First-time buyer: the cost of moving into a £250,000 home",
    intro:
      "First-time buyers pay no Stamp Duty up to £300,000, so on a £250,000 home the SDLT is £0. The real cost of moving is everything else — removals, your solicitor and a survey."
  },
  {
    slug: "first-time-buyer-450k",
    buyerType: "first-time-buyer",
    pricePence: 450_000_00,
    priceBandLabel: "£450,000",
    removalsKey: "removals-3-bed",
    surveyKey: "survey-level-2",
    isSelling: false,
    includeMortgageFee: true,
    title: "Cost of moving for a first-time buyer at £450,000",
    metaTitle: "First-time buyer moving costs at £450,000 — stamp duty + fees | MoveMath",
    metaDescription:
      "A first-time buyer at £450,000 still gets relief but pays 5% on the slice above £300,000. See the stamp duty plus removals, conveyancing and survey, itemised.",
    heading: "First-time buyer: the cost of moving into a £450,000 home",
    intro:
      "First-time-buyer relief still applies at £450,000: 0% to £300,000, then 5% on the £150,000 above it. That's where the Stamp Duty on this purchase comes from."
  },
  {
    slug: "home-mover-350k",
    buyerType: "home-mover",
    pricePence: 350_000_00,
    priceBandLabel: "£350,000",
    removalsKey: "removals-3-bed",
    surveyKey: "survey-level-2",
    isSelling: true,
    includeMortgageFee: true,
    title: "Cost of moving home at £350,000 (mover, also selling)",
    metaTitle: "Home mover costs at £350,000 — stamp duty, agent & legal fees | MoveMath",
    metaDescription:
      "Moving up to a £350,000 home and selling your current one? See standard stamp duty plus estate agent fee, both sets of legal fees, removals and a survey.",
    heading: "Home mover: the cost of moving to a £350,000 home (and selling)",
    intro:
      "A home mover pays standard Stamp Duty on the new home. Because you're also selling, your move adds an estate agent fee, a second set of legal fees and an EPC."
  },
  {
    slug: "home-mover-600k",
    buyerType: "home-mover",
    pricePence: 600_000_00,
    priceBandLabel: "£600,000",
    removalsKey: "removals-4-bed",
    surveyKey: "survey-level-3",
    isSelling: true,
    includeMortgageFee: true,
    title: "Cost of moving home at £600,000 (mover, also selling)",
    metaTitle: "Home mover costs at £600,000 — stamp duty, agent & legal fees | MoveMath",
    metaDescription:
      "Moving to a £600,000 home and selling your current one? Standard stamp duty plus estate agent fee, both legal fees, removals and a Level 3 survey, itemised.",
    heading: "Home mover: the cost of moving to a £600,000 home (and selling)",
    intro:
      "At £600,000 the standard Stamp Duty bands reach 5%, and a larger or older home often justifies a Level 3 building survey. Selling adds the agent fee and second legal bill."
  },
  {
    slug: "additional-property-250k",
    buyerType: "additional-property",
    pricePence: 250_000_00,
    priceBandLabel: "£250,000",
    removalsKey: "removals-1-2-bed",
    surveyKey: "survey-level-2",
    isSelling: false,
    includeMortgageFee: true,
    title: "Cost of buying a £250,000 second property",
    metaTitle: "Second-home / buy-to-let costs at £250,000 — 5% SDLT surcharge | MoveMath",
    metaDescription:
      "Buying a £250,000 additional property? The 5% second-home surcharge applies to every slice — including the nil-rate band. See the full cost, itemised.",
    heading: "Additional property: the cost of buying a £250,000 second home",
    intro:
      "An additional property over £40,000 carries a 5% Stamp Duty surcharge on every band — including the part that would normally be 0%. That makes the SDLT the biggest single line."
  },
  {
    slug: "additional-property-450k",
    buyerType: "additional-property",
    pricePence: 450_000_00,
    priceBandLabel: "£450,000",
    removalsKey: "removals-3-bed",
    surveyKey: "survey-level-2",
    isSelling: false,
    includeMortgageFee: true,
    title: "Cost of buying a £450,000 second property",
    metaTitle: "Second-home / buy-to-let costs at £450,000 — 5% SDLT surcharge | MoveMath",
    metaDescription:
      "Buying a £450,000 additional property? The 5% surcharge stacks on top of every standard band. See the stamp duty plus removals, conveyancing and survey.",
    heading: "Additional property: the cost of buying a £450,000 second home",
    intro:
      "At £450,000 the second-home surcharge adds 5% across all bands on top of the standard rates, so the Stamp Duty bill is materially higher than for a main home at the same price."
  },
  {
    slug: "home-mover-925k",
    buyerType: "home-mover",
    pricePence: 925_000_00,
    priceBandLabel: "£925,000",
    removalsKey: "removals-4-bed",
    surveyKey: "survey-level-3",
    isSelling: true,
    includeMortgageFee: true,
    title: "Cost of moving home at £925,000 (top of the 5% band)",
    metaTitle: "Home mover costs at £925,000 — stamp duty at the band edge | MoveMath",
    metaDescription:
      "£925,000 sits at the top of the 5% Stamp Duty band before 10% begins. See the standard SDLT plus agent, legal, removals and survey costs for a move at this price.",
    heading: "Home mover: the cost of moving to a £925,000 home",
    intro:
      "£925,000 is the exact point where the standard Stamp Duty band steps from 5% up to 10%. This worked example shows the SDLT at that edge plus every other moving cost."
  },
  {
    slug: "first-time-buyer-550k",
    buyerType: "first-time-buyer",
    pricePence: 550_000_00,
    priceBandLabel: "£550,000",
    removalsKey: "removals-3-bed",
    surveyKey: "survey-level-2",
    isSelling: false,
    includeMortgageFee: true,
    title: "First-time buyer at £550,000 — when relief disappears",
    metaTitle: "First-time buyer at £550,000 — no relief above £500k | MoveMath",
    metaDescription:
      "Buy above £500,000 and first-time-buyer Stamp Duty relief is lost entirely — standard rates apply to the whole price. See what that means at £550,000.",
    heading: "First-time buyer at £550,000: where the relief cliff bites",
    intro:
      "First-time-buyer relief vanishes the moment the price tops £500,000 — standard Stamp Duty then applies to the whole price, not just the slice above. This example shows that cliff."
  }
];

export interface SpokeModel extends Spoke {
  cost: MoveCostResult;
  buyerLabel: string;
  sdltFormatted: string;
  totalFormatted: string;
}

export function buildSpokeModel(spoke: Spoke): SpokeModel {
  const cost = calculateMoveCost({
    pricePence: spoke.pricePence,
    buyerType: spoke.buyerType,
    removalsKey: spoke.removalsKey,
    surveyKey: spoke.surveyKey,
    isSelling: spoke.isSelling,
    includeMortgageFee: spoke.includeMortgageFee
  });
  return {
    ...spoke,
    cost,
    buyerLabel: BUYER_TYPE_LABELS[spoke.buyerType],
    sdltFormatted: formatPence(cost.sdlt.totalTaxPence),
    totalFormatted: formatPence(cost.totalPence)
  };
}

export function buildSpokeFaqs(model: SpokeModel): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    {
      question: `How much Stamp Duty does a ${model.buyerLabel.toLowerCase()} pay on a ${model.priceBandLabel} home?`,
      answer: `On a ${model.priceBandLabel} purchase as a ${model.buyerLabel.toLowerCase()}, the estimated Stamp Duty Land Tax (England & Northern Ireland) is ${model.sdltFormatted}. This is an estimate — confirm with gov.uk or a solicitor.`
    },
    {
      question: `What is the total cost of moving for this example?`,
      answer: `Adding Stamp Duty, removals, conveyancing, a survey${model.isSelling ? ", an estate agent fee and a second set of legal fees" : ""}, the estimated total cost to move is around ${model.totalFormatted}. Individual costs vary by provider and location.`
    },
    {
      question: `Does this apply in Scotland or Wales?`,
      answer: `No. These figures cover England and Northern Ireland, which use Stamp Duty Land Tax (SDLT). Scotland uses Land and Buildings Transaction Tax (LBTT) and Wales uses Land Transaction Tax (LTT), with different bands.`
    }
  ];

  if (model.buyerType === "first-time-buyer" && model.cost.sdlt.ftbReliefLost) {
    faqs.push({
      question: `Why doesn't first-time-buyer relief apply here?`,
      answer: `First-time-buyer Stamp Duty relief is only available on purchases of £500,000 or less. Above that, standard rates apply to the whole price, which is why the Stamp Duty on this ${model.priceBandLabel} example is higher.`
    });
  }

  if (model.buyerType === "additional-property") {
    faqs.push({
      question: `Why is the Stamp Duty so much higher on a second property?`,
      answer: `Additional residential properties over £40,000 carry a 5% surcharge on top of every standard band — including the part that would normally be charged at 0%. That surcharge is added to the figures shown here.`
    });
  }

  return faqs;
}
