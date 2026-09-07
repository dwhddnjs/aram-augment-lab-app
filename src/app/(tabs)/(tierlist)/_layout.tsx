import { Stack } from 'expo-router/stack';

import { stackScreenOptions } from '@/components/navigation/stack-screen-options';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { tierlist: '티어리스트' },
  en: { tierlist: 'Tier List' },
};

export default function TierlistStackLayout() {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  return (
    <Stack screenOptions={stackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={{
          title: translate('tierlist'),
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
