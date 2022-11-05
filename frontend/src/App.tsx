import { ChakraProvider, useToast, UseToastOptions } from "@chakra-ui/react";
import { useCallback, useReducer } from "react";
import { Web3ReactProvider } from "@web3-react/core";

import { AppStoreProvider, reducer, State } from "./providers/AppStore";
import { AppNotificationProvider } from "./providers/AppNotification";
import Main from "./components/Main/Main";
import { getConnectors } from "./utils/getConnectors";
import theme from "./theme";

const initialState: State = { transactions: [] };

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
      <ChakraProvider theme={theme}>
        <AppStoreProvider value={{ state, dispatch }}>
          <AppNotificationProvider value={setNotification}>
            <Main />
          </AppNotificationProvider>
        </AppStoreProvider>
      </ChakraProvider>
    </Web3ReactProvider>
  );
};

export default App;
