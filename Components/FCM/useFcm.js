import { useEffect, useState } from 'react';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

const useFcm = () => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
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

    requestFcmToken();
  }, []);

  return fcmToken;
};

export default useFcm;