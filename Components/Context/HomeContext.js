// HomeContext.js
import React, { createContext, useState } from 'react';

export const HomeContext = createContext();

export const HomeProvider = ({ children }) => {
  const [pickupCity, setPickupCity] = useState(null);
  const [dropoffCity, setDropoffCity] = useState(null);
  const contextValue = { pickupCity, setPickupCity, dropoffCity, setDropoffCity };

  return (
    <HomeContext.Provider value={contextValue}>
      {children}
    </HomeContext.Provider>
  );
};