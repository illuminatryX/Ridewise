import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// This component creates a pixel-style taxi logo
export default function PixelLogo() {
  const { colors } = useTheme();
  const pixelSize = 8;
  
  // 2D array representing the pixel art pattern
  // 1 = yellow, 2 = black, 3 = green
  const pixelPattern = [
    [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
    [0, 0, 2, 1, 1, 1, 1, 2, 0, 0],
    [0, 2, 1, 1, 1, 1, 1, 1, 2, 0],
    [2, 1, 1, 2, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 2, 2, 2, 2, 1, 1, 2],
    [2, 1, 1, 2, 3, 3, 2, 1, 1, 2],
    [0, 2, 1, 2, 3, 3, 2, 1, 2, 0],
    [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
    [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
  ];

  const getPixelColor = (value: number) => {
    switch(value) {
      case 1: return colors.secondary; // Yellow
      case 2: return colors.primary;   // Black or Dark
      case 3: return colors.accent;    // Green
      default: return 'transparent';   // Transparent
    }
  };

  return (
    <View style={styles.container}>
      {pixelPattern.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((pixel, colIndex) => (
            <View
              key={`pixel-${rowIndex}-${colIndex}`}
              style={[
                styles.pixel,
                {
                  width: pixelSize,
                  height: pixelSize,
                  backgroundColor: getPixelColor(pixel),
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  pixel: {
    margin: 0.5,
  },
});