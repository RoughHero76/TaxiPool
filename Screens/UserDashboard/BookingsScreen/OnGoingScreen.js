import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, FlatList, Image, Alert, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { BookingStyles } from './BookingGlobalStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const OnGoingScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigation();

  useEffect(() => {
    setBookings([]);
    setRefreshing(false);

    const fetchBookings = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const bookingsQuery = await firestore()
            .collection('userBookings')
            .where('userUid', '==', currentUser.uid)
            .where('status', '==', 'active')
            .get();
          const fetchedBookings = bookingsQuery.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setBookings(fetchedBookings);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [refreshing]);

  const handleReload = () => {
    setRefreshing(true);
  };

  const handleHelp = (bookingId) => {

    console.log('Help requested for booking:', bookingId);

    navigate.navigate('CustomerSupport');


  };

  const handleSOS = (bookingId) => {
    // Implement logic for handling SOS request
    console.log('SOS requested for booking:', bookingId);
  };

  const calculateRemainingHours = (endTime) => {
    const currentTime = new Date().getTime();
    const remainingMilliseconds = new Date(endTime).getTime() - currentTime;
    const remainingHours = Math.floor(remainingMilliseconds / (1000 * 60 * 60));
    return remainingHours;
  };

  const renderBooking = ({ item }) => {
    const endTime = new Date(`${item.dropOffDate} ${item.dropTime}`).getTime();
    const remainingHours = calculateRemainingHours(endTime);

    return (
      <View style={styles.mainContainer}>
        <View style={styles.card}>
          <View style={styles.detailsContainer}>
            <Text style={styles.name}>{item.vehicleName}</Text>
            <Text style={styles.details}>
              Pickup Date: {item.pickupDate}
            </Text>
            <Text style={styles.details}>
              Pickup Time: {item.pickTime}
            </Text>
            <Text style={styles.details}>
              Drop-off Date: {item.dropOffDate}
            </Text>
            <Text style={styles.details}>
              Drop-off Time: {item.dropTime}
            </Text>
            <Text style={styles.price}>Price: {item.price}</Text>
            <Text style={styles.details}>
              Rented Hours: {item.rentedHours}
            </Text>

          </View>
          <Image source={{ uri: item.vehicleImage }} style={styles.image} />
          <View >
            <TouchableOpacity onPress={handleReload} >
              <Icon name="refresh" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleHelp(item.id)}
            style={styles.helpButton}
          >
            <Text style={styles.buttonText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSOS(item.id)}
            style={styles.sosButton}
          >
            <Text style={styles.buttonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={BookingStyles.container}>
      {loading ? (
        <Text>Loading...</Text>
      ) : bookings.length === 0 ? (
        <>
          <Text style={BookingStyles.message}>No Ongoing Bookings</Text>
          <TouchableOpacity onPress={handleReload} style={BookingStyles.button}>
            <Text style={BookingStyles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList data={bookings} renderItem={renderBooking} keyExtractor={(item) => item.id} />
      )}
    </View>
  );
};

export default OnGoingScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  card: {
    flexDirection: 'row',
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 2,
    elevation: 2,
  },
  detailsContainer: {
    flex: 1,
    padding: 10,
  },
  image: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: 'black',
  },
  price: {
    color: 'green',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  helpButton: {
    backgroundColor: 'orange',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  sosButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});