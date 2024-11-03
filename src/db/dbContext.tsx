import React, { createContext, useContext } from 'react';
import { LocalStorageDB, db } from './index';

// Create the context
const DBContext = createContext<LocalStorageDB | undefined>(undefined);

// Create a provider component
export const DBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <DBContext.Provider value={db}>
            {children}
        </DBContext.Provider>
    );
};

// Create a custom hook to use the db
export const useDB = () => {
    const context = useContext(DBContext);
    if (context === undefined) {
        throw new Error('useDB must be used within a DBProvider');
    }
    return context;
};