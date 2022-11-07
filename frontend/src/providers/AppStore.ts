import { createContext, useContext } from "react";
import { IPropertyToken } from "../components/PropertyToken/PropertyToken";
import { Transaction } from "../components/TransactionModal/TransactionModal";

export interface State {
  transactions: Transaction[];
}

export type Dispatch = React.Dispatch<{
  type: string;
  payload: any;
}>;

export type AppStoreType = {
  state: State;
  dispatch: Dispatch;
} | null;

export enum ActionTypes {
  Default = "default-action",
  AddTransactions = "add-transactions",
}

export const reducer = (
  state: State,
  action: { type: string; payload: any }
): State => {
  switch (action.type) {
    case ActionTypes.Default:
      return { ...state };
    case ActionTypes.AddTransactions:
      return { ...state, transactions: action.payload };
    default:
      throw new Error();
  }
};

export const AppStore = createContext<AppStoreType>(null);

export const AppStoreProvider = AppStore.Provider;

const useAppStore = () => {
  const appStore = useContext<AppStoreType>(AppStore);
  return { state: appStore?.state, dispatch: appStore?.dispatch };
};

export default useAppStore;
