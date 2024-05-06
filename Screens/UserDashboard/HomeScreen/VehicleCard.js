import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.7;
const cardHeight = cardWidth * 0.4;
const iconSize = cardHeight * 0.6;
const titleSize = cardHeight * 0.2;

const VehicleCard = ({ imageSource, title, icon }) => {
  return (
    <View style={styles.cardContainer}>
      <Image source={imageSource} style={styles.cardImage} />
      <View style={styles.contentContainer}>
        <Text style={[styles.cardTitle, { fontSize: titleSize, flex: 1 }]}>{title}</Text>
        <MaterialCommunityIcons name={icon} size={iconSize} color="white" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    width: cardWidth,
    height: cardHeight,
    marginHorizontal: 10,
    elevation: 4,
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: 'white',
    display: 'flex',
    marginRight: 'auto',
  },
});

export default VehicleCard;