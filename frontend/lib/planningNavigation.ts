import type { ReadonlyURLSearchParams } from "next/navigation";

export const PLANNING_INVOICE_DATA_KEY = "stacklyPlanningInvoiceData";

export type PlanningView = "plans" | "payment" | "invoice" | "history";

export type StoredPlanningInvoiceData = {
  invoiceId: string;
  date: string;
  planName: string;
  amount: string;
  name: string;
  email: string;
  contactNo: string;
  address: string;
};

export type PlanningUrlState = {
  view: PlanningView;
  planName: string | null;
  billingYearly: boolean;
  isFreeCheckout: boolean;
};

export type PlanningResolvedState = PlanningUrlState & {
  invoiceData: StoredPlanningInvoiceData | null;
};

function parsePlanningViewParam(viewParam: string | null): PlanningView {
  if (viewParam === "payment" || viewParam === "invoice" || viewParam === "history") {
    return viewParam;
  }
  return "plans";
}

function parsePlanningSearchParams(
  params: Pick<URLSearchParams, "get">,
): PlanningUrlState {
  return {
    view: parsePlanningViewParam(params.get("view")),
    planName: params.get("plan"),
    billingYearly: params.get("cycle") === "yearly",
    isFreeCheckout: params.get("free") === "1",
  };
}

export function parsePlanningUrlState(
  searchParams: ReadonlyURLSearchParams,
): PlanningUrlState {
  return parsePlanningSearchParams(searchParams);
}

export function resolvePlanningStateFromSearch(
  search: string,
  validPlanNames: readonly string[],
): PlanningResolvedState {
  const params = new URLSearchParams(search);
  const urlState = parsePlanningSearchParams(params);

  if (urlState.view === "payment") {
    if (!urlState.planName || !validPlanNames.includes(urlState.planName)) {
      return {
        view: "plans",
        planName: null,
        billingYearly: false,
        isFreeCheckout: false,
        invoiceData: null,
      };
    }
    return { ...urlState, invoiceData: null };
  }

  if (urlState.view === "invoice") {
    const invoiceData = loadPlanningInvoiceData();
    if (!invoiceData) {
      return {
        view: "plans",
        planName: null,
        billingYearly: false,
        isFreeCheckout: false,
        invoiceData: null,
      };
    }
    return { ...urlState, invoiceData };
  }

  if (urlState.view === "history") {
    return { ...urlState, invoiceData: null };
  }

  return {
    view: "plans",
    planName: null,
    billingYearly: false,
    isFreeCheckout: false,
    invoiceData: null,
  };
}

export function readPlanningLocationSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
}

export function buildPlanningQuery(params: {
  view: PlanningView;
  planName?: string;
  billingYearly?: boolean;
  isFreeCheckout?: boolean;
}): string {
  if (params.view === "plans") return "";

  const search = new URLSearchParams();
  search.set("view", params.view);
  if (params.planName) search.set("plan", params.planName);
  if (params.billingYearly) search.set("cycle", "yearly");
  if (params.isFreeCheckout) search.set("free", "1");
  return search.toString();
}

export function planningPathFromQuery(query: string): string {
  return query ? `/planning?${query}` : "/planning";
}

export function savePlanningInvoiceData(data: StoredPlanningInvoiceData): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PLANNING_INVOICE_DATA_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadPlanningInvoiceData(): StoredPlanningInvoiceData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PLANNING_INVOICE_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlanningInvoiceData;
    if (!parsed?.invoiceId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlanningInvoiceData(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PLANNING_INVOICE_DATA_KEY);
  } catch {
    /* ignore */
  }
}
