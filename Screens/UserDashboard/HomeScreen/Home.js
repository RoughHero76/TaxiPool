import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, PermissionsAndroid } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import cardBackgroundImage from '../../../assets/images/backgroundCard.jpg';
import Accordion from './Faq';
import VehicleCard from './VehicleCard';
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import { HomeContext } from '../../../Components/Context/HomeContext';

const HomeScreen = () => {
  const navigate = useNavigation();

  /* Global Context States */

  const { pickupCity, setPickupCity, dropoffCity, setDropoffCity } = useContext(HomeContext);

  /* End of Global */

  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    console.log('Pick Up City:', pickupCity);
    console.log('Drop Off City:', dropoffCity);
  }, [pickupCity, dropoffCity]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          Geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;

              setCurrentLocation({ latitude, longitude });
            },
            (error) => {
              console.log('Error getting location:', error);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 10000,
            }
          );
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn('Error requesting location permission:', err);
      }
    };

    getCurrentLocation();
  }, []);

  const handleGoButton = () => {
    if (!pickupCity) {
      Toast.show({
        type: 'error',
        position: 'bottom',
        visibilityTime: 2000,
        text1: 'Please fill in the Pickup City',
      })

    } else if (!dropoffCity) {
      Toast.show({
        type: 'error',
        position: 'bottom',
        visibilityTime: 2000,
        text1: 'Please fill in the Dropoff City',
      })

    } else {
      navigate.navigate('TripDetails', { pickupCity, dropoffCity });
    }
  };

  const handlePickCity = () => {
    navigate.navigate('PickUpLocation', { currentLocation });
  };

  const handleDropCity = () => {
    navigate.navigate('DropOffLocation', { currentLocation });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.floatingContainer}>
          <Text style={styles.title}>Taxi Pool</Text>
          <View style={styles.optionsContainer}><TouchableOpacity style={styles.optionButton} onPress={handlePickCity}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
            {pickupCity && pickupCity.address ? (
              <>
                <Text
                  style={styles.optionButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {pickupCity.address.substring(0, 30) + '...'}
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setPickupCity(null)}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.optionButtonText}>Choose pick-up location</Text>
            )}
          </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={handleDropCity}>
              <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
              {dropoffCity && dropoffCity.address ? (
                <>
                  <Text
                    style={styles.optionButtonText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {dropoffCity.address.substring(0, 30) + '...'}
                  </Text>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setDropoffCity(null)}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.optionButtonText}>Choose drop-off location</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleGoButton}>
            <Text style={styles.buttonText}>Go</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <VehicleCard imageSource={cardBackgroundImage} title="Flexible Start & End Points" icon="car" />
            <VehicleCard imageSource={cardBackgroundImage} title="Zero Security Depsoit" icon="motorbike" />
            <VehicleCard imageSource={cardBackgroundImage} title="Doorstep Delivery" icon="motorbike" />
            <VehicleCard imageSource={cardBackgroundImage} title="With Fuel / Without Fuel" icon="motorbike" />
          </ScrollView>
        </View>
        <View style={styles.container}>
          <Accordion />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
  },
  optionsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  optionButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
  },
  button: {
    backgroundColor: 'black',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  cardsContainer: {

    marginTop: 20,
    marginBottom: 10,
    height: 140,
  },
});

export default HomeScreen;