/**
 * TierlistScreen — 칼바람 챔피언 티어표.
 *
 * 네이티브 검색바(large title 헤더) + S~D 티어 배너 + 2열 격자. 챔피언을 누르면 상세 모달.
 *
 * 칼바람 전용이다 — tiers.ts 주석 참고. 모드 세그먼트는 없다.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing, TierColors } from '@/constants/theme';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { tierSections, tierlistMeta } from '@/features/tierlist/tiers';
import { useTheme } from '@/hooks/use-theme';
import { championSquareUrl } from '@/lib/ddragon';
import { matchName } from '@/lib/hangul';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: {
    searchPlaceholder: '챔피언 검색 (초성 가능)',
    empty: '검색 결과가 없습니다',
    pickShort: '픽',
    source:
      'aram.gg 집계 · 패치 {patch} · {date} 기준\n챔피언 승률·픽률은 중국(텐센트) 서버 통계, 증강 승률은 이용자 클라이언트가 업로드한 표본입니다. 아이템은 일반 칼바람(ARAM) 통계입니다. 표본 편향이 있을 수 있습니다.',
  },
  en: {
    searchPlaceholder: 'Search champions',
    empty: 'No champions found',
    pickShort: 'Pick',
    source:
      'Data by aram.gg · Patch {patch} · as of {date}\nChampion win/pick rates are from CN (Tencent) servers; augment win rates come from user-uploaded samples. Item stats are from standard ARAM. Sampling bias may apply.',
  },
};

/** 격자·배너 공통 좌우 인셋. */
const INSET = Spacing.three;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function TierlistScreen() {
  const { colors, mode: themeMode } = useTheme();
  const translate = useTranslation(t);
  const router = useRouter();
  const champions = useChampions();
  const searchRef = useRef<SearchBarCommands>(null);
  const [query, setQuery] = useState('');

  const byKey = new Map(champions.map((c) => [c.key, c]));
  const tint = TierColors[themeMode];
  // 티어 배정은 전체 순위 기준 — 검색은 보여줄 챔피언만 고른다(tiers.ts 참고).
  const sections = tierSections((row) => {
    const champion = byKey.get(row.key);
    return champion != null && matchName(champion.name, query);
  });

  const source = translate('source')
    .replace('{patch}', tierlistMeta.patch)
    .replace('{date}', tierlistMeta.date);

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            ref: searchRef,
            placeholder: translate('searchPlaceholder'),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            hideWhenScrolling: true,
            textColor: colors.text.primary,
            tintColor: colors.accent.default,
          },
        }}
      />

      {/* SectionList 가 화면 루트여야 native large title collapse 와 검색바 inset 이
          동작한다(flex View 로 감싸면 헤더 연동이 깨진다 — champion-select-grid 와 같은 이유). */}
      <SectionList
        sections={sections}
        keyExtractor={(row, i) => `${row[0]?.key ?? 'empty'}-${i}`}
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        // 검색 active(취소버튼) 상태로 스크롤하면 inline 타이틀이 안 뜬다.
        onScrollBeginDrag={() => searchRef.current?.cancelSearch()}
        renderSectionHeader={({ section }) => {
          const c = tint[section.title];
          return (
            <LinearGradient
              // 등급색을 좌우로 흘려 가운데만 남긴다. 8자리 hex = 6자리 + 알파.
              colors={[`${c}1A`, `${c}A6`, `${c}1A`]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[
                styles.banner,
                { borderColor: `${c}66`, backgroundColor: colors.surface.raised },
              ]}
            >
              <ThemedText type="title" style={[styles.tierMark, { color: c }]}>
                {section.title}
              </ThemedText>
            </LinearGradient>
          );
        }}
        renderItem={({ item: row, section }) => {
          const c = tint[section.title];
          return (
            <View style={styles.gridRow}>
              {row.map((entry) => {
                const champion = byKey.get(entry.key);
                if (!champion) return null;
                return (
                  <Pressable
                    key={entry.key}
                    style={[styles.cell, { backgroundColor: colors.surface.raised }]}
                    onPress={() =>
                      router.push({
                        pathname: '/tierlist-champion-modal',
                        params: { key: entry.key },
                      })
                    }
                  >
                    <RemoteImage
                      uri={championSquareUrl(champion.imageKey)}
                      recyclingKey={champion.id}
                      style={[styles.image, { borderColor: c }]}
                    />
                    <View style={styles.cellBody}>
                      <ThemedText type="label" numberOfLines={1}>
                        {champion.name}
                      </ThemedText>
                      <ThemedText type="caption" color="tertiary" numberOfLines={1}>
                        {`${pct(entry.score)} · ${translate('pickShort')} ${pct(entry.sub)}`}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
              {/* 홀수로 끝난 행의 빈 칸 — 없으면 마지막 카드가 폭 전체로 늘어난다. */}
              {row.length < 2 ? <View style={styles.cell} /> : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <ThemedText type="body" color="tertiary" style={styles.empty}>
            {translate('empty')}
          </ThemedText>
        }
        ListFooterComponent={
          <ThemedText type="caption" color="tertiary" style={styles.source}>
            {source}
          </ThemedText>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.five,
  },
  banner: {
    height: 48,
    marginHorizontal: INSET,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierMark: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: INSET,
    paddingBottom: Spacing.two,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  image: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cellBody: {
    flex: 1,
    gap: Spacing.half,
  },
  empty: {
    paddingTop: Spacing.five,
    textAlign: 'center',
  },
  source: {
    paddingHorizontal: INSET,
    paddingTop: Spacing.four,
    lineHeight: 16,
  },
});
