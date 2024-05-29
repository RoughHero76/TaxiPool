import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import firebase from '@react-native-firebase/app';
import { API_URL } from '../../../secrets';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '../../../secrets';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
const OnGoingScreen = () => {


  const navigation = useNavigation();

  const [ongoingRide, setOngoingRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const mapRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchOngoingRide();
    }, [])
  );

  const fetchOngoingRide = async () => {
    try {
      setLoading(true);
      const token = await firebase.auth().currentUser.getIdToken(true);
      const response = await axios.get(`${API_URL}/api/v1/user/getOngoingRide`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOngoingRide(response.data.data[0]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching ongoing ride:', error);
      Toast.show({
        type: 'error',
        text2: 'An error occurred while fetching ongoing ride',
        visibilityTime: 5000,
        style: {
          backgroundColor: '#ff4d4f',
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        text2Style: {
          fontSize: 16,
          fontWeight: 'bold',
          color: 'red',
        },
      });
    }
  };

  const handleReportAnomaly = async () => {
    navigation.navigate('ReportAnomalies', {
      bookingId: ongoingRide._id ? ongoingRide._id : null,
      driverId: ongoingRide.driverId && ongoingRide.driverId._id ? ongoingRide.driverId._id : null,
      vehicleId: ongoingRide.vehicleId ? ongoingRide.vehicleId : null,
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Loading ongoing ride...</Text>
        </View>
      ) : ongoingRide ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            initialRegion={{
              latitude: ongoingRide.pickUpCity.latitude,
              longitude: ongoingRide.pickUpCity.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker coordinate={ongoingRide.pickUpCity} title='Pick Up'>
              <View style={styles.markerContainer}>
                <Icon name="map-marker" size={30} color="green" />
              </View>
            </Marker>
            <Marker coordinate={ongoingRide.dropOffCity} title='Drop Off'>
              <View style={styles.markerContainer}>
                <Icon name="map-marker" size={30} color="red" />
              </View>
            </Marker>
            {ongoingRide.driverId.currentLocation && (
              <>
                <Marker coordinate={ongoingRide.driverId.currentLocation} title='Your Location'>
                  <Image
                    source={require('../../../assets/images/carIcon.png')}
                    style={styles.carIcon}
                    resizeMode="contain"
                  />
                </Marker>
                <MapViewDirections
                  origin={ongoingRide.driverId.currentLocation}
                  destination={ongoingRide.dropOffCity}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={3}
                  strokeColor="green"
                  onReady={(result) => {
                    const { distance, duration } = result;
                    setEstimatedDistance(distance.toFixed(2));
                    setEstimatedTime(Math.ceil(duration));
                  }}
                />
              </>
            )}
          </MapView>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>Distance: {estimatedDistance} km</Text>
            <Text style={styles.detailsText}>Estimated Time: {estimatedTime} min</Text>
            <Text style={styles.detailsText}>Driver: {ongoingRide.driverId.name}</Text>
            <Text style={styles.detailsText}>Phone: {ongoingRide.driverId.phoneNumber}</Text>
            <View style={styles.reoprtButtonContainer}>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={handleReportAnomaly}
              >
                <Text style={styles.reportButtonText}>Report Anomaly</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.noRides}>No ongoing ride found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 10,
    color: 'black',
  },
  map: {
    flex: 1,
  },
  detailsContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 5,
    color: 'black',
  },
  noRides: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: 'black',
  },
  carIcon: {
    width: 40,
    height: 40,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Report Anomaly button */
  reoprtButtonContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  reportButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 10,
  },
  reportButtonText: {
    color: 'white',

    fontSize: 16,
  },
});

export default OnGoingScreen;