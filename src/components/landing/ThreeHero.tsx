'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function FloatingShape({ position, color, speed, rotationIntensity, scale }: any) {
    const mesh = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        mesh.current.rotation.x = Math.cos(t / 4) * 0.2 + rotationIntensity;
        mesh.current.rotation.y = Math.sin(t / 4) * 0.2 + rotationIntensity;
        mesh.current.position.y = (Math.sin(t / speed) * 0.2) + position[1];
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <mesh ref={mesh} position={position} scale={scale}>
                <icosahedronGeometry args={[1, 0]} />
                <meshPhysicalMaterial
                    color={color}
                    roughness={0}
                    metalness={0.1}
                    transmission={0.9} // Glass effect
                    thickness={1.5}
                />
            </mesh>
        </Float>
    );
}

function FloatingHeart({ position, scale, color }: any) {
    const shape = new THREE.Shape();
    const x = -0.5;
    const y = -0.5;
    shape.moveTo(x + 0.5, y + 0.5);
    shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1, y);
    shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    const extrudeSettings = {
        steps: 2,
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 2,
    };

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh position={position} scale={scale} rotation={[0, 0, Math.PI]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
        </Float>
    );
}

export default function ThreeHero() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={1} />

                {/* Main large shapes */}
                <FloatingShape position={[3, 1, 0]} color="#8b5cf6" speed={2} rotationIntensity={0.5} scale={1.5} />
                <FloatingShape position={[-3, -1, -2]} color="#ec4899" speed={3} rotationIntensity={0.5} scale={1.2} />

                {/* Floating Hearts */}
                <FloatingHeart position={[1.5, 2, 1]} scale={0.3} color="#f472b6" />
                <FloatingHeart position={[-2, 2.5, -1]} scale={0.2} color="#a78bfa" />
                <FloatingHeart position={[0, -2, 2]} scale={0.25} color="#fb7185" />

                <Environment preset="city" />
                <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
            </Canvas>
        </div>
    );
}
