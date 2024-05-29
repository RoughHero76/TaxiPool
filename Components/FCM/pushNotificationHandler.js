// TaxiPool\Components\FCM\pushNotificationHandler.js
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { API_URL } from '../../secrets';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebase } from '@react-native-firebase/auth';

const sendDriverNotifications = async (bookingId) => {
  try {
    console.log('Sending driver notifications for bookingId:', bookingId);
    const response = await axios.post(`${API_URL}/api/v1/driver/searchingDriver`, { bookingId },
      {
        headers: {
          Authorization: `Bearer ${await firebase.auth().currentUser.getIdToken(true)}`,
        },
        timeout: 10000,
      }
    );
    console.log('API response:', response.data);
    if (response.data.status === 'success') {
      console.log('Driver notifications sent successfully.');
      await AsyncStorage.setItem(bookingId, JSON.stringify({ foundDrivers: true }));
    } else {
      console.error('Error sending driver notifications:', response.data.message);
      if (response.data.message === 'No driver found') {
        Alert.alert('Booking Update Error', `For your Booking: ${bookingId} No nearby driver can be found. You can try again in Upcoming Bookings.`);
        await AsyncStorage.setItem(bookingId, JSON.stringify({ foundDrivers: false }));
      }
    }
  } catch (error) {
    console.error('Error sending driver notifications:', error);
    if (error.response && error.response.data.message === 'No driver found') {
      Alert.alert('Booking Update Error', `For your Booking: ${bookingId} No nearby driver can be found. You can try again in Upcoming Bookings.`);
      await AsyncStorage.setItem(bookingId, JSON.stringify({ foundDrivers: false }));
    }
  }
};

const handleBookingStatusUpdate = (bookingId, status) => {
  let bookingStatus = '';
  if (status === 'searchingRide') {
    bookingStatus = 'Looking for nearby drivers!';
    sendDriverNotifications(bookingId);
  } else if (status === 'pending') {
    bookingStatus = 'Your booking is pending. Please wait for admin approval.';
  } else {
    bookingStatus = `Status: ${status}`;
  }
  // Display an alert or pop-up notification
  Alert.alert(
    'Booking Status Updated',
    `Your booking ${bookingId} status has been updated to ${bookingStatus}`,
    [
      {
        text: 'OK',
        onPress: () => {
          // Handle the OK button press if needed
        },
      },
    ],
    { cancelable: false }
  );
};

// Set up a listener for incoming FCM messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  try {
    console.log('Message handled in the background!', remoteMessage);
    // Handle the received data payload
    const { data } = remoteMessage;
    if (data.type === 'booking_status_update') {
      const { bookingId, status } = data;
      handleBookingStatusUpdate(bookingId, status);
    }
  } catch (error) {
    console.error('Error handling background message:', error);
  }
});

// Set up a listener for when the user taps on a notification
messaging().onNotificationOpenedApp(async (remoteMessage) => {
  try {
    console.log('Notification opened app:', remoteMessage);
    // Handle the received data payload
    const { data } = remoteMessage;
    if (data.type === 'booking_status_update') {
      const { bookingId, status } = data;
      handleBookingStatusUpdate(bookingId, status);
    }
  } catch (error) {
    console.error('Error handling notification opened app:', error);
  }
});

// Set up a listener for incoming FCM messages in the foreground
messaging().onMessage(async (remoteMessage) => {
  try {
    console.log('Message received in the foreground!', remoteMessage);
    // Handle the received data payload
    const { data } = remoteMessage;
    if (data.type === 'booking_status_update') {
      const { bookingId, status } = data;
      handleBookingStatusUpdate(bookingId, status);
    }
  } catch (error) {
    console.error('Error handling foreground message:', error);
  }
});

// Set up a listener for when the app is opened from a terminated state
messaging().getInitialNotification().then((notificationData) => {
  if (notificationData) {
    // Handle the notification data when the app is opened from a terminated state
    console.log('Notification data received when app was closed:', notificationData);
    const { data } = notificationData;
    if (data.type === 'booking_status_update') {
      const { bookingId, status } = data;
      handleBookingStatusUpdate(bookingId, status);
    }
  }
});