declare module 'react-qr-reader' {
  import { Component } from 'react';

  interface QrReaderProps {
    onResult: (result: any, error?: any) => void;
    constraints?: {
      facingMode?: 'user' | 'environment';
    };
    style?: React.CSSProperties;
    className?: string;
    delay?: number;
    videoStyle?: React.CSSProperties;
    videoContainerStyle?: React.CSSProperties;
    scanDelay?: number;
    containerStyle?: React.CSSProperties;
    legacyMode?: boolean;
  }

  export class QrReader extends Component<QrReaderProps> {}
}

