import React, { createContext, useContext, useState } from 'react';

const MockInterviewStateContext = createContext();

export const MockInterviewStateProvider = ({ children }) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [onExitConfirm, setOnExitConfirm] = useState(null);
  const [onExitCancel, setOnExitCancel] = useState(null);
  const [answeredQuestionsCount, setAnsweredQuestionsCount] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  return (
    <MockInterviewStateContext.Provider
      value={{
        isInterviewActive,
        setIsInterviewActive,
        showExitWarning,
        setShowExitWarning,
        onExitConfirm,
        setOnExitConfirm,
        onExitCancel,
        setOnExitCancel,
        answeredQuestionsCount,
        setAnsweredQuestionsCount,
        totalQuestionsCount,
        setTotalQuestionsCount,
      }}
    >
      {children}
    </MockInterviewStateContext.Provider>
  );
};

export const useMockInterviewState = () => {
  const context = useContext(MockInterviewStateContext);
  if (!context) {
    throw new Error('useMockInterviewState must be used within MockInterviewStateProvider');
  }
  return context;
};

