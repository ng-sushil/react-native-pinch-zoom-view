import React, { useState, useEffect } from 'react';
import { Dimensions, View, Text } from 'react-native';
import ZoomWrapper from '@ngenux/react-native-pinch-zoom-view';

export default function App() {
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get('window')
  );

  useEffect(() => {
    const onChange = ({ window }) => {
      setWindowDimensions(window);
    };

    let sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const zoomElementStyle = {
    width: windowDimensions.width,
    height: windowDimensions.height,
    position: 'absolute',
  };

  return (
    <View style={{ flex: 1,alignItems:'center',justifyContent:'center' }}>
      <ZoomWrapper style={zoomElementStyle} minZoom={1} maxZoom={5}>
        <Text style={{ color: 'black', fontSize: 20 }}>
          @ngenux/react-native-pinch-zoom-view
        </Text>
      </ZoomWrapper>
    </View>
  );
}
