import { createContext, useReducer, useEffect, useState } from "react";

export const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const INITIAL_STATE = {
    isAlertOpen: false,
    isPopUpOpen: false,
    alertMsg: "",
    alertTitle: "",
    popupMsg: "",
    popupType: "",
    number_of_notifications: 10,
  };

  const StateReducer = (state, action) => {
    switch (action.type) {
      case "open alert":
        return {
          ...state,
          isAlertOpen: true,
          alertMsg: action.playload.msg,
          alertTitle: action.playload.title,
        };
      case "open popup":
        return {
          ...state,
          isPopUpOpen: true,
          popupMsg: action.playload.msg,
          popupType: action.playload.type,
        };
      case "close alert":
        return {
          ...state,
          isAlertOpen: false,
          alertMsg: "",
          alertTitle: "",
        };
      case "close popup":
        return {
          ...state,
          popupType: "",
          isPopUpOpen: false,
          popupMsg: "",
        };
      case "set number of notifications":
        return {
          ...state,
          number_of_notifications: action.payload,
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(StateReducer, INITIAL_STATE);

  // ✅ Load user from localStorage
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <StateContext.Provider value={{ state, dispatch, user, setUser }}>
      {children}
    </StateContext.Provider>
  );
};
