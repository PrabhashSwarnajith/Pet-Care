import React from 'react';

interface ToastProps {
    message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div style={styles.toast}>
            {message}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    toast: {
        position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)', color: '#fff',
        padding: '12px 28px', borderRadius: 100, fontWeight: 600, fontSize: '0.9rem',
        zIndex: 2000, boxShadow: '0 8px 30px rgba(124,106,245,0.4)',
    }
};
