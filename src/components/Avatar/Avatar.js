import { useGLTF, useAnimations } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ChatContext } from "../../contexts/ChatContext/ChatContext";
import { SkeletonUtils } from "three-stdlib";
import { AuthContext } from "../AuthContext";
import { SimpleAvatar } from "./SimpleAvatar";
import AvatarErrorBoundary from "./AvatarErrorBoundary";
import { useNavigate } from "react-router-dom";

// Use public asset paths for GLB files - Focus on default avatar only
const AnimationsLady = "/assets/ai/animations.glb";
const AnimationsMan = "/assets/ai/animations_man.glb";
const DefaultModel = "/assets/ai/default.glb";

// Simplified model map - only default avatar
const modelMap = {
  "WorkWise Interviewer": DefaultModel,
  "default": DefaultModel,
};

// Simplified animations map - default uses AnimationsLady
const animationsMap = {
  default: [DefaultModel],
};

// Animation mapping for available GLB animations
const animationMapping = {
  "Talking": "Talking_0", // Default talking animation
  "Listening": "Idle",    // Use Idle for listening
  "Thinking": "Idle",     // Use Idle for thinking
  "Greeting": "Idle",     // Use Idle for greeting
  "Nodding": "Idle",      // Use Idle for nodding
  "Shaking": "Idle",      // Use Idle for shaking
  "Angry": "Angry",
  "Crying": "Crying", 
  "Laughing": "Laughing",
  "Rumba": "Rumba",
  "Terrified": "Terrified"
};

export function Avatar(props) {
  const { interviewer } = useContext(ChatContext);
  const modelPath = useMemo(
    () => modelMap[interviewer?.label] || DefaultModel,
    [interviewer?.label]
  );

  // Always call hooks first, before any conditional returns
  const {
    message,
    onMessagePlayed,
    isUserInteracted,
    setLoading,
  } = useContext(ChatContext);

  // GLB files are working! Let's use the actual GLB avatar with error boundary
  return (
    <AvatarErrorBoundary {...props}>
      <GLBAvatar {...props} />
    </AvatarErrorBoundary>
  );
}

// This is the full GLB Avatar component with your exact structure
export function GLBAvatar(props) {
  const navigate = useNavigate();
  const { interviewer } = useContext(ChatContext);
  const modelPath = useMemo(
    () => modelMap[interviewer?.label] || DefaultModel,
    [interviewer?.label]
  );

  const { scene } = useGLTF(modelPath);
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const {
    message,
    onMessagePlayed,
    chat,
    isUserInteracted,
    userInput,
    setAllMessages,
    allMessages,
    setStartChatting,
    ended,
    complete,
    setLoading,
  } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  // Handle user input
  useEffect(() => {
    console.log("triggered user input");
    if (userInput) {
      console.log("started the request");
      const message = { role: "user", content: userInput };
      setAllMessages([...allMessages, message]);
      setStartChatting(true);
    }
  }, [userInput]);

  // Handle message and animation changes - FIXED FOR YOUR CHATCONTEXT STRUCTURE
  useEffect(() => {
    if (!message || !isUserInteracted) {
      setAnimation("Idle");
      return;
    }

    // Extract animation from message.content.animation (based on your ChatContext)
    let animationType = message.content?.animation || message.animation || "Talking";
    
    // Map animation to available GLB animations
    const mappedAnimation = animationMapping[animationType] || animationType;
    
    // For talking animations, randomly select between Talking_0, Talking_1
    if (mappedAnimation === "Talking_0") {
      const talkingVariants = ["Talking_0", "Talking_1"];
      animationType = talkingVariants[Math.floor(Math.random() * talkingVariants.length)];
    } else {
      animationType = mappedAnimation;
    }
    
    setAnimation(animationType);

    // Extract audio from message.content.audio (based on your ChatContext)
    const audioData = message.content?.audio || message.audio;
    if (audioData) {
      // Check if it's a URL or base64 data
      if (audioData.startsWith('http') || audioData.startsWith('https')) {
        // It's a URL - use directly
        setAudio(new Audio(audioData));
      } else {
        // It's base64 data - add data URL prefix
        setAudio(new Audio("data:audio/mp3;base64," + audioData));
      }
    }
    
    console.log('Avatar received message:', {
      message,
      animationType,
      hasAudio: !!audioData,
      isUserInteracted
    });
  }, [message, isUserInteracted]);

  // Determine animations path - default uses AnimationsLady
  const animationsPath = useMemo(() => {
    return animationsMap.default.includes(modelPath)
      ? AnimationsLady
      : AnimationsLady; // Always use AnimationsLady for default
  }, [modelPath]);
  
  const { animations } = useGLTF(animationsPath);

  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState(
    animations.find((a) => a.name === "Idle") ? "Idle" : animations[0]?.name || "Idle"
  );

  // Debug: Log available animations and actions
  useEffect(() => {
    if (animations && animations.length > 0) {
      console.log('Available GLB Animations:', animations.map(a => a.name));
    }
    if (actions) {
      console.log('Available Actions:', Object.keys(actions));
    }
  }, [animations, actions]);

  // Play animations - ENHANCED WITH DEBUGGING
  useEffect(() => {
    console.log('Animation effect triggered:', { animation, hasActions: !!actions, hasAnimation: actions?.[animation] });
    
    if (actions && actions[animation]) {
      console.log(`Playing animation: ${animation}`);
      actions[animation]
        .reset()
        .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5)
        .play();
      return () => {
        if (actions && actions[animation]) {
          console.log(`Fading out animation: ${animation}`);
          actions[animation].fadeOut(0.5);
        }
      };
    } else {
      console.warn(`Animation not found: ${animation}. Available animations:`, actions ? Object.keys(actions) : 'No actions');
    }
  }, [animation, actions, mixer]);

  const [audio, setAudio] = useState();

  // Handle audio playback - YOUR EXACT STRUCTURE
  useEffect(() => {
    if (audio) {
      audio.play().catch((err) => console.error("Audio play failed:", err));
      setAudio(audio);
      audio.onended = () => {
        onMessagePlayed();
        setAudio(null);
        setLoading(false);
      };
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
        setAudio(null);
      }
    };
  }, [audio, onMessagePlayed, setLoading]);

  // Handle interview ending - YOUR EXACT STRUCTURE
  useEffect(() => {
    if (ended === true) {
      setTimeout(() => {
        if (audio && !audio.paused && !audio.ended && audio.currentTime > 0) {
          console.log("Audio is still playing. Waiting to execute ending mechanism.");
        } else {
          if (audio == null) {
            console.log("No audio playing. Executing ending mechanism immediately.");
            onMessagePlayed();
            complete();
            navigate("/interview");
          }
        }
      }, 1000);
    }
  }, [ended, audio, onMessagePlayed, complete, navigate]);

  // Handle user greeting - YOUR EXACT STRUCTURE
  useEffect(() => {
    if (user) {
      const message = {
        role: "user",
        content: `Hello my name is ${user.username}`,
      };
      chat([message]);
    }
  }, [user, chat]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      {Object.keys(nodes).map((key) => {
        const node = nodes[key];
        if (node.isSkinnedMesh) {
          return (
            <skinnedMesh
              key={key}
              geometry={node.geometry}
              material={materials[node.material?.name]}
              skeleton={node.skeleton}
              morphTargetDictionary={node.morphTargetDictionary}
              morphTargetInfluences={node.morphTargetInfluences}
            />
          );
        }
        return null;
      })}
    </group>
  );
}