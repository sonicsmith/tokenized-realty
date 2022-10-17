import { createContext, useContext } from "react";

export interface State {
  //
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
}

export const reducer = (
  state: State,
  action: { type: string; payload: any }
): State => {
  switch (action.type) {
    case ActionTypes.Default:
      return { ...state };
    default:
      throw new Error();
  }
};

export const AppStore = createContext<AppStoreType>(null);

export const AppStoreProvider = AppStore.Provider;

const useAppStore = () => {
  const appStore = useContext<AppStoreType>(AppStore);
  return appStore;
};

export default useAppStore;
