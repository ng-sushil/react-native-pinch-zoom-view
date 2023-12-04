# @ngenux/react-native-pinch-zoom-view
## _Interactive Zoom Component for React Native_

`@ngenux/react-native-pinch-zoom-view` is a React Native component designed for easy implementation of pinch-to-zoom functionality. It enables smooth and responsive zooming and panning on images or any content within a defined area in your React Native applications.

## Installation
To install `@ngenux/react-native-pinch-zoom-view`, run the following command in your project directory:

```bash
npm install @ngenux/react-native-pinch-zoom-view
```


## Usage
Import the `ZoomWrapper`  component from `@ngenux/react-native-pinch-zoom-view` and use them to wrap your content.

## Props
- `minZoom`: Minimum zoom level (default: `1`).
- `maxZoom`: Maximum zoom level (default: `5`).
- Additional standard `View` props.


## Tips
- `Responsiveness`: The component adapts to orientation changes. Use the Dimensions API from React Native to adjust the dimensions of the zoom element dynamically.
- `Zoom Boundaries`: Ensure your zoom levels and boundaries are set according to the content size to prevent excessive zooming out or in which might degrade the user experience.

## Example
```jsx
import React, { useState, useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import ZoomWrapper  from '@ngenux/react-native-pinch-zoom-view';

export default function App() {
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = ({ window }) => {
      setWindowDimensions(window);
    };

    Dimensions.addEventListener('change', onChange);
    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  const zoomElementStyle = {
    width: windowDimensions.width,
    height: windowDimensions.height,
    position: 'absolute',
  };

  return (
    <View style={{ flex: 1 }}>
      <ZoomWrapper
        style={zoomElementStyle}
        minZoom={1}
        maxZoom={5}
      >
        <Image
          src={'https://d27vkvqvvwyzde.cloudfront.net/Test_Image.JPEG'}
          width={windowDimensions.width}
        />
        {/* Or any other content*/}
      </ZoomWrapper>
    </View>
  );
}

```
---
## License
MIT

## Author


Developed by [ng-sushil](https://github.com/ng-sushil) of [@ngenux](https://www.ngenux.com/)