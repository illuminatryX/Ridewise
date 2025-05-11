import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Input from './Input';
import { useTheme } from '../context/ThemeContext';
import { getLocationSuggestions } from '../lib/locationService';

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

type LocationInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconColor?: string;
  onLocationSelect?: (location: LocationSuggestion) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function LocationInput({
  label,
  value,
  onChangeText,
  placeholder,
  iconColor,
  onLocationSelect,
  onFocus,
  onBlur,
}: LocationInputProps) {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Fetch suggestions when value changes
    const fetchSuggestions = async () => {
      if (value.length >= 3) {
        setIsSearching(true);
        try {
          const results = await getLocationSuggestions(value);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timerId = setTimeout(fetchSuggestions, 500); // Debounce search
    return () => clearTimeout(timerId);
  }, [value]);

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onChangeText(suggestion.address);
    setShowSuggestions(false);
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MapPin size={20} color={iconColor || colors.primary} />
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          containerStyle={styles.input}
          onFocus={() => {
            if (onFocus) onFocus();
            setIsFocused(true);
            if (value.length >= 3 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            if (onBlur) onBlur();
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
            }, 200);
          }}
        />
        
        {showSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.card }]}>
            {isSearching ? (
              <Text style={{ padding: 10, color: colors.textSecondary }}>
                Searching...
              </Text>
            ) : (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionSelect(item)}
                  >
                    <MapPin size={16} color={colors.textSecondary} style={styles.suggestionIcon} />
                    <View>
                      <Text style={[styles.suggestionText, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text 
                        style={[styles.suggestionAddress, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    position: 'relative',
    zIndex: 10,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 24,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    marginBottom: 0,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionAddress: {
    fontSize: 12,
    marginTop: 2,
  },
});