import React, { createContext, useContext, useState } from "react";

export const InterviewContext = createContext();

const InterviewProvider = ({ children }) => {
  const [interviewer, setInterviewer] = useState({
    label: "WorkWise Interviewer",
    description: "The default interviewer avatar and tonality.",
    characteristics: "Default HR interviewer personality",
    voiceId: "jsCqWAovK2LkecY7zXl4",
  });

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);

  const interviewers = [
    {
      label: "The Jazzar",
      description: "Technical Interviewer with strict dialogue, and somehow, funny.",
      characteristics: "You sometimes make fun of the candidate, and you are strict with your answers.",
      voiceId: "29vD33N1CtxCmqQRPOHJ",
    },
    {
      label: "The Dev Lord",
      description: "Be careful, don't mess with him in coding!",
      characteristics: "You do not accept false answers to coding question. Other then that act like a normal HR interviewer. You are so calm and strict with answers",
      voiceId: "iP95p4xoKVk53GoZ742B",
    },
    {
      label: "The Recruitment General",
      description: "A sharp HR interviewer who values precision.",
      characteristics: "You pay full attention to details, and you are strict. You are not fun and you are picky",
      voiceId: "ThT5KcBeYPX3keUQqHPh",
    },
    {
      label: "The Color Queen",
      description: "You can feel her flowery vibe.",
      characteristics: "Very fun, a cool and lovely HR",
      voiceId: "AZnzlk1XvdvUeBnXmlld",
    },
    {
      label: "The Careerster",
      description: "Straight to the point questions? This one is for you.",
      characteristics: "You are energetic in a calm way, but you are also straight to the point",
      voiceId: "oWAxZDx7w5VEj9dCyTzz",
    },
    {
      label: "WorkWise Interviewer",
      description: "The default interviewer avatar and tonality.",
      characteristics: "Default HR interviewer personality",
      voiceId: "jsCqWAovK2LkecY7zXl4",
    },
  ];

  const selectInterviewer = (selectedInterviewer) => {
    setInterviewer(selectedInterviewer);
  };

  const setQuestion = (question) => {
    setCurrentQuestion(question);
  };

  const nextQuestion = () => {
    setQuestionIndex(prev => prev + 1);
  };

  const resetInterview = () => {
    setQuestionIndex(0);
    setCurrentQuestion(null);
  };

  return (
    <InterviewContext.Provider
      value={{
        interviewer,
        selectInterviewer,
        interviewers,
        currentQuestion,
        setQuestion,
        questionIndex,
        nextQuestion,
        resetInterview,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export default InterviewProvider;
