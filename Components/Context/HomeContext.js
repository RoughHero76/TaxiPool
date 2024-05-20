// HomeContext.js
import React, { createContext, useState } from 'react';

export const HomeContext = createContext();

export const HomeProvider = ({ children }) => {
  const [pickupCity, setPickupCity] = useState(null);
  const [dropoffCity, setDropoffCity] = useState(null);
  const [bookingStatusArray, setBookingStatusArray] = useState([]);

  const updateBookingStatusArray = (bookingId, foundDrivers, notificationSent) => {
    const updatedBookingStatus = {
      bookingId,
      foundDrivers,
      notificationSent,
    };
    console.log('Updated booking status:', updatedBookingStatus);

    setBookingStatusArray((prevArray) => [...prevArray, updatedBookingStatus]);
  };

  const contextValue = {
    pickupCity,
    setPickupCity,
    dropoffCity,
    setDropoffCity,
    bookingStatusArray,
    updateBookingStatusArray,
  };

  return (
    <HomeContext.Provider value={contextValue}>
      {children}
    </HomeContext.Provider>
  );
};