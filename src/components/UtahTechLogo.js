import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UtahTechLogo = ({ size = 'medium', showTagline = true, style }) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 120, height: 40 },
          gearSize: 32,
          utahSize: 20,
          mountainSize: 8,
          titleFontSize: 14,
          taglineFontSize: 8,
          spacing: 4,
        };
      case 'large':
        return {
          container: { width: 200, height: 80 },
          gearSize: 60,
          utahSize: 40,
          mountainSize: 16,
          titleFontSize: 24,
          taglineFontSize: 12,
          spacing: 8,
        };
      default: // medium
        return {
          container: { width: 160, height: 60 },
          gearSize: 48,
          utahSize: 32,
          mountainSize: 12,
          titleFontSize: 18,
          taglineFontSize: 10,
          spacing: 6,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container, style]}>
      {/* Logo Graphic */}
      <View style={styles.logoGraphic}>
        {/* Outer Gear */}
        <View style={[
          styles.gear,
          {
            width: sizeStyles.gearSize,
            height: sizeStyles.gearSize,
          }
        ]}>
          {/* Inner Orange Circle */}
          <View style={[
            styles.innerCircle,
            {
              width: sizeStyles.gearSize * 0.6,
              height: sizeStyles.gearSize * 0.6,
            }
          ]}>
            {/* Utah State Silhouette */}
            <View style={[
              styles.utahState,
              {
                width: sizeStyles.utahSize,
                height: sizeStyles.utahSize,
              }
            ]}>
              {/* Mountain Shape */}
              <View style={[
                styles.mountain,
                {
                  width: sizeStyles.mountainSize,
                  height: sizeStyles.mountainSize,
                }
              ]} />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.title,
            { fontSize: sizeStyles.titleFontSize }
          ]}>
            UTAH
          </Text>
          <Text style={[
            styles.title,
            { fontSize: sizeStyles.titleFontSize }
          ]}>
            TECH
          </Text>
        </View>
        {showTagline && (
          <Text style={[
            styles.tagline,
            { 
              fontSize: sizeStyles.taglineFontSize,
              marginTop: sizeStyles.spacing,
            }
          ]}>
            ASSET MANAGEMENT SPECIALISTS
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGraphic: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: {
    backgroundColor: '#34495E',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerCircle: {
    backgroundColor: '#F39C12',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  utahState: {
    backgroundColor: '#1ABC9C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  mountain: {
    backgroundColor: '#F39C12',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    position: 'absolute',
    bottom: 2,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '700',
    color: '#34495E',
    letterSpacing: 1,
    lineHeight: 20,
  },
  tagline: {
    color: '#BDC3C7',
    fontWeight: '400',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
});

export default UtahTechLogo;
