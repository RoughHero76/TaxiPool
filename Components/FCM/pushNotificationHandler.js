// TaxiPool\\Components\\FCM\\pushNotificationHandler.js
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import { Alert } from 'react-native';

// Set up a listener for incoming FCM messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  try {
    console.log('Message handled in the background!', remoteMessage);
    // Handle the received data payload
    const { data } = remoteMessage;
    if (data.type === 'booking_status_update') {
      const { bookingId, status } = data;
      let bookingStatus = '';
      if (status === 'searchingRide') {
        bookingStatus = 'Looking for nearby drivers!';
      } else if (status === 'pending') {
        bookingStatus = 'Your booking is pending. Please wait for admin approval.';
      } else {
        bookingStatus = `Status: ${status}`;
      }
      // Display a local notification
      const notificationOptions = {
        title: 'Booking Status Updated',
        body: `Your booking ${bookingId} status has been updated to ${bookingStatus}`,
        // Additional options for customizing the notification
      };
      // Display the notification
      await firebase.notifications().displayNotification(notificationOptions);
    }
  } catch (error) {
    console.error('Error handling background message:', error);
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
      let bookingStatus = '';
      if (status === 'searchingRide') {
        bookingStatus = 'Looking for nearby drivers!';
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
      // You can also update the UI here, for example:
      // Update the booking status in the relevant component or state
      // Navigate to a specific screen if needed
    }
  } catch (error) {
    console.error('Error handling foreground message:', error);
  }
});

// Set up a listener for when the app is opened from a terminated state
firebase.messaging().onNotificationOpenedApp((notificationData) => {
  // Handle the notification data when the app is opened from a terminated state
  console.log('Notification data received when app was closed:', notificationData);
});