import { ContactShadows, Environment, Text } from "@react-three/drei";
import { Suspense, useContext, useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar/Avatar";
import { ChatContext } from "../../contexts/ChatContext/ChatContext";

const Dots = (props) => {
  // Removed loading dots - they were showing as "three points" above avatar
  return null;
};

export const Experience = () => {
  return (
    <>
      <Environment preset="sunset" />
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      <Avatar />
      <ContactShadows opacity={0.7} />
    </>
  );
};
