import React, { Component } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Animated, Dimensions, View } from 'react-native';
import GestureHandler from './GestureHandler';
import styles from './styles';

const calculateScale = (info: any) => {
  let { scale } = info.transform[0];
  if (!scale) scale = info.transform[1].scale;
  return scale;
};

interface TouchInfo {
  x?: number;
  y?: number;
  type?: string;
  startX?: number;
  startY?: number;
  prevX?: number;
  prevY?: number;
  prevT?: number;
  startTime?: number;
  dX?: number;
  dY?: number;
  dT?: number;
}

interface DragStyles {
  left?: number;
  top?: number;
  startX?: number;
  startY?: number;
}

interface PaneLayout {
  width: number;
  height: number;
}

interface ZoomHandlerProps {
  availableZoomLevels: number[];
  minimumZoom: number;
  maximumZoom: number;
  containerDimensions: {
    width: number;
    height: number;
  };
  children: React.ReactNode;
}

interface ZoomHandlerState { }

const DOUBLE_PRESS_DELAY = 600;
const DOUBLE_PRESS_DISTANCE = 20;

class ZoomHandler extends Component<ZoomHandlerProps, ZoomHandlerState> {
  private scale: number = 1;
  private coolDown: number;
  private prevPressTimestamp: number;
  private prevTouchInfo: TouchInfo;
  private currTouchInfo: TouchInfo;
  private animatedValue: Animated.ValueXY;
  private savedDragstyles: DragStyles;
  private setDefaultOrientation: boolean;
  private updatedCoordinates: {
    xIsNew: boolean;
    yIsNew: boolean;
    x: number;
    y: number;
  };
  private enableDoubleTap: boolean;
  private availableZoomLevels: number[];
  private minimumZoom: number;
  private maximumZoom: number;
  private paneLayout: PaneLayout | null = null;
  private zoomPanel: any;

  constructor(props: ZoomHandlerProps) {
    super(props);
    this.coolDown = 0;
    this.prevPressTimestamp = 0;
    this.prevTouchInfo = { x: -1000, y: -1000, type: 'idk,lol' };
    this.currTouchInfo = { startX: -1000, startY: -1000 };
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.onChange = this.onChange.bind(this);
    this.handleFlingAnimation = this.handleFlingAnimation.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    this.animatedValue = new Animated.ValueXY({ x: 0, y: 0 });
    this.savedDragstyles = { left: 0, top: 0 };
    this.setDefaultOrientation = false;
    this.updatedCoordinates = {
      xIsNew: false,
      yIsNew: false,
      x: 0,
      y: 0,
    };
    const availableZoomLevelsCount = props.availableZoomLevels.length
      ? props.availableZoomLevels.length
      : 2;
    this.enableDoubleTap = props.availableZoomLevels.length > 0;
    this.availableZoomLevels = [];
    this.minimumZoom = props.minimumZoom
      ? props.minimumZoom < 1
        ? 1
        : props.minimumZoom
      : 1;
    this.maximumZoom = props.maximumZoom ? props.maximumZoom : 3;
    for (let i = 0; i <= availableZoomLevelsCount; i++) {
      this.availableZoomLevels.push(
        this.minimumZoom +
        i *
        ((this.maximumZoom - this.minimumZoom) / availableZoomLevelsCount),
      );
    }
  }

  componentWillReceiveProps() {
    this.setDefaultOrientation = true;
    if (this.paneLayout) this.handleOrientationChange();
  }

  onChange(event: GestureResponderEvent, info: any, containerDimensions: { width: number, height: number }) {
    const { timestamp, pageX, pageY } = event.nativeEvent;
    const scale = calculateScale(info);
    if (this.paneLayout) {
      this.adjustBorderZoom(scale, containerDimensions);
    }
    const timeDifference = timestamp - (this.currTouchInfo.prevT ?? 0);

    if (timeDifference > 50) {
      this.currTouchInfo = {
        ...this.currTouchInfo,
        prevX: pageX,
        prevY: pageY,
        prevT: timestamp,
        dX: pageX - (this.currTouchInfo.prevX ?? 0),
        dY: pageY - (this.currTouchInfo.prevY ?? 0),
        dT: timeDifference,
      };
    }
  }

  handleFlingAnimation(x: number, y: number, info: any) {
    if (!this.zoomPanel) {
      return;
    }

    if (!this.zoomPanel.dragStyles) {
      this.zoomPanel.dragStyles = {};
    }

    if (x !== this.zoomPanel.dragStyles.left) {
      this.updatedCoordinates.x = x;
      this.updatedCoordinates.xIsNew = true;
    }
    if (y !== this.zoomPanel.dragStyles.top) {
      this.updatedCoordinates.y = y;
      this.updatedCoordinates.yIsNew = true;
    }
    if (this.updatedCoordinates.xIsNew && this.updatedCoordinates.yIsNew) {
      this.zoomPanel.dragStyles = {
        left: this.updatedCoordinates.x,
        top: this.updatedCoordinates.y,
      };
      const scale = calculateScale(info);
      const { containerDimensions } = this.props;
      this.adjustBorderZoom(scale, containerDimensions);
      this.zoomPanel.updateStyles();
      this.updatedCoordinates = {
        xIsNew: false, yIsNew: false, x: this.updatedCoordinates.x,
        y: this.updatedCoordinates.y
      };
    }
  }

  handleTouchEnd(event: GestureResponderEvent, info: any, containerDimensions: { width: number, height: number }, recursion: number) {
    if (!containerDimensions) {
      return;
    }

    if (
      this.savedDragstyles === undefined ||
      this.savedDragstyles.left === undefined ||
      !event.nativeEvent
    ) {
      if (!event.nativeEvent) return;
      if (recursion < 2) {
        setTimeout(
          () =>
            this.handleTouchEnd(
              event,
              info,
              containerDimensions,
              recursion + 1,
            ),
          50,
        );
      }
      return;
    }
    const { timestamp, pageX, pageY, locationX, locationY } = event.nativeEvent;
    const distanceX = pageX - (this.currTouchInfo.startX ?? 0);
    const distanceY = pageY - (this.currTouchInfo.startY ?? 0);

    const distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

    // double tap execution
    const delta = timestamp - this.prevPressTimestamp;
    this.prevPressTimestamp = timestamp;
    const lastTouchDistance = Math.sqrt(
      Math.pow(pageX - (this.prevTouchInfo.x ?? 0), 2) +
      Math.pow(pageY - (this.prevTouchInfo.y ?? 0), 2)
    );


    if (
      delta < DOUBLE_PRESS_DELAY &&
      lastTouchDistance < DOUBLE_PRESS_DISTANCE &&
      this.enableDoubleTap
    ) {
      const scale = calculateScale(info);
      let requiredScale = this.availableZoomLevels[0];
      for (let el of this.availableZoomLevels) {
        if (scale < el) {
          requiredScale = el;
          break;
        }
      }

      if (this.savedDragstyles.left === undefined) {
        this.savedDragstyles = this.zoomPanel.dragStyles;
      }

      let additionalScaledWidth = 0;
      let additionalScaledHeight = 0;
      let oldExtraScaledWidth = 0;
      let oldExtraScaledHeight = 0;

      if (this.paneLayout !== null) {
        additionalScaledWidth = ((requiredScale - 1) * this.paneLayout.width) / 2;
        additionalScaledHeight = ((requiredScale - 1) * this.paneLayout.height) / 2;
        oldExtraScaledWidth = ((scale - 1) * this.paneLayout.width) / 2;
        oldExtraScaledHeight = ((scale - 1) * this.paneLayout.height) / 2;
      }


      const centerX = containerDimensions.width / 2;
      const centerY = containerDimensions.height / 2;

      const yOffset = Math.abs(
        containerDimensions.height - Dimensions.get('window').height,
      );

      const x =
        ((this.savedDragstyles.left ?? 0) - oldExtraScaledWidth - pageX) / scale;
      const y =
        ((this.savedDragstyles.top ?? 0) - oldExtraScaledHeight - pageY + yOffset) /
        scale;

      const resultX = x * requiredScale + additionalScaledWidth + centerX;
      const resultY = y * requiredScale + additionalScaledHeight + centerY;

      this.setScale(requiredScale);

      this.zoomPanel.dragStyles = { left: resultX, top: resultY };

      this.prevPressTimestamp = 0;
      this.prevTouchInfo = { x: -1000, y: -1000, type: 'idk,lol' };

      this.adjustBorderZoom(requiredScale, containerDimensions);
      this.zoomPanel.updateStyles();
      return;
    }

    // double tap setup
    if (distance > 20) {
      this.prevTouchInfo = { x: -1000, y: -1000, type: 'fling' };
    } else {
      this.prevTouchInfo = {
        x: this.currTouchInfo.startX,
        y: this.currTouchInfo.startY,
        type: 'tap',
      };
    }

    // fling action
    if (event.nativeEvent.touches.length > 0) {
      this.coolDown = timestamp;
      return;
    }
    if (timestamp - this.coolDown < 400 && this.coolDown > 0) {
      this.coolDown = 0;
      return;
    }
    const dt =
      this.currTouchInfo.dT === 0
        ? timestamp - (this.currTouchInfo.startTime ?? 0)
        : (this.currTouchInfo.dT ?? 0);

    const dX =
      this.currTouchInfo.dX === 0
        ? pageX - (this.currTouchInfo.prevX ?? 0)
        : (this.currTouchInfo.dX ?? 0);

    const dY =
      this.currTouchInfo.dY === 0
        ? pageY - (this.currTouchInfo.prevY ?? 0)
        : (this.currTouchInfo.dY ?? 0);

    if (!dt || dt === 0) return;

    const speedX = dX / dt;
    const speedY = dY / dt;
    const time = Math.abs(Math.max(speedX, speedY) * 2500);
    if (!speedX || speedX === 0) return;
    if (!speedY || speedY === 0) return;

    const flingDistanceX = speedX * 2500;
    const flingDistanceY = speedY * 2500;

    const finalValX = this.zoomPanel.dragStyles.left + flingDistanceX;
    const finalValY = this.zoomPanel.dragStyles.top + flingDistanceY;

    if (!finalValX || finalValX === 0) return;
    if (!finalValY || finalValY === 0) return;

    this.animatedValue.setValue({
      x: this.zoomPanel.dragStyles.left,
      y: this.zoomPanel.dragStyles.top,
    });
    Animated.decay(this.animatedValue, {
      velocity: { x: speedX, y: speedY },
      useNativeDriver: true,
    }).start();

    this.animatedValue.addListener(val => {
      this.handleFlingAnimation(val.x, val.y, info);
    });
    this.updatedCoordinates = {
      xIsNew: false,
      yIsNew: false,
      x: this.updatedCoordinates.x,
      y: this.updatedCoordinates.y
    };

  }

  async handleOrientationChange() {
    if (!this.setDefaultOrientation) return;
    if (this.zoomPanel) {
      this.animatedValue.removeAllListeners();
      this.zoomPanel.dragStyles = {
        top: 0,
        left: 0,
      };
      this.setScale(this.minimumZoom);
      this.zoomPanel.updateStyles();
      this.setDefaultOrientation = false;
    } else {
      setTimeout(() => this.handleOrientationChange(), 50);
    }
  }

  handleTouchStart(event: GestureResponderEvent, info: any) {
    this.animatedValue.removeAllListeners();
    const { timestamp, pageX, pageY } = event.nativeEvent;
    this.currTouchInfo = {
      startX: pageX,
      startY: pageY,
      dX: 0,
      dY: 0,
      prevX: pageX,
      prevY: pageY,
      prevT: timestamp,
      startTime: timestamp,
      dT: 0,
    };
  }

  setScale(scale: number) {
    this.zoomPanel.pinchStyles = { transform: [] };
    this.zoomPanel.pinchStyles.transform.push({ scale });
  }
  adjustBorderZoom(scale: number, containerDimensions: { width: number, height: number }) {
    if (!containerDimensions) {
      return;
    }

    this.zoomPanel.dragStyles = this.zoomPanel.dragStyles
      ? this.zoomPanel.dragStyles
      : {};

    let additionalScaledWidth = 0;
    let additionalScaledHeight = 0;
    let currentScaledWidth = 0;
    let currentScaledHeight = 0;

    if (this.paneLayout !== null) {
      currentScaledWidth = scale * this.paneLayout.width;
      additionalScaledWidth = ((scale - 1) * this.paneLayout.width) / 2;
      currentScaledHeight = scale * this.paneLayout.height;
      additionalScaledHeight = ((scale - 1) * this.paneLayout.height) / 2;
    }

    if (this.zoomPanel.dragStyles.left > additionalScaledWidth) {
      this.zoomPanel.dragStyles = {
        ...this.zoomPanel.dragStyles,
        left: additionalScaledWidth,
      };
    }
    if (
      this.zoomPanel.dragStyles.left + currentScaledWidth <
      currentScaledWidth - additionalScaledWidth
    ) {
      this.zoomPanel.dragStyles = {
        ...this.zoomPanel.dragStyles,
        left: -additionalScaledWidth,
      };
    }
    if (
      -this.zoomPanel.dragStyles.top + containerDimensions.height >
      currentScaledHeight - additionalScaledHeight
    ) {
      this.zoomPanel.dragStyles = {
        ...this.zoomPanel.dragStyles,
        top:
          -currentScaledHeight +
          containerDimensions.height +
          additionalScaledHeight,
      };
    }
    if (this.zoomPanel.dragStyles.top > additionalScaledHeight) {
      this.zoomPanel.dragStyles = {
        ...this.zoomPanel.dragStyles,
        top: additionalScaledHeight,
      };
    }
    this.savedDragstyles = this.zoomPanel.dragStyles;
  }

  componentDidUpdate(prevProps: ZoomHandlerProps) {
    if (this.props.containerDimensions !== prevProps.containerDimensions) {
      this.handleContainerDimensionsChange();
    }
  }

  handleContainerDimensionsChange() {
    const { containerDimensions } = this.props;
    if (this.zoomPanel && this.paneLayout) {
      this.adjustBorderZoom(this.scale, containerDimensions);
      this.zoomPanel.updateStyles();
    }
  }

  render() {
    const { containerDimensions, children } = this.props;

    return (
      <View style={[styles.topOverflow]}>
        <GestureHandler
          ref={ref => {
            this.zoomPanel = ref;
            if (this.paneLayout && this.zoomPanel) {
              this.adjustBorderZoom(
                this.scale || this.minimumZoom,
                containerDimensions,
              );
              this.zoomPanel.updateStyles();
            }
            return this.zoomPanel;
          }}
          rotatable={false}
          onChange={(event, info) => {
            if (this.zoomPanel) {
              this.onChange(event, info, containerDimensions);
              this.zoomPanel.updateStyles();
            }
          }}
          onStart={(event, info) => {
            if (this.zoomPanel) {
              this.handleTouchStart(event, info);
              this.zoomPanel.updateStyles();
            }
          }}
          onEnd={(event, info) => {
            if (this.zoomPanel) {
              this.handleTouchEnd(event, info, containerDimensions, 0);
            }
          }}
          scalable={{
            min: this.minimumZoom,
            max: this.maximumZoom,
          }}
          onScaleEnd={(event, info) => {
            if (this.zoomPanel) {
              const scale = calculateScale(info);
              if (this.paneLayout) {
                this.adjustBorderZoom(scale, containerDimensions);
                this.zoomPanel.updateStyles();
                this.scale = scale;
              }
            }
          }}>
          <View
            style={{ minHeight: containerDimensions.height }}
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout;
              this.paneLayout = { width, height };
              this.handleOrientationChange();
            }}>
            {children}
          </View>
        </GestureHandler>
      </View>
    );
  }
}

export default ZoomHandler;
