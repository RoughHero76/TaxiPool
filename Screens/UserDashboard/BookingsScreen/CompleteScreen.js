import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, FlatList, Image, StyleSheet, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { BookingStyles } from './BookingGlobalStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { onSnapshot } from '@react-native-firebase/firestore';

const CompletedTab = () => {
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCompletedBookings([]);
    setRefreshing(false);

    const fetchCompletedBookings = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const completedBookingsQuery = firestore()
            .collection('userBookings')
            .where('userUid', '==', currentUser.uid)
            .where('status', '==', 'completed');

          const unsubscribe = onSnapshot(completedBookingsQuery, (querySnapshot) => {
            const fetchedCompletedBookings = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setCompletedBookings(fetchedCompletedBookings);
          });

          // Clean up the listener when the component unmounts
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error fetching completed bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedBookings();
  }, []);

  const handleReload = () => {
    setRefreshing(true);
  };

  const renderCompletedBooking = ({ item }) => (
    <ScrollView>
      <View style={styles.mainContainer}>
        <View style={styles.card}>
          <View style={styles.detailsContainer}>
            <Text style={styles.name}>{item.vehicleName}</Text>
            <Text style={styles.details}>Pickup Date: {item.pickupDate}</Text>
            <Text style={styles.details}>Pickup Time: {item.pickTime}</Text>
            <Text style={styles.details}>Drop-off Date: {item.dropOffDate}</Text>
            <Text style={styles.details}>Drop-off Time: {item.dropTime}</Text>
            <Text style={styles.price}>Price: {item.price}</Text>
            <Text style={styles.details}>Rented Hours: {item.rentedHours}</Text>
          </View>
          <Image source={{ uri: item.vehicleImage }} style={styles.image} />
         
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={BookingStyles.container}>
      {loading ? (
        <Text>Loading...</Text>
      ) : completedBookings.length === 0 ? (
        <>
          <Text style={BookingStyles.message}>No Completed Bookings</Text>
          <TouchableOpacity onPress={handleReload} style={BookingStyles.button}>
            <Text style={BookingStyles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={completedBookings}
          renderItem={renderCompletedBooking}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

export default CompletedTab;

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
    borderBottomWidth: 1,
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
    marginBottom: 2,
  },

});