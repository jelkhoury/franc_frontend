import { Canvas, useFrame } from "@react-three/fiber";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Experience } from "../Screen/Screen";
import { ChatContext } from "../../contexts/ChatContext/ChatContext";
import "./UIScreen.css";

const CameraSetup = () => {
  const cameraRef = useRef();

  return (
    <group>
      {useFrame(({ camera }) => {
        camera.position.set(0, 1.5, 1.4);
        camera.lookAt(0, 1.5, 0);
      })}
    </group>
  );
};

const UI = () => {
  const { isUserInteracted, setIsUserInteracted } = useContext(ChatContext);
  
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = (event) => {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you really want to leave?"
      );
      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    
    const enableAudioPlayback = () => {
      setIsUserInteracted(true);
      window.removeEventListener("click", enableAudioPlayback);
    };

    window.addEventListener("click", enableAudioPlayback);

    return () => {
      window.removeEventListener("click", enableAudioPlayback);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setIsUserInteracted]);

  return (
    <div className="h-full min-h-screen">
      {!isUserInteracted ? (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={() => setIsUserInteracted(true)}
            className="p-3 text-4xl font-bold text-white bg-blue-800 rounded-full w-52 h-52"
          >
            Click to Start
          </button>
        </div>
      ) : (
        <div className="relative h-full min-h-screen office-background">
          <Canvas
            shadows
            camera={{
              position: [0, 1.5, 2],
              fov: 30,
            }}
          >
            <CameraSetup />
            <Experience />
          </Canvas>
        </div>
      )}
    </div>
  );
};

export default UI;
