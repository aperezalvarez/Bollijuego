import React from 'react';
import {Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle} from 'react-native';
import {Icon, type IconName} from './Icon';
import {haptic} from './haptics';
import {color, hit, radius, type as T} from './theme';

export type Variant = 'primary' | 'neutral' | 'danger' | 'confirm' | 'ghost';
interface Props {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: Variant;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  hint?: string;
}

const PALETTE: Record<Variant, {bg: string; fg: string; border: string}> = {
  primary: {bg: color.gold, fg: color.ink, border: color.brass},
  neutral: {bg: color.wood700, fg: color.textOnDark, border: color.brass},
  danger: {bg: color.blood, fg: color.textOnDark, border: '#b8483c'},
  confirm: {bg: color.sage, fg: color.textOnDark, border: '#6f8f5c'},
  ghost: {bg: 'transparent', fg: color.textMuted, border: 'transparent'},
};

export function Button({label, onPress, icon, variant = 'neutral', disabled, compact, style, hint}: Props) {
  const p = PALETTE[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{disabled: !!disabled}}
      disabled={disabled}
      onPress={() => {
        haptic('tap');
        onPress?.();
      }}
      style={({pressed}) => [
        styles.base,
        {backgroundColor: p.bg, borderColor: p.border, minHeight: compact ? hit.min : 52},
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={20} color={p.fg} /> : null}
        <Text style={[styles.text, {color: p.fg}]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  active,
  size = 44,
  tone = color.textOnDark,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  tone?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected: !!active}}
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      hitSlop={6}
      style={({pressed}) => [
        styles.iconBtn,
        {width: Math.max(size, hit.min), height: Math.max(size, hit.min)},
        active && styles.iconActive,
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={22} color={active ? color.gold : tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  text: {...T.label, fontSize: 14},
  pressed: {transform: [{scale: 0.97}], opacity: 0.9},
  disabled: {opacity: 0.45},
  iconBtn: {borderRadius: radius.md, justifyContent: 'center', alignItems: 'center'},
  iconActive: {backgroundColor: 'rgba(217,164,65,0.16)', borderWidth: 1, borderColor: color.brass},
});
