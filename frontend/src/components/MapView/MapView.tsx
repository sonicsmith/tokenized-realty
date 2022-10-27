import { LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const MapView = (props: {
  width: number;
  height: number;
  position: LatLngExpression;
}) => {
  const { width, height, position } = props;
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      dragging={false}
      style={{ width, height, zIndex: 0 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position}>{/* <Popup>
        </Popup> */}</Marker>
    </MapContainer>
  );
};

export default MapView;
