import { LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const MapView = (props: {
  width: number;
  height: number;
  position: LatLngExpression;
  label?: string;
}) => {
  const { width, height, position } = props;
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={false}
      style={{ width, height, zIndex: 0 }}
    >
      <TileLayer
        // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        subdomains={["mt1", "mt2", "mt3"]}
      />
      <Marker position={position}>
        <Popup>{props.label}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
