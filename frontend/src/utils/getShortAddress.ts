export const getShortAddress = (address: string) => {
  return address
    ? address.substring(0, 4) + "..." + address.substring(address.length - 3)
    : "???";
};
