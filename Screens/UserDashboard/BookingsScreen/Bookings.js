import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";


import OngoingTab from "./OnGoingScreen";
import UpComingTab from "./UpComingScreen";
import CompletedTab from "./CompleteScreen";


const Tab = createMaterialTopTabNavigator();


<>
  <OngoingTab />
  <UpComingTab />
  <CompletedTab />
</>


const Bookings = () => {

  return (
    <Tab.Navigator>
      <Tab.Screen name="Ongoing" component={OngoingTab} />
      <Tab.Screen name="UpComing" component={UpComingTab} />
      <Tab.Screen name="Completed" component={CompletedTab} />
    </Tab.Navigator>
  )
}


export default Bookings;