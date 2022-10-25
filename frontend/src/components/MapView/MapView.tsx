import { LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const position: LatLngExpression = [-45.8611, 170.5327];

export default function MapView(props: { width: number; height: number }) {
  const { width, height } = props;
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      dragging={false}
      style={{ width, height, zIndex: 0 }}
    >
      <TileLayer
        // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
