// components/Dropdown.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ViewStyle, StyleProp, Modal } from 'react-native';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  width?: number | string;
  dropdownWidth?: number | string;
  zIndex?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  dropdownStyle?: StyleProp<ViewStyle>;
}

const Dropdown: React.FC<DropdownProps> = ({
  selectedValue,
  onValueChange,
  options,
  placeholder = 'Sélectionnez...',
  label,
  width = '100%',
  dropdownWidth: customDropdownWidth,
  zIndex = 1000,
  disabled = false,
  style,
  dropdownStyle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>(
    options.find(opt => opt.value === selectedValue)?.label || placeholder
  );

  useEffect(() => {
    const label = options.find(opt => opt.value === selectedValue)?.label || placeholder;
    setSelectedLabel(label);
  }, [selectedValue, options, placeholder]);

  const getDropdownWidth = (): ViewStyle => {
    if (typeof customDropdownWidth === 'number') {
      return { width: customDropdownWidth };
    }
    if (typeof customDropdownWidth === 'string' && customDropdownWidth.endsWith('%')) {
      const percentage = parseFloat(customDropdownWidth) / 100;
      return { width: Dimensions.get('window').width * percentage };
    }
    if (typeof width === 'number') {
      return { width };
    }
    if (typeof width === 'string' && width.endsWith('%')) {
      const percentage = parseFloat(width) / 100;
      return { width: Dimensions.get('window').width * percentage };
    }
    return { width: '100%' };
  };

  return (
    <View style={[styles.container, getDropdownWidth(), style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.disabledButton,
          { width: '100%' }
        ]}
        onPress={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
      >
        <Text style={styles.dropdownButtonText}>{selectedLabel}</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsOpen(false)}
        >
          <View style={[
            styles.dropdownList,
            getDropdownWidth(),
            dropdownStyle
          ]}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.dropdownItem}
                onPress={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  option.value === selectedValue && styles.selectedItemText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  dropdownButton: {
    height: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  selectedItemText: {
    color: '#007bff',
    fontWeight: '600',
  },
});

export default Dropdown;
