/**
 * 티어리스트 생성물 점검 — `npx tsx scripts/check-tierlist.ts`.
 *
 * 테스트 러너가 없으므로 assert만 쓴다(check-backup.ts / check-build-storage.ts 와 같은 방식).
 *
 * fetch-tierlist.ts 는 비공식 API 두 곳을 조인해 굽는다. 조인 키가 조용히 어긋나면
 * (증강 id 체계 변경, 앱 데이터 갱신, 아이템 접두사 변화) 화면에는 "빈 그룹"이나
 * "이름 없는 행"으로만 나타나 눈치채기 어렵다. 그래서 생성물을 실제 앱 데이터에
 * 대고 다시 조인해 본다. 그룹핑 로직도 tiers.ts 를 그대로 import 해서 검증한다.
 */
import assert from 'node:assert/strict';

import type { Augment } from '@/features/augments/types';
import {
  TIERS,
  tierOf,
  tierRankOf,
  tierRows,
  tierSections,
  tierlistMeta,
} from '@/features/tierlist/tiers';

const champions = require('@/features/champions/data/champions.ko.json') as { key: string }[];
const augments = require('@/features/augments/data/augments.ko.json') as Augment[];
const itemsKo = require('@/features/tierlist/data/tierlist-items.ko.json') as { id: string }[];
const itemsEn = require('@/features/tierlist/data/tierlist-items.en.json') as { id: string }[];

/** fetch-tierlist.ts 의 MIN_GAMES 와 같은 값. 표본이 얇은 항목이 1위로 올라오는 걸 막는다. */
const MIN_GAMES = 200;
const COLUMNS = 2;

const championKeys = new Set(champions.map((c) => c.key));
const itemIds = new Set(itemsKo.map((i) => i.id));
const rarityOf = new Map(augments.map((a) => [a.id, a.rarity]));

assert.ok(tierlistMeta.patch, 'patch 비어 있음');
assert.ok(tierlistMeta.date, 'date 비어 있음');
assert.equal(itemsKo.length, itemsEn.length, 'ko/en 아이템 사전 길이 불일치');
assert.deepEqual(
  itemsKo.map((i) => i.id),
  itemsEn.map((i) => i.id),
  'ko/en 아이템 사전 id 순서 불일치',
);
// 사전에 안 쓰이는 아이템이 남으면 번들만 커진다(아레나를 걷어낼 때 실제로 남았다).
const referenced = new Set(tierRows().flatMap((r) => r.items.map((e) => e.id)));
assert.deepEqual(
  [...itemIds].sort(),
  [...referenced].sort(),
  '아이템 사전과 실제 참조가 어긋남',
);

const rows = tierRows();
assert.ok(rows.length >= 150, `챔피언 ${rows.length}명 — 너무 적다`);

const seen = new Set<string>();
for (const [i, row] of rows.entries()) {
  assert.ok(championKeys.has(row.key), `앱에 없는 챔피언 key ${row.key}`);
  assert.ok(!seen.has(row.key), `챔피언 중복 ${row.key}`);
  seen.add(row.key);

  assert.ok(row.score >= 0.2 && row.score <= 0.8, `${row.key}: 승률 ${row.score} 범위 밖`);
  assert.ok(row.sub >= 0 && row.sub <= 1, `${row.key}: 픽률 ${row.sub} 범위 밖`);
  if (i > 0) {
    assert.ok(row.score <= rows[i - 1].score, `정렬이 깨졌다 (${i}번째 ${row.score})`);
  }

  // 증강 — 조인 가능하고, 희귀도 3종이 모두 채워져야 한다.
  const rarities = new Set<string>();
  for (const e of row.augments) {
    const rarity = rarityOf.get(e.id);
    assert.ok(rarity, `${row.key}: 증강 풀에 없는 id ${e.id}`);
    assert.ok(e.games >= MIN_GAMES, `${row.key}: 증강 ${e.id} 표본 ${e.games}`);
    assert.ok(e.score >= 0.2 && e.score <= 0.8, `${row.key}: 증강 ${e.id} 승률 범위 밖`);
    rarities.add(rarity);
  }
  assert.equal(rarities.size, 3, `${row.key}: 희귀도 ${[...rarities]} — 3종이 아니다`);

  // 아이템 — 사전에 이름·아이콘이 있어야 화면에 그릴 수 있다.
  for (const e of row.items) {
    assert.ok(itemIds.has(e.id), `${row.key}: 아이템 사전에 없는 id ${e.id}`);
    assert.ok(e.games >= MIN_GAMES, `${row.key}: 아이템 ${e.id} 표본 ${e.games}`);
  }
}

// 그룹핑 — 버킷이 rows 를 빠짐없이 덮고 빈 티어가 없어야 한다.
const sections = tierSections();
assert.deepEqual(sections.map((s) => s.title), [...TIERS], '섹션 순서');
const flat = sections.flatMap((s) => s.data.flat());
assert.equal(flat.length, rows.length, `버킷 합 ${flat.length} ≠ ${rows.length}`);
assert.deepEqual(flat.map((r) => r.key), rows.map((r) => r.key), '버킷 순서가 어긋남');
for (const s of sections) {
  assert.ok(s.data.every((r) => r.length <= COLUMNS), `${s.title} 행이 ${COLUMNS}열을 넘는다`);
}

// tierOf / tierRankOf 가 섹션과 같은 답을 내야 한다.
for (const s of sections) {
  for (const row of s.data.flat()) {
    assert.equal(tierOf(row.key), s.title, `${row.key}: tierOf 불일치`);
  }
}
assert.deepEqual(tierRankOf(rows[0].key), { rank: 1, total: rows.length }, '1위 순위');

// 검색 필터 — 티어 배정은 그대로 두고 해당 챔피언만 남아야 한다.
const target = rows[0].key;
const filtered = tierSections((r) => r.key === target);
assert.equal(filtered.length, 1, '한 명만 남기면 섹션도 하나여야 한다');
assert.equal(filtered[0].title, tierOf(target), '검색해도 티어가 바뀌면 안 된다');
assert.deepEqual(filtered[0].data, [[rows[0]]], '검색 결과 격자');
assert.equal(tierSections(() => false).length, 0, '결과 0이면 섹션도 0');

console.log(
  `칼바람 ${rows.length}명 · ` + sections.map((s) => `${s.title} ${s.data.flat().length}`).join(' / '),
);
console.log(`아이템 사전 ${itemsKo.length}개 · 패치 ${tierlistMeta.patch} · ${tierlistMeta.date}`);
console.log('check-tierlist: 통과');
