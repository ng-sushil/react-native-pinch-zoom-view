import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import ZoomHandler from './src/ZoomHandler';

interface ZoomViewProps extends ViewProps {
  minZoom: number;
  maxZoom: number;
  zoomLevels: number[];
}

interface ZoomViewState {
  containerSize: { width: number; height: number };
}

function extractDimensions(style: ZoomViewProps['style']): {
  width: number;
  height: number;
} {
  if (!style || typeof style === 'boolean') {
    return { width: 0, height: 0 };
  }

  const flattened = StyleSheet.flatten(style);
  return {
    width: typeof flattened.width === 'number' ? flattened.width : 0,
    height: typeof flattened.height === 'number' ? flattened.height : 0,
  };
}

class ZoomView extends Component<ZoomViewProps, ZoomViewState> {
  constructor(props: ZoomViewProps) {
    super(props);
    this.state = {
      containerSize: { width: 0, height: 0 },
    };
  }

  static getDerivedStateFromProps(
    nextProps: ZoomViewProps,
    prevState: ZoomViewState
  ) {
    const { width: newWidth, height: newHeight } = extractDimensions(
      nextProps.style
    );

    if (
      prevState.containerSize.width !== newWidth ||
      prevState.containerSize.height !== newHeight
    ) {
      return { containerSize: { width: newWidth, height: newHeight } };
    }

    return null;
  }

  handleLayoutChange = (width: number, height: number) => {
    const containerSize = { width, height };
    this.setState({ containerSize });
  };

  handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    this.handleLayoutChange(width, height);
  };

  componentDidUpdate(prevProps: ZoomViewProps) {
    if (this.props.style !== prevProps.style) {
      const { width, height } = extractDimensions(this.props.style);
      this.handleLayoutChange(width, height);
    }
  }

  render() {
    const { style, children, minZoom, maxZoom, zoomLevels=[], ...restProps } =
      this.props;

    return (
      <View
        style={[{ height: '100%', overflow: 'hidden' }, style]}
        onLayout={this.handleLayout}
        {...restProps}
      >
        <ZoomHandler
          containerDimensions={this.state.containerSize}
          minimumZoom={minZoom}
          maximumZoom={maxZoom}
          availableZoomLevels={zoomLevels}
        >
          {children}
        </ZoomHandler>
      </View>
    );
  }
}

export default ZoomView;
