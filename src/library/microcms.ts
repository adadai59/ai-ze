import { createClient, type MicroCMSQueries } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

// カテゴリAPI（コンテンツ参照先）の型定義
// ※「カテゴリ」APIの表示名フィールドのフィールドIDが `name` と異なる場合は
//   ここを実際のフィールドIDに合わせて変更してください
export type Category = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  name: string;
};

// コラム記事の型定義
// ※ 下記フィールドは microCMS の管理画面側で作成してください
//   title       : テキストフィールド（作成済み）
//   content     : リッチエディタ（作成済み）
//   eyecatch    : 画像フィールド（作成済み）
//   excerpt     : テキストフィールド（一覧カードの導入文）
//   category    : コンテンツ参照（参照先: カテゴリAPI／単一選択）
//   date        : 日付フィールド（記事の表示用の日付）
export type Column = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  content: string;
  excerpt: string;
  description?: string;
  category: Category | null;
  date: string; // ISO文字列（例: "2025-01-20T00:00:00.000Z"）
  eyecatch: {
    url: string;
    height: number;
    width: number;
  };
};

export type ColumnResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Column[];
};

// 一覧取得関数（ページング付き・1回分）
// depth: 2 を指定し、参照フィールド(category)の中身まで取得する
export const getColumns = async (queries?: MicroCMSQueries) => {
  return await client.get<ColumnResponse>({
    endpoint: "column",
    queries: { depth: 2, ...queries },
  });
};

// 詳細取得関数
export const getColumnDetail = async (
  contentId: string,
  queries?: MicroCMSQueries,
) => {
  return await client.get<Column>({
    endpoint: "column",
    contentId,
    queries: { depth: 2, ...queries },
  });
};

// 🌟 全件取得（静的サイト生成用）
// microCMSは1回のリクエストで最大100件までしか返らないため、
// getStaticPaths / 一覧ページで全件必要な場合はこちらを使う
export const getAllColumns = async (): Promise<Column[]> => {
  const limit = 100;
  let offset = 0;
  let all: Column[] = [];

  while (true) {
    const res = await getColumns({ limit, offset, orders: "-date" });
    all = all.concat(res.contents);
    offset += limit;
    if (offset >= res.totalCount) break;
  }

  return all;
};

// 🌟 本文HTML(content)からh2/h3見出しを抽出し、
//    ・id付きのHTML文字列
//    ・目次表示用の見出し配列
//   を同時に生成するユーティリティ
//   （Astroコンテンツコレクションの entry.render() が返していた
//    headings + Content の代わりとして使用する）
export type ColumnHeading = {
  depth: 2 | 3;
  slug: string;
  text: string;
};

export function extractHeadingsAndAddIds(html: string): {
  html: string;
  headings: ColumnHeading[];
} {
  const headings: ColumnHeading[] = [];
  const usedSlugs = new Set<string>();

  const toSlug = (text: string, index: number) => {
    // 日本語見出しでも一意なidになるよう、連番をベースにする
    const base = `heading-${index}`;
    let slug = base;
    let i = 1;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${i}`;
      i++;
    }
    usedSlugs.add(slug);
    return slug;
  };

  let index = 0;
  const withIds = html.replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g,
    (_match, level: string, attrs = "", inner: string) => {
      const depth = Number(level) as 2 | 3;
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const slug = toSlug(text, index);
      index++;
      headings.push({ depth, slug, text });

      const hasId = /\sid=/.test(attrs);
      const newAttrs = hasId ? attrs : `${attrs} id="${slug}"`;
      return `<h${level}${newAttrs}>${inner}</h${level}>`;
    },
  );

  return { html: withIds, headings };
}

// 🌟 日本時間(JST)基準で日付を扱うための共通ユーティリティ
// Cloudflare Workers上ではローカルタイムゾーンがUTCになるため、
// getFullYear() 等の代わりにこちらを必ず使う

function toJSTParts(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

// 表示用: "2026.01.20" 形式
export function formatJSTDate(date: Date): string {
  const { year, month, day } = toJSTParts(date);
  return `${year}.${month}.${day}`;
}

// アーカイブ用キー: "2026-01" 形式
export function toJSTYearMonth(date: Date): string {
  const { year, month } = toJSTParts(date);
  return `${year}-${month}`;
}

// アーカイブ表示ラベル用: "2026年1月" 形式
export function toJSTYearMonthLabel(date: Date): string {
  const { year, month } = toJSTParts(date);
  return `${year}年${Number(month)}月`;
}

// ============================================================
// 以下を既存の src/library/microcms.ts の末尾に追記してください。
// getColumns / getColumnDetail / getAllColumns と同じパターンで実装しています。
//
// 🌟 カテゴリはコラムと同じ「category」API（コンテンツ参照）を共有します。
//    news専用のカテゴリAPIは作らず、既存の Category 型をそのまま使い回します。
//    そのため microCMS管理画面 側でも、既存の「カテゴリ」APIに
//    「お知らせ」「休業案内」「料金改定」「セミナー案内」を追加してください
//    （コラム用カテゴリと同じリストに並ぶ形になります）。
// ============================================================

// お知らせ記事の型定義
// ※ 下記フィールドは microCMS の管理画面側で「news」APIとして作成してください
//   title        : テキストフィールド（必須）
//   date         : 日付フィールド（必須／新着順の並び替えに使用）
//   category     : コンテンツ参照（必須／参照先: 既存の「カテゴリ」API・単一選択）
//   content      : リッチエディタ（任意／あれば /news/[id] の詳細ページを自動生成）
//   externalLink : テキスト(URL)（任意／あれば詳細ページより優先してこちらへリンク）
export type NewsItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  date: string; // ISO文字列
  category: Category | null; // コラムと共有の「カテゴリ」APIを参照
  content?: string;
  externalLink?: string;
};

export type NewsResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: NewsItem[];
};

// 一覧取得関数（ページング付き・1回分）
// category はコンテンツ参照なので depth: 2 を指定し、参照先の中身まで取得する
export const getNewsList = async (queries?: MicroCMSQueries) => {
  return await client.get<NewsResponse>({
    endpoint: "news",
    queries: { depth: 2, ...queries },
  });
};

// 詳細取得関数
export const getNewsDetail = async (
  contentId: string,
  queries?: MicroCMSQueries,
) => {
  return await client.get<NewsItem>({
    endpoint: "news",
    contentId,
    queries: { depth: 2, ...queries },
  });
};

// 🌟 全件取得（静的サイト生成用）
// getAllColumns と同じく、100件を超える場合に備えてoffsetループで全件取得する
export const getAllNews = async (): Promise<NewsItem[]> => {
  const limit = 100;
  let offset = 0;
  let all: NewsItem[] = [];

  while (true) {
    const res = await getNewsList({ limit, offset, orders: "-date" });
    all = all.concat(res.contents);
    offset += limit;
    if (offset >= res.totalCount) break;
  }

  return all;
};
