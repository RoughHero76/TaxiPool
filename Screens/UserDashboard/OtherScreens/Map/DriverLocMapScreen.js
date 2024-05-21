// /screens/UserDashboard/OtherScreens/Map/DriverLocMapScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API_URL } from '../../../../secrets';
import { firebase } from '@react-native-firebase/auth';

const DriverLocMapScreen = ({ route }) => {
  const navigation = useNavigation();
  const { driverName, driverLocation: initialDriverLocation, pickupLocation, bookingId } = route.params;
  const [driverLocation, setDriverLocation] = useState(initialDriverLocation);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [distance, setDistance] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchDriverLocation = async () => {
      try {
        const token = await firebase.auth().currentUser.getIdToken(true);
        const response = await axios.post(
          `${API_URL}/api/v1/user/driverLocation`,
          {
            bookingId: bookingId,
            pickUpCity: pickupLocation,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const { driverLocation, estimatedTime, distance, routeCoordinates } = response.data.data;
        console.log(response.data);
        setDriverLocation(driverLocation);
        setEstimatedTime(estimatedTime);
        setDistance(distance);
        setRouteCoordinates(routeCoordinates);
      } catch (error) {
        console.error('Error fetching driver location:', error);
        console.log(error.response.data);
      }
    };

    fetchDriverLocation();
    const intervalId = setInterval(fetchDriverLocation, 30000);
    return () => {
      clearInterval(intervalId);
    };
  }, [bookingId, pickupLocation]);

  useEffect(() => {
    if (mapRef.current && driverLocation && pickupLocation && routeCoordinates) {
      const decodedRouteCoordinates = decodePolyline(routeCoordinates);
      const coordinates = [driverLocation, ...decodedRouteCoordinates, pickupLocation];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  }, [driverLocation, pickupLocation, routeCoordinates]);

  const formatDistance = (distance) => {
    return (distance / 1000).toFixed(1);
  };

  // Helper function to decode the polyline coordinates
  const decodePolyline = (polyline) => {
    const points = [];
    let index = 0;
    const len = polyline.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={pickupLocation} title="Pickup Location" />
        {driverLocation && (
          <Marker coordinate={driverLocation}>
            <Image
              source={require('../../../../assets/images/carIcon.png')}
              style={styles.carIcon}
              resizeMode="contain"
            />
          </Marker>
        )}
        {routeCoordinates && (
          <Polyline
            coordinates={decodePolyline(routeCoordinates)}
            strokeColor="blue"
            strokeWidth={3}
          />
        )}
      </MapView>
      <View style={styles.infoContainer}>
        {estimatedTime && <Text style={styles.infoText}>Estimated Time: {estimatedTime} min</Text>}
        {distance && <Text style={styles.infoText}>Distance: {formatDistance(distance)} km</Text>}
      </View>
      <View style={styles.backButton}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color="black"
          onPress={() => navigation.goBack()}
        />
      </View>
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
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: 'black',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
  },
  carIcon: {
    width: 40,
    height: 40,
  },
});

export default DriverLocMapScreen;