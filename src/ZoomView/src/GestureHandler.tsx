//From  https://github.com/keske/react-native-easy-gestures.git

import React, { Component } from 'react';
import { PanResponder, View } from 'react-native';

import type {
  ViewStyle,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
// Utility functions
//@ts-ignore
import { getAngle, getScale, getTouches, isMultiTouch } from '../utils/events';
//@ts-ignore
import { angle, distance } from '../utils/math';

// Helper function to check if a value is an object
const isObj = (value: any): value is Object =>
  typeof value === 'object' && value !== null;

// Interfaces for the draggable and scalable props
interface DraggableShape {
  x?: boolean;
  y?: boolean;
}

interface ScalableShape {
  min?: number;
  max?: number;
}

// Interface for the component props
interface GestureHandlerProps {
  children?: React.ReactNode;
  draggable?: boolean | DraggableShape;
  rotatable?: boolean;
  scalable?: boolean | ScalableShape;
  style?: ViewStyle;
  onStart?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onChange?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onEnd?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onMultyTouchStart?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onMultyTouchChange?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onMultyTouchEnd?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onRelease?: (event: GestureResponderEvent, style: ViewStyle) => void; // Legacy
  onRotateStart?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onRotateChange?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onRotateEnd?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onScaleStart?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onScaleChange?: (event: GestureResponderEvent, style: ViewStyle) => void;
  onScaleEnd?: (event: GestureResponderEvent, style: ViewStyle) => void;
}

// Interface for the component state
interface GestureHandlerState {
  isMultyTouchingNow: boolean;
  isRotatingNow: boolean;
  isScalingNow: boolean;
  style: ViewStyle;
}

// GestureHandler component
export default class GestureHandler extends Component<
  GestureHandlerProps,
  GestureHandlerState
> {
  private panResponder: any;
  private prevStyles: ViewStyle = {};
  private initialTouches: any;
  private initialStyles: ViewStyle = {};
  private prevAngle: number = 0;
  private prevDistance: number = 0;
  private pinchStyles: any;
  private dragStyles: any;
  private view: View | null = null;

  // Default props
  static defaultProps: GestureHandlerProps = {
    draggable: { x: true, y: true },
    rotatable: true,
    scalable: { min: 0.33, max: 2 },
    style: {
      left: 0,
      top: 0,
      transform: [{ rotate: '0deg' }, { scale: 1 }],
    },
    onStart: () => {},
    onChange: () => {},
    onEnd: () => {},
    onRelease: () => {}, // Legacy
    onMultyTouchStart: () => {},
    onMultyTouchChange: () => {},
    onMultyTouchEnd: () => {},
    onRotateStart: () => {},
    onRotateChange: () => {},
    onRotateEnd: () => {},
    onScaleStart: () => {},
    onScaleChange: () => {},
    onScaleEnd: () => {},
  };

  constructor(props: GestureHandlerProps) {
    super(props);
    this.state = {
      isMultyTouchingNow: false,
      isRotatingNow: false,
      isScalingNow: false,
      style: {
        ...GestureHandler.defaultProps.style,
        ...props.style,
      },
    };

    // Initialize PanResponder
    this.panResponder = PanResponder.create({
      onPanResponderGrant: this.onMoveStart,
      onPanResponderMove: this.onMove,
      onPanResponderEnd: this.onMoveEnd,
      onPanResponderTerminate: () => true,
      onShouldBlockNativeResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => true,
      onMoveShouldSetPanResponderCapture: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => gestureState.dx !== 0 && gestureState.dy !== 0,
    });
  }

  componentDidMount() {
    this.prevStyles = this.state.style;
  }

  onDrag = (
    _event: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => {
    const { initialStyles } = this;
    const { draggable } = this.props;

    let leftValue: number;
    let topValue: number;

    // Handle initialStyles.left
    if (typeof initialStyles.left === 'number') {
      leftValue = initialStyles.left;
    } else if (typeof initialStyles.left === 'string') {
      leftValue = parseInt(initialStyles.left, 10);
    } else {
      leftValue = 0;
    }

    // Handle initialStyles.top
    if (typeof initialStyles.top === 'number') {
      topValue = initialStyles.top;
    } else if (typeof initialStyles.top === 'string') {
      topValue = parseInt(initialStyles.top, 10);
    } else {
      topValue = 0;
    }

    // Determine if draggable is an object and has x or y properties
    const isDraggableObject =
      typeof draggable === 'object' && draggable !== null;

    const left =
      isDraggableObject && draggable.x
        ? leftValue + gestureState.dx
        : leftValue;
    const top =
      isDraggableObject && draggable.y ? topValue + gestureState.dy : topValue;

    this.dragStyles = { left, top };
  };

  onRotate = (event: GestureResponderEvent) => {
    const { onRotateStart, onRotateChange, rotatable } = this.props;
    const { isRotatingNow, style } = this.state;

    const { initialTouches } = this;

    if (rotatable) {
      const currentAngle = angle(getTouches(event));
      const initialAngle =
        initialTouches.length > 1 ? angle(initialTouches) : currentAngle;
      const newAngle = currentAngle - initialAngle;
      const diffAngle = this.prevAngle - newAngle;
      this.pinchStyles.transform.push({
        //@ts-ignore
        rotate: getAngle(event, style, diffAngle),
      });

      this.prevAngle = newAngle;

      if (!isRotatingNow) {
        onRotateStart && onRotateStart(event, style);

        this.setState({ isRotatingNow: true });
      } else {
        onRotateChange && onRotateChange(event, style);
      }
    }
  };

  onScale = (event: GestureResponderEvent) => {
    const { onScaleStart, onScaleChange, scalable } = this.props;
    const { isScalingNow, style } = this.state;
    const { initialTouches } = this;

    const isObject = isObj(scalable);

    if (isObject || scalable) {
      const currentDistance = distance(getTouches(event));
      const initialDistance = distance(initialTouches);

      const numericCurrentDistance = Number(currentDistance) || 0;
      const numericInitialDistance = Number(initialDistance) || 0;

      const increasedDistance = numericCurrentDistance - numericInitialDistance;

      const diffDistance = this.prevDistance - increasedDistance;

      const isScalableObject =
        typeof scalable === 'object' && scalable !== null;

      const min =
        isScalableObject && typeof scalable.min === 'number'
          ? scalable.min
          : 0.33;
      const max =
        isScalableObject && typeof scalable.max === 'number' ? scalable.max : 2;

      const scale = Math.min(
        //@ts-ignore
        Math.max(getScale(event, style, diffDistance), min),
        max
      );

      this.pinchStyles.transform.push({ scale });
      this.prevDistance = increasedDistance;

      if (!isScalingNow) {
        onScaleStart && onScaleStart(event, style);

        this.setState({ isScalingNow: true });
      } else {
        onScaleChange && onScaleChange(event, style);
      }
    }
  };

  onMoveStart = (event: GestureResponderEvent) => {
    const { style } = this.state;
    const { onMultyTouchStart, onStart } = this.props;

    const touches = getTouches(event);

    this.prevAngle = 0;
    this.prevDistance = 0;
    this.initialTouches = 0;
    this.pinchStyles = {};
    this.dragStyles = {};
    this.prevStyles = style;

    this.initialTouches = getTouches(event);
    this.initialStyles = style;

    onStart && onStart(event, style);

    if (touches.length > 1) {
      onMultyTouchStart && onMultyTouchStart(event, style);

      this.setState({ isMultyTouchingNow: true });
    }
  };

  onMove = (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => {
    const { isMultyTouchingNow, style } = this.state;
    const { onChange, onMultyTouchChange } = this.props;

    const { initialTouches } = this;

    const touches = getTouches(event);

    if (touches.length !== initialTouches.length) {
      this.initialTouches = touches;
    } else {
      this.onDrag(event, gestureState);
      this.onPinch(event);
    }

    if (isMultyTouchingNow) {
      onMultyTouchChange && onMultyTouchChange(event, style);
    }

    this.updateStyles();

    onChange && onChange(event, style);
  };

  onMoveEnd = (event: GestureResponderEvent) => {
    const { isMultyTouchingNow, isRotatingNow, isScalingNow, style } =
      this.state;
    const {
      onEnd,
      onMultyTouchEnd,
      onRelease, // Legacy
      onRotateEnd,
      onScaleEnd,
    } = this.props;

    onEnd && onEnd(event, style);
    onRelease && onRelease(event, style); // Legacy

    if (isRotatingNow) {
      onRotateEnd && onRotateEnd(event, style);
    }

    if (isScalingNow) {
      onScaleEnd && onScaleEnd(event, style);
    }

    if (isMultyTouchingNow) {
      onMultyTouchEnd && onMultyTouchEnd(event, style);
    }

    this.setState({
      isRotatingNow: false,
      isScalingNow: false,
    });
  };

  onPinch = (event: GestureResponderEvent) => {
    if (isMultiTouch(event)) {
      this.pinchStyles = { transform: [] };

      this.onScale(event);
      this.onRotate(event);
    }
  };

  updateStyles = () => {
    const style = {
      ...this.state.style,
      ...this.dragStyles,
      ...this.pinchStyles,
    };

    this.updateNativeStyles(style);
    this.setState({ style });
  };

  updateNativeStyles = (style: ViewStyle) => {
    this.view?.setNativeProps({ style });
  };

  reset = (callback: (style: ViewStyle) => void) => {
    const { left, top, transform } = this.prevStyles;

    this.dragStyles = { left, top };
    this.pinchStyles = { transform };

    this.updateStyles();

    callback && callback(this.prevStyles);
  };

  render() {
    const { style } = this.state;
    const { children } = this.props;

    return (
      <View
        ref={(ref) => {
          this.view = ref;
        }}
        style={style}
        {...this.panResponder.panHandlers}
      >
        {children}
      </View>
    );
  }
}
