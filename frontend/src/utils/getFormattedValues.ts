export const getFormattedCurrency = (value: number | string) => {
  return (typeof value === "number" ? value : Number(value)).toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  );
};
