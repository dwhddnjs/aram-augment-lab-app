/**
 * TierlistChampionScreen — 티어리스트 챔피언 상세(모달).
 *
 * 챔피언 지표 + 어울리는 증강(희귀도 3그룹) + 어울리는 아이템. 칼바람 전용이다.
 * 두 목록이 전부 DetailCardRow 한 컴포넌트라 렌더러는 map 두 개면 끝난다.
 *
 * 아이템 이름·아이콘은 앱 items.ko.json 이 아니라 tierlist-items.{ko,en}.json 에서 온다
 * — 앱 아이템 데이터에 없는 id 가 섞여 있어 CDragon 에서 직접 구웠다.
 */
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentTile } from '@/components/ui/augment-tile';
import { DetailCardRow } from '@/components/ui/detail-card-row';
import { RemoteImage } from '@/components/ui/remote-image';
import { HeroOverlay, Radius, Spacing, TierColors } from '@/constants/theme';
import type { Augment } from '@/features/augments/types';
import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import {
  type TierEntry,
  findTierRow,
  tierOf,
  tierRankOf,
  tierlistMeta,
} from '@/features/tierlist/tiers';
import { type Locale, useLocale } from '@/hooks/use-locale';
import { useRarityColors } from '@/hooks/use-rarity-colors';
import { useTheme } from '@/hooks/use-theme';
import { cleanAugmentDescription } from '@/lib/augment-text';
import { cdragonItemIconUrl } from '@/lib/ddragon';
import { CHAMPION_TAG_LABELS, useLocalizedData, useTranslation } from '@/lib/i18n';

interface TierItem {
  id: string;
  name: string;
  iconPath: string;
}

const itemData: Record<Locale, TierItem[]> = {
  ko: require('@/features/tierlist/data/tierlist-items.ko.json'),
  en: require('@/features/tierlist/data/tierlist-items.en.json'),
};

const t = {
  ko: {
    augments: '어울리는 증강',
    items: '어울리는 아이템',
    silver: '실버',
    gold: '골드',
    prismaticRarity: '프리즘',
    games: '판',
    pickShort: '픽',
    rank: '{total}명 중 {rank}위',
    source: '아이템은 일반 칼바람(ARAM) 통계 · 패치 {patch} · {date} 기준',
  },
  en: {
    augments: 'Recommended Augments',
    items: 'Recommended Items',
    silver: 'Silver',
    gold: 'Gold',
    prismaticRarity: 'Prismatic',
    games: 'games',
    pickShort: 'Pick',
    rank: '#{rank} of {total}',
    source: 'Item stats are from standard ARAM · Patch {patch} · as of {date}',
  },
};

const RARITIES = ['silver', 'gold', 'prismatic'] as const;
const RARITY_KEY = { silver: 'silver', gold: 'gold', prismatic: 'prismaticRarity' } as const;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function TierlistChampionScreen() {
  const { colors, mode: themeMode } = useTheme();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();
  const rarityColors = useRarityColors();

  const params = useLocalSearchParams<{ key: string }>();
  const champion = useChampions().find((c) => c.key === params.key);
  const row = findTierRow(params.key);
  const augPool = useAugments();
  const items = useLocalizedData(itemData);

  const augById = new Map<string, Augment>(augPool.map((a) => [a.id, a]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  if (!champion || !row) return null;

  const { rank, total } = tierRankOf(params.key);
  const tier = tierOf(params.key);

  /** 증강·아이템 공통 메타: 승률 + 표본수. */
  const meta = (e: TierEntry) => (
    <ThemedText type="caption" color="tertiary">
      {`${pct(e.score)} · ${e.games.toLocaleString()}${locale === 'ko' ? '' : ' '}${translate('games')}`}
    </ThemedText>
  );

  const augmentRows = (rarity: (typeof RARITIES)[number]) => {
    const list = row.augments.filter((e) => augById.get(e.id)?.rarity === rarity);
    if (!list.length) return null;
    return (
      <View key={rarity} style={styles.group}>
        <ThemedText type="label" color="secondary">
          {translate(RARITY_KEY[rarity])}
        </ThemedText>
        {list.map((e) => {
          const aug = augById.get(e.id)!;
          return (
            <DetailCardRow
              key={e.id}
              accentColor={rarityColors[rarity].border}
              icon={
                <AugmentTile
                  iconPath={aug.iconPath}
                  rarity={rarity}
                  size={44}
                  background={HeroOverlay.cardBase}
                  recyclingKey={aug.id}
                />
              }
              title={aug.name}
              meta={meta(e)}
              description={cleanAugmentDescription(aug.description)}
            />
          );
        })}
      </View>
    );
  };

  const source = translate('source')
    .replace('{patch}', tierlistMeta.patch)
    .replace('{date}', tierlistMeta.date);

  return (
    <>
      <Stack.Screen
        options={{
          title: champion.name,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Image source="sf:xmark" style={styles.headerIcon} tintColor={colors.text.secondary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* 챔피언 헤더 */}
        <View style={styles.header}>
          <RemoteImage
            uri={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`}
            style={styles.portrait}
            recyclingKey={champion.id}
          />
          <View style={styles.headerBody}>
            <View style={styles.titleRow}>
              {tier ? (
                <View
                  style={[
                    styles.tierBadge,
                    { borderColor: TierColors[themeMode][tier], backgroundColor: colors.surface.raised },
                  ]}
                >
                  <ThemedText type="label" style={{ color: TierColors[themeMode][tier] }}>
                    {tier}
                  </ThemedText>
                </View>
              ) : null}
              <ThemedText type="heading">{champion.name}</ThemedText>
            </View>
            <ThemedText type="caption" color="secondary">
              {champion.tags.map((tag) => CHAMPION_TAG_LABELS[locale][tag] ?? tag).join(' · ')}
            </ThemedText>
            <ThemedText type="label" color="accent">
              {`${pct(row.score)} · ${translate('pickShort')} ${pct(row.sub)}`}
            </ThemedText>
            <ThemedText type="caption" color="tertiary">
              {translate('rank').replace('{rank}', String(rank)).replace('{total}', String(total))}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="heading" style={styles.sectionTitle}>
          {translate('augments')}
        </ThemedText>
        {RARITIES.map(augmentRows)}

        <ThemedText type="heading" style={styles.sectionTitle}>
          {translate('items')}
        </ThemedText>
        <View style={styles.group}>
          {row.items.map((e) => {
            const item = itemById.get(e.id);
            if (!item) return null;
            return (
              <DetailCardRow
                key={e.id}
                accentColor={colors.border.strong}
                icon={
                  <RemoteImage
                    uri={cdragonItemIconUrl(item.iconPath)}
                    size={44}
                    recyclingKey={e.id}
                    style={styles.itemIcon}
                  />
                }
                title={item.name}
                meta={meta(e)}
              />
            );
          })}
        </View>

        <ThemedText type="caption" color="tertiary" style={styles.source}>
          {source}
        </ThemedText>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  headerIcon: {
    width: 18,
    height: 18,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  portrait: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  headerBody: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tierBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    paddingTop: Spacing.three,
  },
  group: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  itemIcon: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  source: {
    paddingTop: Spacing.three,
    lineHeight: 16,
  },
});
