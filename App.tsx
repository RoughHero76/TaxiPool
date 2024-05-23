
import React from "react";
import Toast from "react-native-toast-message";
//Push Notification
import './Components/FCM/pushNotificationHandler';

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

//Context

import { HomeProvider } from "./Components/Context/HomeContext"


//Login
import LoginScreen from "./Screens/Login/LoginSreens/LoginScren";

//PickUp and Drop Off location
import PickUpLocation from "./Screens/UserDashboard/OtherScreens/PickUpAndDropOff/PickUpLocation";
import DropOffLocation from "./Screens/UserDashboard/OtherScreens/PickUpAndDropOff/DropOffLocation";

//Select On Map
import MapScreen from "./Screens/UserDashboard/OtherScreens/Map/MapScreen";

//Navigation Screen
import NavigationScreen from './Screens/UserDashboard/Navigation'
//User Profile
import UserProfile from "./Screens/UserDashboard/OtherScreens/Profile/UserProfile";
//Customer Support
import SupportScreen from "./Screens/UserDashboard/OtherScreens/CustomerSupport/CustomerSuppport";

//Trip Details Screen for Booking
import TripDetails from "./Screens/OtherScreens/TripDetails";

//Driver Live Location MAP
import DriverLocMapScreen from "./Screens/UserDashboard/OtherScreens/Map/DriverLocMapScreen";

const Stack = createNativeStackNavigator();

const App = () => {
  return (

    <HomeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">


          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />




          <Stack.Screen
            name="NavigationScreen"
            component={NavigationScreen
            }
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="PickUpLocation"
            component={PickUpLocation
            }
            options={{
              headerShown: true,
              headerTitle: 'Pick Up Location',
            }}
          />

          <Stack.Screen
            name="DropOffLocation"
            component={DropOffLocation
            }
            options={{
              headerShown: true,

            }}
          />


          <Stack.Screen
            name="MapScreen"
            component={MapScreen
            }
            options={{
              headerShown: true,
              headerTitle: 'Map',
            }}
          />

          <Stack.Screen
            name="DriverLocMapScreen"
            component={DriverLocMapScreen
            }
            options={{
              headerShown: true,
              headerTitle: 'Map',
            }}
          />

          <Stack.Screen
            name="TripDetails"
            component={TripDetails
            }
            options={{
              headerShown: true,
              headerTitle: 'Trip Details',
            }}
          />

          <Stack.Screen
            name="UserProfile"
            component={UserProfile
            }
            options={{
              headerShown: true,
              headerTitle: 'Profile',
            }}
          />

          <Stack.Screen
            name="SupportScreen"
            component={SupportScreen
            }
            options={{
              headerShown: true,
              headerTitle: 'Support',
            }}
          />




        </Stack.Navigator>

        <Toast />
      </NavigationContainer>

    </HomeProvider>



  );
};

export default App;