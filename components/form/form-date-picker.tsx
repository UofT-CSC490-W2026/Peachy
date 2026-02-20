import { useState, useEffect } from 'react';
import {
  Platform,
  Pressable,
  Modal,
  View,
  StyleSheet,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatTime } from '@/utils/date-helpers';

interface FormDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  /** When true, only the date segment is shown (no time) */
  isAllDay?: boolean;
}

// iOS bottom-sheet picker — shown inside a Modal
function IOSPickerModal({
  visible,
  value,
  mode,
  onConfirm,
  onClose,
  surfaceColor,
  borderColor,
  tintColor,
}: {
  visible: boolean;
  value: Date;
  mode: 'date' | 'time';
  onConfirm: (date: Date) => void;
  onClose: () => void;
  surfaceColor: string;
  borderColor: string;
  tintColor: string;
}) {
  const [pending, setPending] = useState(value);

  // Sync pending state each time the modal opens, so stale values are never shown
  useEffect(() => {
    if (visible) {
      setPending(value);
    }
  }, [visible, value]);

  const handleChange = (_event: unknown, selected?: Date) => {
    if (selected) {
      setPending(selected);
    }
  };

  const handleConfirm = () => {
    onConfirm(pending);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Pressable onPress={onClose} style={styles.modalHeaderButton}>
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold">
              {mode === 'date' ? 'Select Date' : 'Select Time'}
            </ThemedText>
            <Pressable onPress={handleConfirm} style={styles.modalHeaderButton}>
              <ThemedText style={[styles.modalDoneText, { color: tintColor }]}>
                Done
              </ThemedText>
            </Pressable>
          </View>
          <DateTimePicker
            value={pending}
            mode={mode}
            display="spinner"
            onChange={handleChange}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );
}

export function FormDatePicker({
  date,
  onDateChange,
  isAllDay = false,
}: FormDatePickerProps) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');

  const [iosDateVisible, setIosDateVisible] = useState(false);
  const [iosTimeVisible, setIosTimeVisible] = useState(false);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = formatTime(date);

  // Merge a new date portion into the existing date (keep time)
  const applyDatePart = (newDate: Date) => {
    const merged = new Date(date);
    merged.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    onDateChange(merged);
  };

  // Merge a new time portion into the existing date (keep date)
  const applyTimePart = (newDate: Date) => {
    const merged = new Date(date);
    merged.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
    onDateChange(merged);
  };

  const openAndroidTimePicker = (baseDate: Date) => {
    DateTimePickerAndroid.open({
      value: baseDate,
      mode: 'time',
      is24Hour: false,
      onChange: (_event, selected) => {
        if (selected) {
          const merged = new Date(baseDate);
          merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
          onDateChange(merged);
        }
      },
    });
  };

  // Android: open date picker, then chain into time picker
  const openAndroidDatePicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      is24Hour: false,
      onChange: (_event, selected) => {
        if (selected) {
          applyDatePart(selected);
          if (!isAllDay) {
            openAndroidTimePicker(selected);
          }
        }
      },
    });
  };

  const handleDatePress = () => {
    if (Platform.OS === 'android') {
      openAndroidDatePicker();
    } else {
      setIosDateVisible(true);
    }
  };

  const handleTimePress = () => {
    if (Platform.OS === 'android') {
      openAndroidTimePicker(date);
    } else {
      setIosTimeVisible(true);
    }
  };

  // Web fallback — not a primary target for Peachy but keeps it compilable
  if (Platform.OS === 'web') {
    // HTML5 date inputs require a local ISO string (not UTC), so we subtract the timezone offset
    const offsetMs = date.getTimezoneOffset() * 60000;
    const localIsoString = new Date(date.getTime() - offsetMs).toISOString();
    const localDatetimeValue = localIsoString.slice(0, 16);
    const dateOnlyValue = localDatetimeValue.slice(0, 10);

    return (
      <View style={[styles.container, { backgroundColor: surfaceColor, borderColor }]}>
        <input
          type={isAllDay ? 'date' : 'datetime-local'}
          value={isAllDay ? dateOnlyValue : localDatetimeValue}
          style={{ border: 'none', background: 'transparent', fontSize: 16 }}
          onChange={(e) => {
            const parsed = new Date(e.target.value);
            if (!isNaN(parsed.getTime())) {
              onDateChange(parsed);
            }
          }}
        />
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        {/* Date segment */}
        <Pressable
          style={styles.segment}
          onPress={handleDatePress}
          accessibilityLabel="Select date"
          accessibilityRole="button"
        >
          <IconSymbol name="calendar" size={16} color={tintColor} />
          <ThemedText style={styles.segmentText}>{formattedDate}</ThemedText>
        </Pressable>

        {/* Divider + time segment (hidden when all-day) */}
        {!isAllDay && (
          <>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <Pressable
              style={styles.segment}
              onPress={handleTimePress}
              accessibilityLabel="Select time"
              accessibilityRole="button"
            >
              <IconSymbol name="clock" size={16} color={tintColor} />
              <ThemedText style={styles.segmentText}>{formattedTime}</ThemedText>
            </Pressable>
          </>
        )}

        {/* Chevron hint */}
        <IconSymbol name="chevron.right" size={14} color={textSecondaryColor} />
      </View>

      {/* iOS modals */}
      {Platform.OS === 'ios' && (
        <>
          <IOSPickerModal
            visible={iosDateVisible}
            value={date}
            mode="date"
            onConfirm={applyDatePart}
            onClose={() => setIosDateVisible(false)}
            surfaceColor={surfaceColor}
            borderColor={borderColor}
            tintColor={tintColor}
          />
          {!isAllDay && (
            <IOSPickerModal
              visible={iosTimeVisible}
              value={date}
              mode="time"
              onConfirm={applyTimePart}
              onClose={() => setIosTimeVisible(false)}
              surfaceColor={surfaceColor}
              borderColor={borderColor}
              tintColor={tintColor}
            />
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  segmentText: {
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 18,
    marginHorizontal: 4,
  },
  // iOS bottom-sheet modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderButton: {
    minWidth: 60,
  },
  modalCancelText: {
    fontSize: 16,
    opacity: 0.6,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  iosPicker: {
    height: 220,
  },
});
