import { useEffect, useState, useContext } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { HomeContext } from '../Context/HomeContext';
import Geolocation from 'react-native-geolocation-service';

const useFcm = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const { setIsLoadingLocation } = useContext(HomeContext);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
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
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          // Additional logic for handling location if needed
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn('Error requesting location permission:', err);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    const requestFcmToken = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === firebase.messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === firebase.messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          const fcmToken = await messaging().getToken();
          setFcmToken(fcmToken);
        } else {
          console.log('FCM permission denied');
        }
      } catch (error) {
        console.error('Error requesting FCM token:', error);
      }
    };

    requestNotificationPermission().then(() => {
      requestLocationPermission().then(() => {
        requestFcmToken();
      });
    });
  }, []);

  return fcmToken;
};

export default useFcm;