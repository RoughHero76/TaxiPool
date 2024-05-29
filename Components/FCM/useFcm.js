import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

const useFcm = () => {
  const [fcmToken, setFcmToken] = useState(null);

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
      requestFcmToken();
    });
  }, []);

  return fcmToken;
};

export default useFcm;