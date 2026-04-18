import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DateTimePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'datetime' | 'date' | 'time';
}

type PickerMode = 'date' | 'time' | null;

const pad = (value: number) => value.toString().padStart(2, '0');

const formatForInput = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatForDateInput = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatForTimeInput = (date: Date): string => {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseInputDate = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const parseTimeValue = (value: string): Date | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatForDisplay = (date: Date): string => {
  const dateText = date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeText = date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateText} - ${timeText}`;
};

const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  mode = 'datetime',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  const selectedDate = useMemo(() => {
    if (mode === 'time') return parseTimeValue(value);
    return parseInputDate(value);
  }, [mode, value]);

  const openPicker = (mode: Exclude<PickerMode, null>) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (!pickedDate || !pickerMode) {
      setShowPicker(false);
      return;
    }

    if (mode === 'date') {
      onChange(formatForDateInput(pickedDate));
      setShowPicker(false);
      return;
    }

    if (mode === 'time') {
      onChange(formatForTimeInput(pickedDate));
      setShowPicker(false);
      return;
    }

    const base = selectedDate ? new Date(selectedDate) : new Date();
    const next = new Date(base);

    if (pickerMode === 'date') {
      next.setFullYear(pickedDate.getFullYear(), pickedDate.getMonth(), pickedDate.getDate());
    } else {
      next.setHours(pickedDate.getHours(), pickedDate.getMinutes(), 0, 0);
    }

    onChange(formatForInput(next));
    setShowPicker(false);
  };

  const resolvedPlaceholder =
    placeholder ||
    (mode === 'date' ? 'اختر التاريخ' : mode === 'time' ? 'اختر الوقت' : 'اختر التاريخ والوقت');

  const displayValue = selectedDate
    ? mode === 'date'
      ? formatDateForDisplay(selectedDate)
      : mode === 'time'
      ? formatTimeForDisplay(selectedDate)
      : formatForDisplay(selectedDate)
    : resolvedPlaceholder;

  const openSinglePicker = () => openPicker(mode === 'time' ? 'time' : 'date');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.fieldCard}>
        <Text style={[styles.valueText, !selectedDate && styles.placeholderText]}>
          {displayValue}
        </Text>

        {mode === 'datetime' ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openPicker('date')}>
              <Icon name="event" size={18} color="#1a237e" />
              <Text style={styles.actionText}>تاريخ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openPicker('time')}>
              <Icon name="schedule" size={18} color="#1a237e" />
              <Text style={styles.actionText}>وقت</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={openSinglePicker}>
            <Icon name={mode === 'time' ? 'schedule' : 'event'} size={18} color="#1a237e" />
            <Text style={styles.actionText}>{mode === 'time' ? 'اختيار الوقت' : 'اختيار التاريخ'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showPicker && pickerMode ? (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour
          minimumDate={pickerMode === 'date' ? minimumDate : undefined}
          maximumDate={pickerMode === 'date' ? maximumDate : undefined}
          onChange={handlePickerChange}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 12,
  },
  valueText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionText: {
    color: '#1a237e',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default DateTimePickerField;