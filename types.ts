// Simple vector type for internal calculations
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
  
export interface FaceData {
    detected: boolean;
    position: Vector3; // Normalized 0-1
    tilt: number;
}

export interface HandData {
    detected: boolean;
    isPinching: boolean;
    pinchDistance: number;
    position: Vector3; // Normalized 0-1
}

export interface TrackingState {
    face: FaceData;
    hand: HandData;
}