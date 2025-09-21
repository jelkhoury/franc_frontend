import React, { useContext, useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { ChatContext } from '../../contexts/ChatContext/ChatContext';

export function SimpleAvatar(props) {
  const { interviewer, message, loading } = useContext(ChatContext);
  const meshRef = useRef();
  const headRef = useRef();
  const mouthRef = useRef();
  const [isTalking, setIsTalking] = useState(false);

  // Track when avatar is speaking
  useEffect(() => {
    const talking = !!message; // Remove loading check - avatar should talk when message exists
    setIsTalking(talking);
    console.log('Avatar talking state:', talking, 'message:', message, 'loading:', loading);
  }, [message, loading]);

  // Enhanced animation based on talking state
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isTalking) {
        // Professional talking animation - subtle movement
        meshRef.current.rotation.y = Math.sin(time * 1) * 0.05; // Very gentle sway
        meshRef.current.position.y = Math.sin(time * 1.5) * 0.02; // Minimal vertical movement
        meshRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.01); // Very subtle scaling
        
        // Professional head nodding while talking - very subtle
        if (headRef.current) {
          headRef.current.rotation.x = Math.sin(time * 1) * 0.02; // Very gentle nodding
        }
        
        // Professional mouth animation - subtle and controlled
        if (mouthRef.current) {
          // Professional mouth opening - subtle and controlled
          const mouthOpenness = Math.abs(Math.sin(time * 6)); // 0 to 1 (closed to open)
          const mouthScale = 0.4 + mouthOpenness * 0.8; // Scale from 0.4 (closed) to 1.2 (moderately open)
          
          // Apply scaling to make mouth look like it's opening vertically
          mouthRef.current.scale.set(1, mouthScale, 1); // Scale Y more than X/Z for mouth opening
          mouthRef.current.position.y = 1.05 + mouthOpenness * 0.02; // Very subtle vertical movement
          
          // Debug: Log mouth animation every 60 frames
          if (Math.floor(time * 60) % 60 === 0) {
            console.log('Simple Professional Mouth animating - openness:', mouthOpenness, 'scale:', mouthScale);
          }
        }
      } else {
        // Idle animation - gentle sway
        meshRef.current.rotation.y = Math.sin(time) * 0.1;
        meshRef.current.position.y = Math.sin(time * 2) * 0.05;
        meshRef.current.scale.setScalar(1);
        
        // Reset head position
        if (headRef.current) {
          headRef.current.rotation.x = 0;
        }
        
        // Reset mouth position - keep mouth closed when not talking
        if (mouthRef.current) {
          mouthRef.current.scale.set(1, 0.3, 1); // Keep mouth mostly closed
          mouthRef.current.position.y = 1.05;
        }
      }
    }
  });

  return (
    <group {...props}>
      {/* Simple avatar representation */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1.8, 0.4]} />
        <meshStandardMaterial color="#8B5CF6" />
      </mesh>
      
      {/* Head with ref for animation */}
      <mesh ref={headRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#F3E8FF" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 1.2, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>
      <mesh position={[0.1, 1.2, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>
      
      {/* Animated Mouth - Main mouth */}
      <mesh ref={mouthRef} position={[0, 1.05, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>
      
      {/* Mouth outline for better visibility */}
      <mesh position={[0, 1.05, 0.24]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#991B1B" />
      </mesh>
      
      {/* Additional mouth detail */}
      <mesh position={[0, 1.05, 0.23]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#7F1D1D" />
      </mesh>
      
      {/* Talking indicator - pulsing circle around avatar */}
      {isTalking && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial 
            color="#10B981" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Name label */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {interviewer?.label || "WorkWise Interviewer"}
      </Text>
      
      {/* Status text with animation */}
      {isTalking && (
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.1}
          color="#10B981"
          anchorX="center"
          anchorY="middle"
        >
          🎤 Speaking...
        </Text>
      )}
      
    </group>
  );
}
