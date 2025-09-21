import { createContext, useContext, useEffect, useState } from "react";
import { InterviewContext } from "../InterviewContext/InterviewContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [allMessages, setAllMessages] = useState([]);
  const [userInput, setUserInput] = useState(null);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [startChatting, setStartChatting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const { interviewer, currentQuestion } = useContext(InterviewContext);

  useEffect(() => {
    return () => {
      setMessage(null);
      setAllMessages([]);
      setMessages([]);
      setLoading(false);
      setEnded(false);
      setIsUserInteracted(false);
    };
  }, []);

  useEffect(() => {
    if (startChatting) {
      chat(allMessages);
    }
  }, [startChatting]);

  // Simulate AI response for mock interview questions
  const chat = async (messages) => {
    if (!messages || messages.length === 0) {
      return;
    }
    
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a mock response based on the current question
    const responseText = currentQuestion?.title || "Welcome to your mock interview!";
    const mockResponse = {
      content: {
        text: responseText,
        audio: generateMockAudio(), // This would be base64 audio data
        animation: "Talking",
        isCompleted: false
      },
      role: "assistant"
    };
    
    setMessage(mockResponse.content);
    setMessages([...messages, mockResponse.content]);
    setAllMessages([
      ...allMessages,
      {
        role: mockResponse.role,
        content: mockResponse.content.text,
      },
    ]);
    
    // Start text-to-speech
    await speakText(responseText, interviewer?.voiceId);
    
    setUserInput(null);
    setStartChatting(false);
    setLoading(false);
  };

  // Generate mock base64 audio data (in real implementation, this would come from your AI service)
  const generateMockAudio = () => {
    // This is a placeholder - in real implementation, you'd get this from your AI service
    return "mock_audio_base64_data";
  };

  // Play audio file for avatar interaction (supports M4A, MP4, MP3, WAV)
  const playAudioFile = async (audioPath, text = "Speaking...") => {
    try {
      return new Promise((resolve, reject) => {
        console.log('Attempting to load audio file:', audioPath);
        
        // Set message state to trigger talking animation
        setMessage({ text, animation: "Talking" });
        setLoading(true);
        
        const audio = new Audio(audioPath);
        
        // Set audio properties
        audio.preload = 'auto';
        audio.volume = 0.8;
        
        audio.onloadstart = () => {
          console.log('Audio loading started');
        };
        
        audio.onloadeddata = () => {
          console.log('Audio file loaded successfully');
        };
        
        audio.oncanplay = () => {
          console.log('Audio can start playing');
        };
        
        audio.oncanplaythrough = () => {
          console.log('Audio can play through without buffering');
          audio.play().then(() => {
            console.log('Audio file started playing');
          }).catch((error) => {
            console.warn('Failed to play audio file:', error);
            setLoading(false);
            setMessage(null);
            resolve(); // Continue even if audio fails
          });
        };
        
        audio.onended = () => {
          console.log('Audio file finished playing');
          setLoading(false);
          setMessage(null);
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('Audio file error:', error);
          console.error('Audio error details:', {
            error: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src
          });
          setLoading(false);
          setMessage(null);
          resolve(); // Continue even if audio fails
        };
        
        audio.onabort = () => {
          console.warn('Audio loading aborted');
          setLoading(false);
          setMessage(null);
          resolve();
        };
        
        // Load the audio file
        audio.load();
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (audio.readyState < 3) { // HAVE_FUTURE_DATA
            console.warn('Audio loading timeout');
            setLoading(false);
            setMessage(null);
            resolve();
          }
        }, 10000);
      });
    } catch (error) {
      console.warn('Audio file failed:', error);
      setLoading(false);
      setMessage(null);
      return Promise.resolve();
    }
  };

  // Text-to-Speech function for avatar interaction (fallback)
  const speakText = async (text, voiceId = null) => {
    try {
      // Set message state to trigger talking animation
      setMessage({ text, animation: "Talking" });
      setLoading(true);
      
      // Use Web Speech API for browser-based text-to-speech
      if ('speechSynthesis' in window) {
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Set voice if available
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            // Try to find a suitable voice
            const selectedVoice = voices.find(voice => 
              voice.name.includes('Google') || 
              voice.name.includes('Microsoft') ||
              voice.name.includes('English')
            ) || voices[0];
            utterance.voice = selectedVoice;
          }
          
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          
          utterance.onend = () => {
            setLoading(false);
            setMessage(null);
            resolve();
          };
          utterance.onerror = () => {
            setLoading(false);
            setMessage(null);
            resolve(); // Continue even if TTS fails
          };
          
          speechSynthesis.speak(utterance);
        });
      }
      setLoading(false);
      setMessage(null);
      return Promise.resolve();
    } catch (error) {
      console.warn('Text-to-speech failed:', error);
      setLoading(false);
      setMessage(null);
      return Promise.resolve();
    }
  };

  const complete = async () => {
    if (!allMessages) {
      return;
    }
    
    // Simulate completion API call
    console.log("Interview completed:", allMessages);
    setEnded(true);
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
    setMessage(null);
  };

  const startQuestion = (question) => {
    const message = {
      role: "user",
      content: `Please ask me this question: ${question.title}`,
    };
    setAllMessages([message]);
    setStartChatting(true);
  };

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        isUserInteracted,
        setIsUserInteracted,
        setLoading,
        setUserInput,
        userInput,
        allMessages,
        setAllMessages,
        setStartChatting,
        ended,
        complete,
        startQuestion,
        interviewer,
        speakText,
        playAudioFile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
