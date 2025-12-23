'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
    type: 'circle' | 'square' | 'heart';
    velocity: { x: number; y: number };
}

interface ConfettiProps {
    isActive: boolean;
    duration?: number;
    particleCount?: number;
    onComplete?: () => void;
}

const colors = [
    '#ff6b9d', // Pink
    '#c44cff', // Purple
    '#ff9f43', // Orange
    '#ffeaa7', // Yellow
    '#74b9ff', // Blue
    '#55efc4', // Mint
    '#fd79a8', // Rose
];

const HeartShape = ({ color, size }: { color: string; size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

export default function Confetti({
    isActive,
    duration = 3000,
    particleCount = 50,
    onComplete
}: ConfettiProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    const createParticles = useCallback(() => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
            const types: Particle['type'][] = ['circle', 'square', 'heart'];
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: -10 - Math.random() * 20,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 8 + Math.random() * 12,
                type: types[Math.floor(Math.random() * types.length)],
                velocity: {
                    x: (Math.random() - 0.5) * 4,
                    y: 2 + Math.random() * 4
                }
            });
        }
        setParticles(newParticles);
    }, [particleCount]);

    useEffect(() => {
        if (isActive) {
            createParticles();
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, duration);
            return () => clearTimeout(timer);
        } else {
            setParticles([]);
        }
    }, [isActive, duration, createParticles, onComplete]);

    const renderParticle = (particle: Particle) => {
        switch (particle.type) {
            case 'heart':
                return <HeartShape color={particle.color} size={particle.size} />;
            case 'square':
                return (
                    <div
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: 2
                        }}
                    />
                );
            default:
                return (
                    <div
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: '50%'
                        }}
                    />
                );
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: `${particle.x}vw`,
                            y: `${particle.y}vh`,
                            rotate: 0,
                            opacity: 1,
                            scale: 0
                        }}
                        animate={{
                            x: `${particle.x + particle.velocity.x * 20}vw`,
                            y: '120vh',
                            rotate: particle.rotation + 720,
                            opacity: [1, 1, 0],
                            scale: [0, 1.2, 1]
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: duration / 1000,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        className="absolute"
                    >
                        {renderParticle(particle)}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
