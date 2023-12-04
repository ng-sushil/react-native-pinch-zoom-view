import { GestureResponderEvent } from 'react-native';

export interface StyleTransform {
    rotate?: string;
    scale?: number;
}

export function getTouches(event: GestureResponderEvent): any[];

export function getAngle(event: GestureResponderEvent, styles: { transform?: StyleTransform[] }, diffAngle: number): string;

export function getScale(event: GestureResponderEvent, styles: { transform?: StyleTransform[] }, diffDistance: number): number;

export function isMultiTouch(event: GestureResponderEvent): boolean;
