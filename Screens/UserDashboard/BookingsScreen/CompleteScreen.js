import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import firebase from '@react-native-firebase/app';
import axios from 'axios';
import { API_URL } from '../../../secrets';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CompletedTab = () => {
    const [completedRides, setCompletedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCompletedRides();
    }, []);

    const fetchCompletedRides = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await firebase.auth().currentUser.getIdToken(true);
            const response = await axios.get(`${API_URL}/api/v1/user/getCompletedRide`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setCompletedRides(response.data.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching completed rides:', error);
            setLoading(false);
            if (error.message.includes('Network Error')) {
                setError('No internet connection. Please check your network settings.');
            } else if (error.response && error.response.status >= 500) {
                setError('The server is currently unavailable. Please try again later.');
            } else {
                setError('An error occurred while fetching completed rides. Please try again.');
            }
        }
    };

    const renderCompletedRide = ({ item }) => (
        <View style={styles.rideContainer}>
            <View style={styles.rideDetails}>
                <Text style={styles.rideText}>Pickup: {item.pickUpCity.address}</Text>
                <Text style={styles.rideText}>Drop-off: {item.dropOffCity.address}</Text>
                <Text style={styles.rideText}>Distance: {item.distance}</Text>
                <Text style={styles.rideText}>Estimated Travel Time: {item.estimatedTravelTime} min</Text>
                <Text style={styles.rideText}>Driver: {item.driverId.name}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text style={styles.loadingText}>Loading completed rides...</Text>
            ) : error ? (
                <View style={styles.noRidesContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={fetchCompletedRides}>
                        <Icon name="refresh" size={24} color="black" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : completedRides.length > 0 ? (
                <View>
                    <TouchableOpacity style={styles.refreshButton} onPress={fetchCompletedRides}>
                        <Icon name="refresh" size={24} color="black" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                    <FlatList
                        data={completedRides}
                        renderItem={renderCompletedRide}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContainer}
                    />
                </View>
            ) : (
                <View style={styles.noRidesContainer}>
                    <Text style={styles.noRides}>No completed rides found.</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={fetchCompletedRides}>
                        <Icon name="refresh" size={24} color="black" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    listContainer: {
        paddingBottom: 16,
    },
    rideContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 5,
    },
    rideDetails: {
        marginBottom: 8,
    },
    rideText: {
        fontSize: 16,
        marginBottom: 4,
        color: 'black',
    },
    loadingText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
        color: 'black',
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
        color: 'red',
    },
    noRidesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noRides: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 16,
        color: 'black',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: 10,
        borderRadius: 8,
    },
    refreshButtonText: {
        color: 'black',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default CompletedTab;