/**
 * 칼바람 챔피언 티어리스트 데이터를 굽는다 → src/features/tierlist/data/
 *   - tierlist.json                생성물. 로케일 무관(숫자 id + 숫자 값), 승률 내림차순 정렬 완료
 *   - tierlist-items.{ko,en}.json  참조된 아이템의 이름·아이콘 사전
 *
 * 소스 2개:
 *   - data.dtodo.cn (aram.gg)      챔피언 승률 + 챔피언별 증강 승률 + 아이템
 *   - CommunityDragon              숫자 id ↔ 앱 슬러그 매핑, 아이템 이름/아이콘
 *
 * dtodo 는 비공식 내부 API다. 문서·SLA 없고 예고 없이 바뀐다. 그래서 런타임이 아니라
 * 빌드타임에만 때리고, 하단 sanity 가드로 반쯤 죽은 응답이 좋은 JSON을 덮어쓰는 걸 막는다.
 *
 * Run: npx tsx scripts/fetch-data/fetch-tierlist.ts        (전량, 3~5분)
 *      npx tsx scripts/fetch-data/fetch-tierlist.ts 5      (5챔피언 스모크)
 */
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(__dirname, '../../src/features/tierlist/data');
const APP_DIR = path.resolve(__dirname, '../../src/features');

const DTODO = 'https://data.dtodo.cn/api/client/v1';
const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global';

/** 크기 손잡이. 늘리면 tierlist.json이 비례해 커진다(앱은 담긴 만큼 다 그린다). */
const N_AUG = 4; // 희귀도별
const N_ITEM = 6;

/**
 * 최소 표본. **증강**은 dtodo가 winRateMinimumGames(255)를 같이 주지만 아이템에는
 * 임계값이 없어 직접 건다. 없으면 저픽 챔피언에서 71판짜리 66.2% 가
 * 1,042판짜리 61.4% 를 제치고 1위로 올라온다(실제로 그웬에서 나왔다).
 */
const MIN_GAMES = 200;

const LIMIT = Number(process.argv[2]) || Infinity;

interface Entry {
  id: string;
  score: number;
  games: number;
}
interface Row {
  key: string;
  score: number;
  sub: number;
  augments: Entry[];
  items: Entry[];
}

async function fetchJson(url: string, tries = 3): Promise<any | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch {
      if (i < tries - 1) await sleep(i === 0 ? 500 : 1500);
    }
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 소수 4자리면 승률 표시에 충분하다. 원본은 자릿수가 길어 파일이 배로 커진다. */
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const readApp = (p: string) => JSON.parse(fs.readFileSync(path.join(APP_DIR, p), 'utf8'));

/** 표본 필터 → 조인 실패 제거 → 정렬 → slice. 순서가 중요하다:
 *  조인 실패를 먼저 버려야 항상 N개가 찬다. */
function top(rows: { id: string | null; score: number; games: number }[], n: number): Entry[] {
  return rows
    .filter((r): r is Entry => r.id != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((e) => ({ ...e, score: r4(e.score) }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── 앱 로컬 데이터: 조인의 목적지 ──────────────────────────────────
  const champions = readApp('champions/data/champions.ko.json') as { key: string }[];
  const aramAug = readApp('augments/data/augments.ko.json') as any[];
  const rarityOf = new Map<string, string>(aramAug.map((a) => [a.id, a.rarity]));

  // ── CDragon: 숫자 id → 앱 증강 슬러그 ────────────────────────────
  const cherry = await fetchJson(`${CDRAGON}/ko_kr/v1/cherry-augments.json`);
  if (!cherry) throw new Error('CDragon cherry-augments fetch 실패');
  const byNameId = new Map<string, string>(
    aramAug.filter((a) => a.augmentNameId).map((a) => [a.augmentNameId, a.id]),
  );
  const augId = new Map<number, string>();
  for (const a of (cherry.augments ?? cherry) as any[]) {
    const slug = byNameId.get(a.augmentNameId);
    if (slug) augId.set(a.id, slug);
  }

  // ── CDragon 아이템: 이름·아이콘을 직접 굽는다 ────────────────────
  // ponytail: 앱 items.ko.json 에 조인하면 상위 아이템 일부가 통째로 빠진다(앱 아이템
  // 데이터에 없는 id 가 섞여 있다). CDragon 은 100% 커버하고 유니크가 금방 포화돼
  // ko/en 합쳐 ~28KB다. 앱 조인보다 오히려 코드가 짧다 — 접두사 제거도 필요 없어진다.
  const itemMeta: Record<'ko' | 'en', Map<string, { name: string; iconPath: string }>> = {
    ko: new Map(),
    en: new Map(),
  };
  for (const [suffix, loc] of [['ko', 'ko_kr'], ['en', 'default']] as const) {
    const items = await fetchJson(`${CDRAGON}/${loc}/v1/items.json`);
    if (!items) throw new Error(`CDragon items.json(${loc}) fetch 실패`);
    for (const i of items) {
      itemMeta[suffix].set(String(i.id), { name: i.name, iconPath: i.iconPath });
    }
  }

  // ── 소스 목록 ────────────────────────────────────────────────────
  const cfg = await fetchJson(`${DTODO}/config`);
  if (!cfg) throw new Error('dtodo config fetch 실패');
  const ver: string = cfg.dataVersion;

  const dtChamps = await fetchJson(`${DTODO}/data/${ver}/champions.json`);
  if (!dtChamps) throw new Error('dtodo champions.json fetch 실패');
  const stats = new Map<string, any>((dtChamps.data as any[]).map((c) => [String(c.id), c.stats]));
  const patch: string = cfg.gamePatch ?? '';
  const date: string = (dtChamps.data as any[])[0]?.stats?.date ?? '';

  console.log(`패치 ${patch} · 집계일 ${date} · dataVersion ${ver}`);
  console.log(`증강 매핑 ${augId.size} · 아이템 사전 ${itemMeta.ko.size}`);

  // ── 챔피언 루프 ──────────────────────────────────────────────────
  const keys = champions.map((c) => c.key).slice(0, LIMIT);
  const aram: Row[] = [];
  const usedItems = new Set<string>();
  const skipped: string[] = [];
  let augMiss = 0;
  let augTotal = 0;

  for (const [i, key] of keys.entries()) {
    const cs = stats.get(key);
    if (!cs || cs.winRate == null) continue;
    const dt = await fetchJson(`${DTODO}/data/${ver}/champions/${key}.json`);
    if (!dt) {
      skipped.push(key);
      continue;
    }

    const augs = (dt.augments ?? []).map((a: any) => {
      const s = a.stats ?? {};
      augTotal++;
      const id = augId.get(a.id) ?? null;
      if (!id) augMiss++;
      // dtodo가 임계값을 같이 준다. 서버에서 이미 거른 듯하지만 정책이 바뀌면 노이즈가 샌다.
      const ok = s.winRate != null && (s.games ?? 0) >= (s.winRateMinimumGames ?? 0);
      return ok ? { id, score: s.winRate, games: s.games ?? 0 } : { id: null, score: 0, games: 0 };
    });

    // ponytail: 아이템은 build.queueId=450 — 일반 칼바람이지 광란(2400)이 아니다.
    // 광란 아이템 승률은 어느 소스에도 없다(Blitz는 tier 1~5만 줘서 정렬하면 동점 수십 개).
    // 출처 문구에 "아이템은 일반 칼바람 통계"로 명시한다.
    const items = ((dt.build?.situationalItems ?? []) as any[])
      // situationalItems[].winRate 필드는 쓰지 않는다 — 음수까지 나오는 별개의 정규화 점수다.
      .filter((x) => (x.games ?? 0) >= MIN_GAMES)
      .map((x) => ({ id: String(x.id), score: x.wins / x.games, games: x.games }));

    // 희귀도별 상위 N개. 희귀도는 앱 증강 레코드에서 온다(JSON에 담지 않는다).
    const augments = ['silver', 'gold', 'prismatic'].flatMap((rarity) =>
      top(augs.filter((r: any) => r.id && rarityOf.get(r.id) === rarity), N_AUG),
    );

    const row: Row = {
      key,
      score: r4(cs.winRate),
      sub: r4(cs.pickRate ?? 0),
      augments,
      items: top(items, N_ITEM),
    };
    row.items.forEach((e) => usedItems.add(e.id));
    aram.push(row);

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${keys.length}...`);
    await sleep(150);
  }

  aram.sort((a, b) => b.score - a.score); // 승률 높은 순

  // sanity 가드 — 소스가 반쯤 죽은 날 좋은 JSON을 쓰레기로 덮어쓰지 않게.
  if (LIMIT === Infinity && aram.length < 150) {
    throw new Error(`수집 부족 — ${aram.length}명. 쓰지 않고 중단.`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'tierlist.json'),
    JSON.stringify({ patch, date, generatedAt: new Date().toISOString(), aram }),
  );
  for (const suffix of ['ko', 'en'] as const) {
    const dict = [...usedItems]
      .sort()
      .map((id) => ({ id, ...itemMeta[suffix].get(id)! }))
      .filter((x) => x.name);
    fs.writeFileSync(path.join(OUT_DIR, `tierlist-items.${suffix}.json`), JSON.stringify(dict));
  }

  const kb = (f: string) => (fs.statSync(path.join(OUT_DIR, f)).size / 1024).toFixed(0);
  console.log(`\n칼바람 ${aram.length}명 · 아이템 사전 ${usedItems.size}개`);
  console.log(`증강 조인 실패 ${augMiss}/${augTotal} (${((augMiss / augTotal) * 100).toFixed(1)}%)`);
  if (skipped.length) console.log(`스킵: ${skipped.join(', ')}`);
  console.log(
    `→ tierlist.json ${kb('tierlist.json')}KB · items.ko ${kb('tierlist-items.ko.json')}KB · items.en ${kb('tierlist-items.en.json')}KB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
