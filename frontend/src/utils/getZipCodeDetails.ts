import zipCodeData from "./zipCodes.json";

export interface ZipCodeDetails {
  location: number[];
  county: string;
  state: string;
  city: string;
}

const getZipCodeDetails = (zipCode: string | number) => {
  return (zipCodeData as Record<string, ZipCodeDetails>)[String(zipCode)];
};

export default getZipCodeDetails;
