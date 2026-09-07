/**
 * CustomTabBar — iOS 26 미만 폴백 하단 탭바.
 * iOS 26+는 NativeTabs(리퀴드글래스)를 그대로 쓰고, 그 미만에서만 이 컴포넌트가 렌더된다.
 *
 * `expo-router/ui`의 headless Tabs로 구성한다. 메인 / 티어리스트 / 마이페이지 /
 * 원형 플러스 액션버튼 순. 플러스는 탭 전환 없이 mode-select 모달만 연다(기존 NativeTabs 동작과 동일):
 * TabTrigger의 onPress에서 `e.preventDefault()`를 호출하면 useTabTrigger가 탭 전환을 건너뛴다.
 *
 * 아이콘은 SF Symbol을 쓸 수 없는 RN 트리(Pressable/Image)이므로
 * `@expo/vector-icons/MaterialIcons` 벡터 아이콘 폰트를 사용한다.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TabList, TabSlot, Tabs, TabTrigger } from "expo-router/ui";
import { forwardRef } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { home: "메인", tierlist: "티어리스트", mypage: "마이페이지" },
  en: { home: "Home", tierlist: "Tier List", mypage: "My Page" },
};

type TabButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  activeColor: string;
  inactiveColor: string;
  // TabTrigger asChild가 주입: isFocused / onPress / onLongPress / style 등
  isFocused?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 좌·우 탭 버튼 — 아이콘 + 라벨. 포커스 시 accent 틴트. */
const TabButton = forwardRef<View, TabButtonProps>(function TabButton(
  // style: TabTrigger(asChild)가 주입하는 tabTrigger 스타일(flexDirection:row 등).
  // 우리 sideButton이 이기도록 뒤에 두어야 아이콘/라벨이 세로(column)로 쌓인다.
  { icon, label, activeColor, inactiveColor, isFocused, style, ...rest },
  ref,
) {
  const color = isFocused ? activeColor : inactiveColor;
  return (
    <Pressable ref={ref} style={[style, styles.sideButton]} {...rest}>
      <MaterialIcons name={icon} size={26} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
});

type CenterPlusButtonProps = {
  accentColor: string;
  iconColor: string;
  isFocused?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 중앙 원형 볼드 플러스 액션버튼. 탭 전환 없이 모달만 연다. */
const CenterPlusButton = forwardRef<View, CenterPlusButtonProps>(
  function CenterPlusButton(
    // style: TabTrigger 주입분. flex:1(균등 3분할)이 유지되도록 뒤에 둔다.
    { accentColor, iconColor, isFocused, style, ...rest },
    ref,
  ) {
    return (
      <Pressable ref={ref} style={[style, styles.centerButton]} {...rest}>
        <View style={[styles.centerCircle, { backgroundColor: accentColor }]}>
          <MaterialIcons name="add" size={34} color={iconColor} />
        </View>
      </Pressable>
    );
  },
);

export default function CustomTabBar() {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openModal = (e: GestureResponderEvent) => {
    // preventDefault → useTabTrigger가 plus 탭으로의 전환을 건너뛴다(빈 화면 방지).
    e.preventDefault();
    router.push("/mode-select");
  };

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface.base,
            borderTopColor: colors.border.default,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TabTrigger name="(home)" href="/(tabs)/(home)" asChild>
          <TabButton
            icon="home"
            label={translate("home")}
            activeColor={colors.accent.default}
            inactiveColor={colors.text.secondary}
          />
        </TabTrigger>

        <TabTrigger name="(tierlist)" href="/(tabs)/(tierlist)" asChild>
          <TabButton
            icon="bar-chart"
            label={translate("tierlist")}
            activeColor={colors.accent.default}
            inactiveColor={colors.text.secondary}
          />
        </TabTrigger>

        <TabTrigger name="(mypage)" href="/(tabs)/(mypage)" asChild>
          <TabButton
            icon="account-circle"
            label={translate("mypage")}
            activeColor={colors.accent.default}
            inactiveColor={colors.text.secondary}
          />
        </TabTrigger>

        <TabTrigger name="plus" href="/(tabs)/plus" asChild onPress={openModal}>
          <CenterPlusButton
            accentColor={colors.accent.default}
            iconColor={colors.text.inverse}
          />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: Spacing.six + Spacing.three, // 64 + 16
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  sideButton: {
    flex: 1,
    flexDirection: "column", // 아이콘 위 / 라벨 아래 (주입된 row를 덮음)
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  centerButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
