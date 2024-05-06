import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, PermissionsAndroid, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';

const GOOGLE_API_KEY = 'AIzaSyCYwHNeqOW-oeSSex-b-vqUyZb3vWcWxVA';

const MapScreen = ({ navigation, route }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [middlePointAddress, setMiddlePointAddress] = useState('');
  const [loading, setLoading] = useState({ location: false, address: false });

  const mapViewRef = useRef(null);

  useEffect(() => {
    const { initialRegion } = route.params || {};
    if (initialRegion) {
      setInitialRegion({
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [route.params]);

  const handleMapPress = () => {
    if (mapViewRef.current) {
      mapViewRef.current.getCamera().then((camera) => {
        const { center } = camera;
        setSelectedLocation(center);
        fetchMiddlePointAddress(center.latitude, center.longitude);
      });
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      const { originScreen } = route.params; 
      navigation.navigate(originScreen, { location: selectedLocation });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Please select a location',
        visibilityTime: 4000,
      });
    }
  };

  const handleUserLocation = async () => {
    try {
      setLoading({ ...loading, location: true });
      const granted = await requestLocationPermission();
      if (granted) {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setInitialRegion({
              latitude,
              longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
            animateToLocation(latitude, longitude);
            setLoading({ ...loading, location: false });
          },
          (error) => {
            console.log(error);
            setLoading({ ...loading, location: false });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        setLoading({ ...loading, location: false });
      }
    } catch (err) {
      console.log(err);
      setLoading({ ...loading, location: false });
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const animateToLocation = (latitude, longitude) => {
    if (mapViewRef.current) {
      mapViewRef.current.animateCamera(
        {
          center: {
            latitude,
            longitude,
          },
          zoom: 15,
        },
        { duration: 1000 },
      );
    }
  };

  const toggleMapType = () => {
    setMapType((prevMapType) => (prevMapType === 'standard' ? 'satellite' : 'standard'));
  };

  const fetchMiddlePointAddress = (latitude, longitude) => {
    setLoading({ ...loading, address: true });
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.results.length > 0) {
          const address = data.results[0].formatted_address;
          setMiddlePointAddress(address);
        }
        setLoading({ ...loading, address: false });
      })
      .catch((error) => {
        console.log(error);
        setLoading({ ...loading, address: false });
      });
  };

  const handlePlaceSelect = (data) => {
    if (data.place_id) {
      fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${data.place_id}&key=${GOOGLE_API_KEY}`)
        .then((response) => response.json())
        .then((placeDetails) => {
          if (placeDetails.result && placeDetails.result.geometry && placeDetails.result.geometry.location) {
            const { location } = placeDetails.result.geometry;
            setSelectedLocation(location);
            fetchMiddlePointAddress(location.lat, location.lng);
            animateToLocation(location.lat, location.lng);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  return (
    <View style={styles.container}>
      {initialRegion && (
        <MapView
          ref={mapViewRef}
          style={styles.map}
          initialRegion={initialRegion}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onRegionChangeComplete={handleMapPress}
        />
      )}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search"
          onPress={handlePlaceSelect}
          query={{
            key: GOOGLE_API_KEY,
            language: 'en',
          }}
          styles={{
            textInputContainer: styles.textInputContainer,
            textInput: styles.textInput,
          }}
          renderLeftButton={() => (
            <MaterialCommunityIcons name="magnify" size={24} color="black" style={styles.searchIcon} />
          )}
        />
      </View>
      <View style={styles.markerContainer}>
        <View style={styles.markerImageContainer}>
          <Image source={require('../../../../assets/images/marker.png')} style={styles.markerImage} resizeMode="contain" />
        </View>
      </View>
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.topButton} onPress={handleUserLocation}>
          {loading.location ? (
            <ActivityIndicator size="small" color="black" />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={24} color="black" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.topButton} onPress={toggleMapType}>
          <MaterialCommunityIcons name={mapType === 'standard' ? 'map' : 'satellite'} size={24} color="black" />
        </TouchableOpacity>
      </View>
      {middlePointAddress !== '' && (
        <View style={styles.addressContainer}>
          {loading.address ? (
            <ActivityIndicator size="small" color="black" />
          ) : (
            <Text style={styles.addressText}>{middlePointAddress}</Text>
          )}
        </View>
      )}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
        <Text style={styles.confirmButtonText}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    marginLeft: 10,
  },
  searchIcon: {
    marginRight: 0,
  },
  markerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.6 }],
  },
  markerImage: {
    width: 64,
    height: 64,
  },
  topButtonsContainer: {
    flexDirection: 'column',
    position: 'absolute',
    top: 20,
    right: 7,
    marginTop: 60,
  },
  topButton: {
    backgroundColor: 'white',
    opacity: 0.7,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: 'black',
    padding: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
  },
  addressContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  addressText: {
    fontSize: 16,
    color: 'black',
  },
});

export default MapScreen;