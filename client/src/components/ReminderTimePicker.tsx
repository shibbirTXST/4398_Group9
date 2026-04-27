import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps,
} from 'react-native';

type Props = {
  initialTime?: Date;
  onTimeChange?: (time: Date) => void;
};

const pad = (n: number) => n.toString().padStart(2, '0');

const formatTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(h12)}:${pad(minutes)} ${ampm}`;
};

export default function ReminderTimePicker({ initialTime, onTimeChange }: Props) {
  const defaultTime = initialTime ?? (() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  })();

  const [time, setTime] = useState<Date>(defaultTime);
  const [show, setShow] = useState<boolean>(false);

  // Web-specific masked input state:
  const [webDisplay, setWebDisplay] = useState<string>(() => {
    const h = defaultTime.getHours();
    const m = defaultTime.getMinutes();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${pad(h12)}:${pad(m)}`;
  });
  const [amPm, setAmPm] = useState<'AM' | 'PM'>(() => (defaultTime.getHours() >= 12 ? 'PM' : 'AM'));
  const webInputRef = useRef<RNTextInput | null>(null);

  // Lazy-require native picker to avoid web bundler crashes
  let DateTimePicker: any = null;
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  }

  const openPicker = () => {
    if (Platform.OS === 'web') {
      // Focus the masked input so user can type
      webInputRef.current?.focus();
      return;
    }
    setShow(true);
  };

  const closePicker = () => setShow(false);

  // Mobile handler (unchanged logic)
  const handleChangeMobile = (event: any, selected?: Date | undefined) => {
    if (Platform.OS === 'android') setShow(false);

    const current = selected ?? time;
    const eventType = event?.type ?? event?.nativeEvent?.action;
    if (Platform.OS === 'android' && (eventType === 'dismissed' || eventType === 'dismissedAction')) {
      return;
    }

    setTime(current);
    onTimeChange?.(current);

    // also sync web display + AM/PM if user switches platforms in dev
    const hh = current.getHours();
    const hh12 = hh % 12 === 0 ? 12 : hh % 12;
    setWebDisplay(`${pad(hh12)}:${pad(current.getMinutes())}`);
    setAmPm(hh >= 12 ? 'PM' : 'AM');
  };

  // Helpers for web masked input
  const digitsFromDisplay = (display: string) => display.replace(/\D/g, ''); // returns up to 4 digits (HHMM)
  const formatFromDigits = (digits: string) => {
    if (digits.length <= 1) return digits;
    if (digits.length === 2) return `${digits}:`;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  const validateDigits = (digits: string) => {
    if (digits.length !== 4) return false;
    const hh = parseInt(digits.slice(0, 2), 10);
    const mm = parseInt(digits.slice(2, 4), 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
    if (hh < 1 || hh > 12) return false; // 12-hour clock: 01..12
    if (mm < 0 || mm > 59) return false;
    return true;
  };

  const commitTimeFromDigits = (digits: string, ampmState: 'AM' | 'PM') => {
    if (!validateDigits(digits)) return false;
    let hh = parseInt(digits.slice(0, 2), 10);
    const mm = parseInt(digits.slice(2, 4), 10);

    // convert to 24-hour
    if (ampmState === 'AM') {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh = hh + 12;
    }

    const newDate = new Date(time);
    newDate.setHours(hh, mm, 0, 0);
    setTime(newDate);
    onTimeChange?.(newDate);
    return true;
  };

  // Web input change handler — masked input behavior
  const handleWebChangeText: TextInputProps['onChangeText'] = (text) => {
    // Accept only digits and colon; sanitize
    const digits = text.replace(/\D/g, '').slice(0, 4); // up to 4 digits (HHMM)
    const formatted = formatFromDigits(digits);

    setWebDisplay(formatted);

    // If user has typed full 4 digits (display length 5 with colon), validate & commit
    if (digits.length === 4 && validateDigits(digits)) {
      commitTimeFromDigits(digits, amPm);
    }
  };

  // When AM/PM toggle pressed
  const handleToggleAmPm = () => {
    const next = amPm === 'AM' ? 'PM' : 'AM';
    setAmPm(next);

    // Try to commit if current masked input represents a valid time
    const digits = digitsFromDisplay(webDisplay);
    if (digits.length === 4 && validateDigits(digits)) {
      commitTimeFromDigits(digits, next);
      // sync display to normalized form (in case user typed 12/00 edge cases)
      const hh = parseInt(digits.slice(0, 2), 10);
      const mm = parseInt(digits.slice(2, 4), 10);
      const hh12 = hh; // keep as typed for display (we validated already 1-12)
      setWebDisplay(`${pad(hh12)}:${pad(mm)}`);
    } else {
      // If not valid but we have an existing `time` state, update `time` to same clock hour with toggled AM/PM
      const currentDigits = `${pad(((time.getHours() % 12) === 0 ? 12 : time.getHours() % 12))}${pad(time.getMinutes())}`;
      if (validateDigits(currentDigits)) {
        commitTimeFromDigits(currentDigits, next);
        setWebDisplay(`${currentDigits.slice(0, 2)}:${currentDigits.slice(2)}`);
      }
    }
  };

  // Web input key handling: ensure only numbers allowed when typing on web (extra guard)
  const handleWebOnKeyPress = (e: any) => {
    const k = e.nativeEvent?.key;
    if (!k) return;
    // Allow control keys
    if (k === 'Backspace' || k === 'Delete' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Tab') {
      return;
    }
    // Block non-digits
    if (!/^\d$/.test(k)) {
      e.preventDefault?.();
    }
  };

  // Value for mobile DateTimePicker provided via `time` state (keeps mobile unchanged)
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={openPicker} activeOpacity={0.7}>
        <Text style={styles.label}>Set Daily Reminder Time</Text>
        <Text style={styles.time}>{formatTime(time)}</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' ? (
        <View style={styles.webRow}>
          <RNTextInput
            ref={webInputRef}
            style={styles.webInput}
            value={webDisplay}
            onChangeText={handleWebChangeText}
            onKeyPress={handleWebOnKeyPress}
            keyboardType="numeric"
            maxLength={5} // includes colon
            placeholder="HH:MM"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.amPmButton} onPress={handleToggleAmPm} activeOpacity={0.7}>
            <Text style={styles.amPmText}>{amPm}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {show && DateTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant="light"
                textColor="#000000"
                onChange={handleChangeMobile}
                is24Hour={false}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.doneButton} onPress={closePicker}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  time: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

  // Web-specific styles (masked input + AM/PM)
  webRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  webInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  amPmButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amPmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  pickerContainer: {
    marginTop: 8,
    backgroundColor: Platform.OS === 'ios' ? '#fff' : 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eee',
  },
  doneText: {
    color: '#007aff',
    fontWeight: '600',
  },
});