import React from 'react';

interface LoadingSpinnerProps {
    size?: number;
    style?: React.CSSProperties;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 44, style, message }) => {
    return (
        <div style={{ textAlign: 'center', padding: '60px 20px', ...style }}>
            <div className="spinner" style={{ width: size, height: size, margin: 'auto' }} />
            {message && <p style={{ color: '#8890b8', marginTop: 16, fontSize: '0.9rem' }}>{message}</p>}
        </div>
    );
};
