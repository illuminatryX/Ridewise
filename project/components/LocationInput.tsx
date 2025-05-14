import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Platform } from 'react-native';
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
    // Fetch suggestions when value changes with reduced debounce time
    const fetchSuggestions = async () => {
      if (value.length >= 3 && isFocused) { // Only fetch suggestions if input is focused
        setIsSearching(true);
        try {
          const results = await getLocationSuggestions(value);
          setSuggestions(results);
          // Only show suggestions if input is focused and we have results
          setShowSuggestions(isFocused && results.length > 0);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    // Reduced debounce time from 500ms to 300ms for faster response
    const timerId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timerId);
  }, [value, isFocused]);

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
        <MapPin size={18} color={iconColor || colors.primary} />
      </View>
      <View style={styles.inputContainer}>
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label} // Use label as placeholder if none provided
          containerStyle={styles.input}
          onFocus={() => {
            if (onFocus) onFocus();
            setIsFocused(true);
            // Only show suggestions if we already have results and user is focusing
            if (value.length >= 3 && suggestions.length > 0) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
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
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
    zIndex: 10,
  },
  iconContainer: {
    marginRight: 8,
    paddingTop: 0,
    alignSelf: 'center',
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    marginBottom: 0,
    paddingVertical: 6,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    zIndex: 9999,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
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