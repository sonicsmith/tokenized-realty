import { LatLngExpression } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";

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
        url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
      />
    </MapContainer>
  );
};

export default MapView;
