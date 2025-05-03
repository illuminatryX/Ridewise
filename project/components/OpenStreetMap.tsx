import React, { useEffect, useRef } from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface OpenStreetMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  style?: any;
  destinationLatitude?: number;
  destinationLongitude?: number;
  showRoute?: boolean;
  onMapClick?: (coords: {latitude: number, longitude: number, isDestination?: boolean}) => void;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  latitude,
  longitude,
  zoom = 15,
  style,
  destinationLatitude,
  destinationLongitude,
  showRoute = false,
  onMapClick,
}) => {
  // Reference to the WebView instance to allow reloading
  const webViewRef = useRef<WebView>(null);
  
  // Keep track of last props to detect changes
  const lastPropsRef = useRef({
    latitude,
    longitude,
    destinationLatitude,
    destinationLongitude,
    showRoute
  });
  
  // Reload the WebView when important props change
  useEffect(() => {
    const currentProps = {
      latitude,
      longitude,
      destinationLatitude,
      destinationLongitude,
      showRoute
    };
    
    // Check if any important props have changed
    const shouldReload = Object.keys(currentProps).some(
      key => currentProps[key as keyof typeof currentProps] !== 
             lastPropsRef.current[key as keyof typeof lastPropsRef.current]
    );
    
    if (shouldReload && webViewRef.current) {
      console.log('Important map props changed, reloading map');
      webViewRef.current.reload();
    }
    
    lastPropsRef.current = currentProps;
  }, [latitude, longitude, destinationLatitude, destinationLongitude, showRoute]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          html, body, #map { height: 100%; width: 100%; cursor: crosshair; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize the map
          const map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap contributors'
          }).addTo(map);
          
          // Define marker icons
          const sourceIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            shadowSize: [41, 41]
          });
          
          const destIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            shadowSize: [41, 41]
          });
          
          // Add source marker
          const sourceMarker = L.marker([${latitude}, ${longitude}], {
            draggable: true,
            icon: sourceIcon
          }).addTo(map).bindPopup('Starting Point').openPopup();
          
          // Handle source marker drag
          sourceMarker.on('dragend', function(e) {
            const position = sourceMarker.getLatLng();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'sourceMarkerDrag',
              latitude: position.lat,
              longitude: position.lng
            }));
          });
          
          // Handle map clicks for location selection
          map.on('click', function(e) {
            const clickedLat = e.latlng.lat;
            const clickedLng = e.latlng.lng;
            
            // Post message to React Native WebView
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              latitude: clickedLat,
              longitude: clickedLng
            }));
          });
          
          let destMarker;
          let routeLine;
          
          ${destinationLatitude && destinationLongitude ? `
            // Add destination marker
            destMarker = L.marker([${destinationLatitude}, ${destinationLongitude}], {
              draggable: true,
              icon: destIcon
            }).addTo(map).bindPopup('Destination');
              
            // Handle destination marker drag
            destMarker.on('dragend', function(e) {
              const position = destMarker.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'destMarkerDrag',
                latitude: position.lat,
                longitude: position.lng,
                isDestination: true
              }));
            });
          ` : ''}
          
          ${showRoute && destinationLatitude && destinationLongitude ? `
            // Remove existing route if there is one
            if (routeLine) {
              map.removeLayer(routeLine);
            }
            
            console.log('Fetching route between points');
            
            // Fetch and display route
            fetch('https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${destinationLongitude},${destinationLatitude}?overview=full&geometries=geojson')
              .then(response => response.json())
              .then(data => {
                console.log('Route data received:', data);
                if (data.code === 'Ok') {
                  const routeCoordinates = data.routes[0].geometry.coordinates;
                  // Transform from [lng, lat] to [lat, lng] for Leaflet
                  const routePoints = routeCoordinates.map(coord => [coord[1], coord[0]]);
                  
                  // Draw route line
                  routeLine = L.polyline(routePoints, {
                    color: '#0066CC',
                    weight: 5,
                    opacity: 0.7
                  }).addTo(map);
                  
                  // Adjust map viewport to show the entire route with some padding
                  map.fitBounds(L.latLngBounds(routePoints), {
                    padding: [50, 50] // Add 50px padding around the route
                  });
                } else {
                  console.error('Error fetching route: No route found');
                  // If no route is found, just show both markers
                  const bounds = L.latLngBounds(
                    [${latitude}, ${longitude}],
                    [${destinationLatitude}, ${destinationLongitude}]
                  );
                  map.fitBounds(bounds, { padding: [50, 50] });
                }
              })
              .catch(error => {
                console.error('Error fetching route:', error);
                // If route fetching fails, just show both markers
                const bounds = L.latLngBounds(
                  [${latitude}, ${longitude}],
                  [${destinationLatitude}, ${destinationLongitude}]
                );
                map.fitBounds(bounds, { padding: [50, 50] });
              });
          ` : ''}
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from map:', data);
      
      if (data.type === 'mapClick' && onMapClick) {
        onMapClick({
          latitude: data.latitude,
          longitude: data.longitude
        });
      } else if (data.type === 'sourceMarkerDrag' && onMapClick) {
        onMapClick({
          latitude: data.latitude,
          longitude: data.longitude,
          isDestination: false
        });
      } else if (data.type === 'destMarkerDrag' && onMapClick) {
        onMapClick({
          latitude: data.latitude,
          longitude: data.longitude,
          isDestination: true
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Web platform implementation
  if (Platform.OS === 'web') {
    // For web, use a more direct approach with click handling
    const hasDestination = destinationLatitude && destinationLongitude;
    
    // Calculate bounding box to include both points with some padding
    const boundingBox = hasDestination 
      ? `&bbox=${Math.min(longitude, destinationLongitude || longitude) - 0.02},${Math.min(latitude, destinationLatitude || latitude) - 0.02},${Math.max(longitude, destinationLongitude || longitude) + 0.02},${Math.max(latitude, destinationLatitude || latitude) + 0.02}`
      : `&bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`;
    
    // Add route parameter if we should show the route
    const routeParam = hasDestination && showRoute 
      ? `&route=${latitude},${longitude};${destinationLatitude},${destinationLatitude}` 
      : '';
      
    // Add markers for source and destination
    const markers = hasDestination 
      ? `&marker=${latitude},${longitude}&marker=${destinationLatitude},${destinationLongitude}` 
      : `&marker=${latitude},${longitude}`;
    
    // For web, we need to use a different approach since iframe doesn't support click events
    // We'll handle map clicking through a div overlay
    return (
      <div 
        style={{
          width: '100%',
          height: 200,
          position: 'relative',
          ...style
        }}
      >
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik${boundingBox}${markers}${routeParam}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allowFullScreen
          aria-hidden="false"
          tabIndex={0}
        />
        {/* Transparent overlay to capture clicks */}
        {onMapClick && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'crosshair',
            }}
            onClick={(e) => {
              // This is an approximation since we can't get exact coordinates from the iframe
              // We estimate based on the click position relative to the div
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left; // x position within the element
              const y = e.clientY - rect.top;  // y position within the element
              
              // Calculate relative position (0 to 1)
              const relX = x / rect.width;
              const relY = y / rect.height;
              
              // Calculate the bounding box extents
              const minLon = Math.min(longitude, destinationLongitude || longitude) - 0.02;
              const minLat = Math.min(latitude, destinationLatitude || latitude) - 0.02;
              const maxLon = Math.max(longitude, destinationLongitude || longitude) + 0.02;
              const maxLat = Math.max(latitude, destinationLatitude || latitude) + 0.02;
              
              // Interpolate to get approximate geo coordinates
              // Note: This is a linear approximation and won't be perfectly accurate
              const clickedLng = minLon + relX * (maxLon - minLon);
              // Y is inverted (0 at top, 1 at bottom)
              const clickedLat = maxLat - relY * (maxLat - minLat);
              
              onMapClick({
                latitude: clickedLat,
                longitude: clickedLng
              });
            }}
          />
        )}
      </div>
    );
  }

  // Mobile implementation using WebView
  return (
    <WebView
      ref={webViewRef}
      style={[styles.map, style]}
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onMessage={handleWebViewMessage}
    />
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 200,
  },
});

export default OpenStreetMap;
