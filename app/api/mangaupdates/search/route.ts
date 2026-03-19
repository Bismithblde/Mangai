import { NextResponse } from "next/server";

const MANGAUPDATES_ROOT = "https://api.mangaupdates.com/v1";
const SEARCH_URL = `${MANGAUPDATES_ROOT}/series/search`;

const STYPE_VALUES = ["title", "description"] as const;
const LICENSED_VALUES = ["yes", "no"] as const;
const FILTER_VALUES = [
  "scanlated",
  "completed",
  "oneshots",
  "no_oneshots",
  "some_releases",
  "no_releases",
] as const;
const ORDERBY_VALUES = [
  "score",
  "title",
  "rank",
  "rating",
  "year",
  "date_added",
  "week_pos",
  "month1_pos",
  "month3_pos",
  "month6_pos",
  "year_pos",
  "list_reading",
  "list_wish",
  "list_complete",
  "list_unfinished",
] as const;

type Stype = (typeof STYPE_VALUES)[number];
type Licensed = (typeof LICENSED_VALUES)[number];
type SearchFilter = (typeof FILTER_VALUES)[number];
type OrderBy = (typeof ORDERBY_VALUES)[number];

type MangaUpdatesSeriesSearchBody = {
  search: string;
  added_by?: number;
  stype?: Stype;
  licensed?: Licensed;
  type?: string[];
  year?: string;
  filter_types?: string[];
  category?: string[];
  pubname?: string;
  filter?: SearchFilter;
  filters?: SearchFilter[];
  list?: string;
  page?: number;
  perpage?: number;
  letter?: string;
  genre?: string[];
  exclude_genre?: string[];
  orderby?: OrderBy;
  pending?: boolean;
  include_rank_metadata?: boolean;
  exclude_filtered_genres?: boolean;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isEnumValue<T extends readonly string[]>(
  allowed: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function validatePayload(
  payload: unknown,
): { value: MangaUpdatesSeriesSearchBody } | { error: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.search !== "string" || body.search.trim().length === 0) {
    return { error: "`search` is required and must be a non-empty string." };
  }

  if (body.added_by !== undefined && !isNonNegativeInteger(body.added_by)) {
    return { error: "`added_by` must be a non-negative integer when provided." };
  }

  if (body.stype !== undefined && !isEnumValue(STYPE_VALUES, body.stype)) {
    return {
      error: `\`stype\` must be one of: ${STYPE_VALUES.join(", ")}.`,
    };
  }

  if (
    body.licensed !== undefined &&
    !isEnumValue(LICENSED_VALUES, body.licensed)
  ) {
    return {
      error: `\`licensed\` must be one of: ${LICENSED_VALUES.join(", ")}.`,
    };
  }

  if (body.filter !== undefined && !isEnumValue(FILTER_VALUES, body.filter)) {
    return {
      error: `\`filter\` must be one of: ${FILTER_VALUES.join(", ")}.`,
    };
  }

  if (body.filters !== undefined) {
    if (!Array.isArray(body.filters) || body.filters.length === 0) {
      return { error: "`filters` must be a non-empty array when provided." };
    }

    const hasInvalidFilter = body.filters.some(
      (item) => !isEnumValue(FILTER_VALUES, item),
    );

    if (hasInvalidFilter) {
      return {
        error: `Each value in \`filters\` must be one of: ${FILTER_VALUES.join(", ")}.`,
      };
    }
  }

  if (body.orderby !== undefined && !isEnumValue(ORDERBY_VALUES, body.orderby)) {
    return {
      error: `\`orderby\` must be one of: ${ORDERBY_VALUES.join(", ")}.`,
    };
  }

  if (body.page !== undefined && !isNonNegativeInteger(body.page)) {
    return { error: "`page` must be a non-negative integer when provided." };
  }

  if (body.perpage !== undefined && !isNonNegativeInteger(body.perpage)) {
    return { error: "`perpage` must be a non-negative integer when provided." };
  }

  const stringFields = ["year", "pubname", "list", "letter"] as const;
  for (const field of stringFields) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      return { error: `\`${field}\` must be a string when provided.` };
    }
  }

  const arrayStringFields = [
    "type",
    "filter_types",
    "category",
    "genre",
    "exclude_genre",
  ] as const;

  for (const field of arrayStringFields) {
    if (body[field] !== undefined && !isStringArray(body[field])) {
      return { error: `\`${field}\` must be an array of strings when provided.` };
    }
  }

  const booleanFields = [
    "pending",
    "include_rank_metadata",
    "exclude_filtered_genres",
  ] as const;

  for (const field of booleanFields) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") {
      return { error: `\`${field}\` must be a boolean when provided.` };
    }
  }

  const sanitized: MangaUpdatesSeriesSearchBody = {
    search: body.search.trim(),
    stype: body.stype === undefined ? "title" : body.stype,
  };

  const optionalFields: (keyof MangaUpdatesSeriesSearchBody)[] = [
    "added_by",
    "licensed",
    "type",
    "year",
    "filter_types",
    "category",
    "pubname",
    "filter",
    "filters",
    "list",
    "page",
    "perpage",
    "letter",
    "genre",
    "exclude_genre",
    "orderby",
    "pending",
    "include_rank_metadata",
    "exclude_filtered_genres",
  ];

  for (const field of optionalFields) {
    const value = body[field];
    if (value !== undefined) {
      (sanitized as Record<string, unknown>)[field] = value;
    }
  }

  return { value: sanitized };
}

export async function POST(request: Request) {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const validation = validatePayload(parsedBody);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.value),
      cache: "no-store",
    });

    const text = await upstreamResponse.text();
    let data: unknown;

    try {
      data = text.length ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach MangaUpdates API." },
      { status: 502 },
    );
  }
}
