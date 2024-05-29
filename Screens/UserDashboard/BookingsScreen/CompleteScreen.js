import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import firebase from '@react-native-firebase/app';
import axios from 'axios';
import { API_URL } from '../../../secrets';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';

const CompletedTab = () => {
    const [completedRides, setCompletedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRideIds, setExpandedRideIds] = useState([]);

    useEffect(() => {
        fetchCompletedRides();
    }, []);

    const toggleRideExpanded = (rideId) => {
        if (expandedRideIds.includes(rideId)) {
            setExpandedRideIds(expandedRideIds.filter((id) => id !== rideId));
        } else {
            setExpandedRideIds([...expandedRideIds, rideId]);
        }
    };
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

            <View style={styles.rideHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.rideText} numberOfLines={2} ellipsizeMode="tail">
                        Pickup: {item.dropOffCity.address}
                    </Text>
                    {item.status === 'completed' ? (
                        <Text style={styles.rideTextCompleted} numberOfLines={1} ellipsizeMode="tail">
                            Status: {item.status}
                        </Text>
                    ) : (
                        <Text style={styles.rideTextRejected} numberOfLines={1} ellipsizeMode="tail">
                            Status: {item.status}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => toggleRideExpanded(item._id)}>
                    <View style={styles.iconContainer}>
                        <Icon2
                            name={expandedRideIds.includes(item._id) ? 'expand-less' : 'expand-more'}
                            size={24}
                            color="black"
                        />
                    </View>
                </TouchableOpacity>
            </View>

            {expandedRideIds.includes(item._id) && (
                <View style={styles.rideDetails}>
                    <View
                        style={{
                            marginTop: 5,
                            marginBottom: 5,
                            borderBottomColor: 'black',
                            borderBottomWidth: StyleSheet.hairlineWidth,
                        }}
                    />
                    <Text style={styles.rideText}>Drop-off: {item.dropOffCity.address}</Text>
                    <Text style={styles.rideText}>Distance: {item.distance}</Text>
                    <Text style={styles.rideText}>Estimated Travel Time: {item.estimatedTravelTime} min</Text>
                    {item.status === 'completed' ? (
                        <Text style={styles.rideText}>Driver: {item.driverId.name}</Text>
                    ) : null}

                </View>
            )}
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
    rideTextCompleted: {
        fontSize: 16,
        marginBottom: 4,
        color: 'green',
    },
    rideTextRejected: {
        fontSize: 16,
        marginBottom: 4,
        color: 'red',
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

    /* Headers */
    rideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

    },
    iconContainer: {
        backgroundColor: '#e0e0e0',
        padding: 4,
        borderRadius: 4,
    },
});

export default CompletedTab;