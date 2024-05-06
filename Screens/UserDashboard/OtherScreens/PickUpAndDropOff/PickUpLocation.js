// PickUpLocation.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from 'react-native-geolocation-service';
import { useRoute, useNavigation } from '@react-navigation/native';
import { HomeContext } from '../../../../Components/Context/HomeContext';
import Toast from 'react-native-toast-message';

const GOOGLE_API_KEY = 'AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA';

const PickUpLocation = () => {
  const navigate = useNavigation();
  const route = useRoute();
  const returnedLocation = route.params?.location || null;

  const { setPickupCity } = useContext(HomeContext);

  const [userPickUpAddress, setUserPickUpAddress] = useState(null);
  const [loading, setLoading] = useState({
    currentLocation: false,
    openMap: false,
    fetchingAddress: false,
  });

  useEffect(() => {
    if (returnedLocation) {
      const { latitude, longitude } = returnedLocation;
      setLoading({ ...loading, fetchingAddress: true });
      fetchAddressFromCoordinates(latitude, longitude);
    }
  }, [returnedLocation]);

  const fetchAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();
      if (data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setUserPickUpAddress({ address, latitude, longitude });
      } else {
        setUserPickUpAddress({ address: '', latitude, longitude });
      }
    } catch (error) {
      console.log('Error fetching address:', error);
      setUserPickUpAddress({ address: '', latitude, longitude });
    } finally {
      setLoading({ ...loading, fetchingAddress: false });
    }
  };

  const handleCurrentGeoLocation = async () => {
    try {
      setLoading({ ...loading, currentLocation: true });
      const granted = await requestLocationPermission();
      if (granted) {
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchAddressFromCoordinates(latitude, longitude);
            setLoading({ ...loading, currentLocation: false });
          },
          (error) => {
            console.log('Error getting location:', error);
            setLoading({ ...loading, currentLocation: false });
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 10000,
          },
        );
      } else {
        setLoading({ ...loading, currentLocation: false });
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      setLoading({ ...loading, currentLocation: false });
    }
  };

  const handleSetLocationOnMap = async () => {
    try {
      setLoading({ ...loading, openMap: true });
      const granted = await requestLocationPermission();
      if (granted) {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const currentScreen = 'PickUpLocation';
            navigate.navigate('MapScreen', {
              initialRegion: { latitude, longitude },
              originScreen: currentScreen,
            });
            setLoading({ ...loading, openMap: false });
          },
          (error) => {
            console.log(error);
            setLoading({ ...loading, openMap: false });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        setLoading({ ...loading, openMap: false });
      }
    } catch (err) {
      console.log(err);
      setLoading({ ...loading, openMap: false });
    }
  };
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  };

  const handleConfirmLocation = () => {
    if (userPickUpAddress) {
      setPickupCity(userPickUpAddress);
      navigate.navigate('NavigationScreen');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Please select a location',
        visibilityTime: 4000,
      })
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.heading}>Search Location</Text>
        <GooglePlacesAutocomplete
          renderLeftButton={() => (
            <MaterialCommunityIcons name="magnify" size={24} color="black" style={styles.searchIcon} />
          )}
          placeholder="Enter your location"
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details && details.geometry && details.geometry.location) {
              const { lat, lng } = details.geometry.location;
              setUserPickUpAddress({ address: data.description, latitude: lat, longitude: lng });
            } else {
              setUserPickUpAddress({ address: data.description, latitude: null, longitude: null });
            }
          }}
          query={{
            key: GOOGLE_API_KEY,
            language: 'en',
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.inputContainer,
            textInput: styles.input,
            listView: styles.listView,
            row: styles.row,
            description: styles.description,
          }}
        />
        <ScrollView>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleCurrentGeoLocation}
              disabled={loading.currentLocation}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#333" />
              {loading.currentLocation ? (
                <>
                  <ActivityIndicator size="small" color="#333" />
                  <Text style={styles.buttonText}>Please Wait...</Text>
                </>
              ) : (
                <Text style={styles.buttonText}>Current Location</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSetLocationOnMap}
              disabled={loading.openMap}
            >
              <MaterialCommunityIcons name="map-outline" size={24} color="#333" />
              {loading.openMap ? (
                <>
                  <ActivityIndicator size="small" color="#333" />
                  <Text style={styles.buttonText}>Please Wait...</Text>
                </>
              ) : (
                <Text style={styles.buttonText}>Open Map</Text>
              )}
            </TouchableOpacity>
          </View>
          {loading.fetchingAddress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#333" />
              <Text style={styles.loadingText}>Please Wait...</Text>
            </View>
          ) : (
            <>
              {userPickUpAddress && (
                <View style={styles.addressContainer}>
                  <Text style={styles.addressText}>{`Pick Up Location: ${userPickUpAddress.address}`}</Text>
                  <Text style={styles.addressText}>{`Latitude: ${userPickUpAddress.latitude}, Longitude: ${userPickUpAddress.longitude}`}</Text>
                </View>
              )}
              {userPickUpAddress?.latitude && userPickUpAddress?.longitude && (
                <Image
                  style={styles.mapImage}
                  source={{
                    uri: `https://maps.googleapis.com/maps/api/staticmap?center=${userPickUpAddress.latitude},${userPickUpAddress.longitude}&zoom=18&size=500x500&markers=color:red%7C${userPickUpAddress.latitude},${userPickUpAddress.longitude}&key=${GOOGLE_API_KEY}`,
                  }}
                />
              )}
            </>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  autocompleteContainer: {
    flex: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  searchIcon: {
    alignSelf: 'center',
    marginRight: 0,
  },
  input: {
    color: 'black',
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginTop: 10,
    elevation: 2,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  description: {
    fontSize: 16,
    color: '#333',
  },
  buttonsContainer: {
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
    marginRight: 10,
  },
  addressContainer: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  mapImage: {
    width: 'auto',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    justifyContent: 'space-between',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },

  confirmButton: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 20,
    marginTop: 16,
    alignItems: 'center',
    
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PickUpLocation;