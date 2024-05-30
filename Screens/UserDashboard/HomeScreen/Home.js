import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, PermissionsAndroid, Image, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import { HomeContext } from '../../../Components/Context/HomeContext';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { firebase } from '@react-native-firebase/auth';
import { API_URL } from '../../../secrets';

const HomeScreen = () => {
  const navigate = useNavigation();

  /* Global Context States */
  const { pickupCity, setPickupCity, dropoffCity, setDropoffCity, isLoadingLocation, setIsLoadingLocation } = useContext(HomeContext);
  /* End of Global */

  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyRides, setNearbyRides] = useState([]);

  const [isLoadingRides, setIsLoadingRides] = useState(false);


  const mapRef = useRef(null);

  useEffect(() => {
    let intervalId;

    const checkLocationAndFetchRides = () => {
      if (currentLocation) {
        fetchNearbyRides();
        intervalId = setInterval(fetchNearbyRides, 15000); // Call fetchNearbyRides every 15 seconds
      }
    };

    checkLocationAndFetchRides();

    return () => {
      clearInterval(intervalId);
    };
  }, [currentLocation, fetchNearbyRides]);


  const fetchNearbyRides = async () => {

    try {
      if (currentLocation) {
        const token = await firebase.auth().currentUser.getIdToken(true);
        const response = await axios.get(`${API_URL}/api/v1/user/getNearbyRides`, {
          params: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        });

        setNearbyRides(response.data.data);
      } else {
        console.warn('Current location not available yet');
      }
    } catch (error) {
      if (error.response) {
        console.error('Error fetching nearby rides:', error.response.data.data);
        console.log('Error Nearby Rides:', error.response.data.data);
      } else if (error.request) {

        console.error('Error fetching nearby rides: No response received from server');

      } else {
        console.error('Error fetching nearby rides:', error.message);
      }
    } finally {
      setIsLoadingRides(false);
    }
  };

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
            async (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation({ latitude, longitude });
              // Fetch nearby rides after setting the currentLocation
              fetchNearbyRides();
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
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        500 // Animation duration in milliseconds
      );
    }
  }, [currentLocation]);

  const handleGoButton = () => {
    if (!pickupCity) {
      Toast.show({
        type: 'error',
        position: 'bottom',
        visibilityTime: 2000,
        text1: 'Please fill in the Pickup City',
      });
    } else if (!dropoffCity) {
      Toast.show({
        type: 'error',
        position: 'bottom',
        visibilityTime: 2000,
        text1: 'Please fill in the Dropoff City',
      });
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

  if (isLoadingLocation) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={{ marginTop: 10, color: 'black' }}>Loading location...</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>

      <View style={styles.floatingContainer}>
        <Text style={styles.title}>Taxi Pool</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={handlePickCity}>
            <MaterialCommunityIcons name="map-marker-outline" size={24} color="#333" />
            {pickupCity && pickupCity.address ? (
              <>
                <Text style={styles.optionButtonText} numberOfLines={1} ellipsizeMode="tail">
                  {pickupCity.address.substring(0, 30) + '...'}
                </Text>
                <TouchableOpacity style={styles.clearButton} onPress={() => setPickupCity(null)}>
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
                <Text style={styles.optionButtonText} numberOfLines={1} ellipsizeMode="tail">
                  {dropoffCity.address.substring(0, 30) + '...'}
                </Text>
                <TouchableOpacity style={styles.clearButton} onPress={() => setDropoffCity(null)}>
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
      {isLoadingRides ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={{ marginTop: 10, color: 'black', }}>Loading nearby rides...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          initialRegion={{
            latitude: currentLocation ? currentLocation.latitude : 37.78825,
            longitude: currentLocation ? currentLocation.longitude : -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {nearbyRides.map((ride) => (
            <Marker
              key={ride._id}
              coordinate={{
                latitude: ride.currentLocation.latitude,
                longitude: ride.currentLocation.longitude,
              }}
              title={ride.name}
            >
              <Image
                source={require('../../../assets/images/carIcon.png')}
                style={styles.carIcon}
                resizeMode="contain"
              />
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 4,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  map: {
    flex: 1,
  },
  carIcon: {
    width: 40,
    height: 40,
  },
});

export default HomeScreen;