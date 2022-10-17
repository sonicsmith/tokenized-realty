import {
  Box,
  ChakraProvider,
  useToast,
  UseToastOptions,
} from "@chakra-ui/react";
import { useCallback, useReducer } from "react";
import { Web3ReactProvider } from "@web3-react/core";

import AppBar from "./components/AppBar/AppBar";
import { AppStoreProvider, reducer, State } from "./providers/AppStore";
import { AppNotificationProvider } from "./providers/AppNotification";
import CounterControl from "./components/CounterControl/CounterControl";
import { getConnectors } from "./utils/getConnectors";

const initialState: State = {};

const connectors = getConnectors();

const App = () => {
  // App State
  const [state, dispatch] = useReducer(reducer, initialState);
  const toast = useToast();

  // App Notifications
  const setNotification = useCallback(
    (options: UseToastOptions) => {
      console.log("Setting toast");
      toast({ ...options, isClosable: true, position: "top" });
    },
    [toast]
  );

  return (
    <Web3ReactProvider connectors={connectors}>
      <ChakraProvider>
        <AppStoreProvider value={{ state, dispatch }}>
          <AppNotificationProvider value={setNotification}>
            <Content />
          </AppNotificationProvider>
        </AppStoreProvider>
      </ChakraProvider>
    </Web3ReactProvider>
  );
};

const Content = () => {
  return (
    <Box>
      <AppBar />
      <CounterControl />
    </Box>
  );
};

export default App;
