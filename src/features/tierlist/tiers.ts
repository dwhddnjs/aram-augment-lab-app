/**
 * 티어리스트 데이터 접근 + S/A/B/C/D 그룹핑.
 *
 * tierlist.json 은 `scripts/fetch-data/fetch-tierlist.ts` 가 굽는다. 승률 내림차순으로
 * 이미 정렬된 채 들어오므로 여기서 절대 sort 하지 않는다.
 *
 * 칼바람 전용이다 — 아레나는 지표가 승률이 아니라 평균 등수(8인 2인팀)라 같은 표에
 * 섞을 수 없고, 클래식은 Riot 이 Mayhem 계열 match-v5 를 막아 둔 탓에 어느 집계
 * 사이트에도 데이터가 없다.
 *
 * 증강 희귀도는 담지 않는다. 호출측이 앱 증강 풀에서 조인한 레코드의 `.rarity` 를 쓴다.
 * React 훅 없음 — 순수 함수만.
 */
import data from '@/features/tierlist/data/tierlist.json';

export interface TierEntry {
  id: string;
  /** 승률(0~1). */
  score: number;
  games: number;
}

export interface TierRow {
  /** 앱 champions.json 의 `key`(숫자 문자열). */
  key: string;
  score: number;
  /** 픽률. */
  sub: number;
  augments: TierEntry[];
  items: TierEntry[];
}

export const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
export type Tier = (typeof TIERS)[number];

/**
 * ponytail: 고정 백분위 컷(누적 상한). 챔피언 수가 크게 흔들리면 D가 뭉치거나 빌 수
 * 있지만, 실측 171명에서 17/34/51/43/26 으로 균등하게 찬다. 절대 승률 구간
 * (53%/51.5%/…)은 D에 50명이 몰려서 탈락시켰다. 분포가 무너지면 여기 다섯 숫자만 만진다.
 */
const CUTS = [0.1, 0.3, 0.6, 0.85, 1];

const COLUMNS = 2;

export const tierlistMeta = { patch: data.patch, date: data.date };

export function tierRows(): TierRow[] {
  return data.aram as TierRow[];
}

export function findTierRow(key: string): TierRow | undefined {
  return tierRows().find((r) => r.key === key);
}

/** 챔피언 순위(1부터). 모달 헤더에서 "171명 중 3위"로 쓴다. */
export function tierRankOf(key: string): { rank: number; total: number } {
  const rows = tierRows();
  return { rank: rows.findIndex((r) => r.key === key) + 1, total: rows.length };
}

export function tierOf(key: string): Tier | null {
  const { rank, total } = tierRankOf(key);
  if (rank < 1) return null;
  return TIERS[CUTS.findIndex((c) => rank <= Math.round(total * c))] ?? 'D';
}

/**
 * SectionList 용 섹션. `data` 는 챔피언이 아니라 **행**(COLUMNS 개 묶음)이다 —
 * SectionList 에는 numColumns 가 없어서 격자를 직접 만든다.
 *
 * `match` 는 검색 필터. 티어 배정은 **거르기 전 전체 순위** 기준이라 검색해도 챔피언의
 * 티어가 바뀌지 않는다. 결과가 없는 티어는 헤더까지 통째로 빠진다.
 */
export function tierSections(
  match?: (row: TierRow) => boolean,
): { title: Tier; data: TierRow[][] }[] {
  const rows = tierRows();
  let prev = 0;
  return TIERS.map((title, i) => {
    const end = Math.round(rows.length * CUTS[i]);
    const slice = rows.slice(prev, end).filter((r) => !match || match(r));
    prev = end;
    const grid: TierRow[][] = [];
    for (let j = 0; j < slice.length; j += COLUMNS) grid.push(slice.slice(j, j + COLUMNS));
    return { title, data: grid };
  }).filter((s) => s.data.length > 0);
}
