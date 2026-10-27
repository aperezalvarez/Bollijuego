import React from 'react';
import {Pressable, StyleSheet, Switch, Text, TextInput, View, type TextInputProps} from 'react-native';
import {Button, IconButton} from './Button';
import {Icon} from './Icon';
import {haptic} from './haptics';
import {color, hit, radius, type as T} from './theme';

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <IconButton icon="back" label="Volver" onPress={onBack} />
      ) : (
        <View style={{width: hit.min}} />
      )}
      <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={{minWidth: hit.min, alignItems: 'flex-end'}}>{right}</View>
    </View>
  );
}

export function Plate({children, title, style}: {children: React.ReactNode; title?: string; style?: object}) {
  return (
    <View style={[styles.plate, style]}>
      {title ? <Text style={styles.plateTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <View
      style={styles.stepRow}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityValue={{min, max, now: value}}
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={e =>
        onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))
      }>
      <View style={{flex: 1}}>
        <Text style={styles.stepLabel}>{label}</Text>
        {hint ? <Text style={styles.stepHint}>{hint}</Text> : null}
      </View>
      <IconRound icon="minus" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text style={styles.stepValue}>{value}</Text>
      <IconRound icon="plus" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function IconRound({
  icon,
  onPress,
  disabled,
}: {
  icon: 'minus' | 'plus';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'plus' ? 'Aumentar' : 'Disminuir'}
      disabled={disabled}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={({pressed}) => [
        styles.round,
        disabled && {opacity: 0.35},
        pressed && {transform: [{scale: 0.94}]},
      ]}>
      <Text style={styles.roundText}>{icon === 'plus' ? '+' : '−'}</Text>
    </Pressable>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {id: T; label: string}[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map(o => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{selected: on}}
            onPress={() => {
              haptic('select');
              onChange(o.id);
            }}
            style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && {color: color.ink}]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Icon name={icon} size={22} color={color.gold} />
      <View style={{flex: 1}}>
        <Text style={styles.stepLabel}>{label}</Text>
        {hint ? <Text style={styles.stepHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={v => {
          haptic('select');
          onChange(v);
        }}
        trackColor={{false: color.wood700, true: color.sage}}
        thumbColor={value ? color.gold : color.textMuted}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function Field(props: TextInputProps & {label: string}) {
  const {label, style, ...rest} = props;
  return (
    <View style={{gap: 4}}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={color.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export {Button};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 56,
  },
  headerTitle: {...T.h2, color: color.gold, flex: 1, textAlign: 'center'},
  plate: {
    backgroundColor: 'rgba(43,28,18,0.92)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.brass,
    padding: 14,
    gap: 10,
  },
  plateTitle: {...T.label, color: color.gold},
  stepRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52},
  stepLabel: {color: color.textOnDark, fontWeight: '700', fontSize: 15},
  stepHint: {color: color.textMuted, fontSize: 12},
  stepValue: {
    color: color.gold,
    fontWeight: '800',
    fontSize: 22,
    width: 34,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  round: {
    width: hit.min + 2,
    height: hit.min + 2,
    borderRadius: radius.md,
    backgroundColor: color.wood700,
    borderWidth: 1.5,
    borderColor: color.brass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundText: {color: color.textOnDark, fontSize: 26, fontWeight: '700', lineHeight: 30},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    minHeight: hit.min,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.brass,
    backgroundColor: color.wood700,
    justifyContent: 'center',
  },
  chipOn: {backgroundColor: color.gold},
  chipText: {color: color.textOnDark, fontWeight: '800', fontSize: 14},
  switchRow: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56},
  fieldLabel: {...T.label, color: color.textMuted},
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: color.brass,
    backgroundColor: color.wood900,
    color: color.textOnDark,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
