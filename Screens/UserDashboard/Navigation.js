import { useEffect } from "react";
import Home from "./HomeScreen/Home";
import Bookings from "./BookingsScreen/Bookings";
import More from "./MoreScreen/More";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import auth, { firebase } from '@react-native-firebase/auth';
import axios from "axios";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../../secrets";

//Notification Services
import useFcm from "../../Components/FCM/useFcm";

const BottomTab = createBottomTabNavigator();

const NavigationScreen = () => {


    const fcmToken = useFcm();

    const navigate = useNavigation();

    useEffect(() => {
        const handleSendTokenToAPI = async () => {
            let retries = 0;
            const maxRetries = 3;
            const retryDelay = 2000; // 2 seconds

            const verifyToken = async () => {
                try {
                    console.log('UseEffect is running in Navigation...');
                    const token = await firebase.auth().currentUser.getIdToken(true);
                    console.log('User Token', token);
                    const response = await axios.post(
                        `${API_URL}/api/v1/auth/verify-token`,
                        null,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            timeout: 5000,
                        }
                    );
                    if (response.data.status === 'success') {
                        Toast.show({
                            position: 'top',
                            type: 'success',
                            text1: 'You have successfully Logged In',
                        });
                    } else {
                        console.log('Token verification response:', response.data);
                        Toast.show({
                            position: 'top',
                            type: 'error',
                            visibilityTime: 4000,
                            text1: 'Verification failed. Please try again.',
                        });
                        navigate.navigate('Login');
                    }
                    console.log('Token verification response:', response.data);
                } catch (error) {
                    console.error('Error verifying token:', error);
                    if (error.response) {
                        console.log('Server responded with an error:', error.response.data);
                        Toast.show({
                            position: 'top',
                            type: 'error',
                            visibilityTime: 4000,
                            text1: 'Server responded with an error. Please try again later.',
                        });
                    } else if (error.request) {
                        console.log('No response received from the server');
                        Toast.show({
                            position: 'top',
                            type: 'error',
                            visibilityTime: 4000,
                            text1: 'No response received from the server. Trying again...',
                        })
                        retries++;
                        if (retries < maxRetries) {
                            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                            Toast.show({
                                position: 'top',
                                type: 'error',
                                visibilityTime: 4000,
                                text1: `No response from server, Retrying in ${retryDelay / 1000} seconds...`,
                            })
                            setTimeout(verifyToken, retryDelay);
                        } else {
                            Toast.show({
                                position: 'top',
                                type: 'error',
                                visibilityTime: 4000,
                                text1: 'No response from the server. Please check your internet connection.',
                            });
                        }
                    } else {
                        console.log('Error:', error.message);
                        console.log('Error details:', error);
                        Toast.show({
                            position: 'top',
                            type: 'error',
                            visibilityTime: 4000,
                            text1: 'An error occurred. Please try again later.',
                        });
                    }
                }
            };

            verifyToken();
        };

        handleSendTokenToAPI();
    }, []);

    useEffect(() => {
        if (fcmToken) {
            storeTokenInBackend(fcmToken);
        }
    }, [fcmToken]);

    const storeTokenInBackend = async (fcmToken) => {
        try {
            const token = await firebase.auth().currentUser.getIdToken(true);
            const response = await axios.post(
                `${API_URL}/api/v1/auth/updateUserFcmToken`,
                { fcmToken: fcmToken },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 5000,
                }
            );
            console.log('Token stored in backend');
        } catch (error) {
            console.log('Error storing token in backend:', error.message);

        }
    }


    return (
        <BottomTab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#1A4333',
                tabBarStyle: [
                    {
                        height: 60,
                        display: 'flex',
                    },
                    null,
                ],
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 6,
                    fontWeight: '600',
                },
                tabBarIconStyle: {
                    marginTop: 7,
                }
            }}
        >
            <BottomTab.Screen
                name="Home"
                component={Home}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size, focused }) => {
                        return (
                            <MaterialCommunityIcons
                                name={focused ? 'home-circle' : 'home-circle-outline'}
                                color={color}
                                size={30}
                            />
                        );
                    },
                }}
            />
            <BottomTab.Screen
                name="Booking"
                component={Bookings}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size, focused }) => {
                        return (
                            <MaterialCommunityIcons
                                name={focused ? 'steering' : 'steering'}
                                color={color}
                                size={30}
                            />
                        );
                    },
                }}
            />
            <BottomTab.Screen
                name="More"
                component={More}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size, focused }) => {
                        return (
                            <MaterialCommunityIcons
                                name={focused ? 'more' : 'more'}
                                color={color}
                                size={30}
                            />
                        );
                    },
                }}
            />
        </BottomTab.Navigator>
    );
};

export default NavigationScreen;