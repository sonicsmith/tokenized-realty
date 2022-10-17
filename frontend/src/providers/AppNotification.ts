import { UseToastOptions } from "@chakra-ui/react";
import { createContext, useContext } from "react";

export enum Status {
  Success = "success",
  Error = "error",
  Warning = "warning",
  Info = "info",
}

export interface Notification {
  title: string;
  description: string;
  status: Status;
}

export type AppNotificationType = ((options: UseToastOptions) => void) | null;

export const AppNotification = createContext<AppNotificationType>(null);

export const AppNotificationProvider = AppNotification.Provider;

const useAppNotification = () => {
  const appNotification = useContext<AppNotificationType>(AppNotification);
  return appNotification;
};

export default useAppNotification;
