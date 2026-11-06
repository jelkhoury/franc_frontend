import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import OTPVerification from './OTPVerification';
import Signup from './SignUp';
import Login from './LogIn';
import { AuthContext } from './AuthContext';
import { post } from '../utils/httpServices';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockToast = jest.fn();
let mockLocation = {state: {email:'test@ua.edu.lb'}};
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  Link: ({children,to}) => require('react').createElement('a',{href:to},children),
}), {virtual:true});
jest.mock('@chakra-ui/react', () => ({...jest.requireActual('@chakra-ui/react'), useToast:()=>mockToast}));
jest.mock('../utils/httpServices', () => ({post:jest.fn()}));
jest.mock('../utils/sentryUtils', () => ({captureError:jest.fn()}));

function renderAccount(component) {
  return render(<ChakraProvider><AuthContext.Provider value={{login:mockLogin}}>{component}</AuthContext.Provider></ChakraProvider>);
}
function enterCode() {
  screen.getAllByRole('textbox').forEach(input => fireEvent.change(input,{target:{value:'1'}}));
}
function token() {
  return 'header.' + btoa(JSON.stringify({
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier':'42',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name':'Test User',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role':'User',
    exp:Math.floor(Date.now()/1000)+3600,
  })) + '.synthetic-signature';
}
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear(); mockLocation={state:{email:'test@ua.edu.lb'}};
});

test('verification accepts six digits and uses only the verified-response token', async () => {
  const jwt=token(); post.mockResolvedValue({message:'Verification successful!',token:jwt});
  renderAccount(<OTPVerification/>);
  expect(screen.getAllByRole('textbox')).toHaveLength(6);
  enterCode(); fireEvent.click(screen.getByRole('button',{name:'Verify'}));
  await waitFor(()=>expect(mockLogin).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith('/api/users/verify-code?email=test%40ua.edu.lb&code=111111',undefined,{token:''});
  expect(localStorage.getItem('token')).toBe(jwt);
  expect(mockNavigate).toHaveBeenCalledWith('/');
});

test('verification without a token never falls back to token-by-email', async () => {
  post.mockResolvedValue({message:'Verification successful!'});
  renderAccount(<OTPVerification/>); enterCode();
  fireEvent.click(screen.getByRole('button',{name:'Verify'}));
  await waitFor(()=>expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({status:'error'})));
  expect(post).toHaveBeenCalledTimes(1);
  expect(mockLogin).not.toHaveBeenCalled();
  expect(localStorage.getItem('token')).toBeNull();
});

test('signup with no JWT goes to verification without logging in', async () => {
  post.mockResolvedValue({message:'Signup successful!',requiresVerification:true});
  renderAccount(<Signup/>);
  fireEvent.change(screen.getByLabelText(/First Name/),{target:{value:'Test'}});
  fireEvent.change(screen.getByLabelText(/Last Name/),{target:{value:'User'}});
  fireEvent.change(screen.getByLabelText(/Email address/i),{target:{value:'test@ua.edu.lb'}});
  fireEvent.change(screen.getByLabelText(/^Password/),{target:{value:'Password123!'}});
  fireEvent.click(screen.getByRole('button',{name:'Sign up'}));
  await waitFor(()=>expect(mockNavigate).toHaveBeenCalledWith('/otp-verification',expect.objectContaining({state:expect.objectContaining({email:'test@ua.edu.lb'})})));
  expect(mockLogin).not.toHaveBeenCalled();
  expect(localStorage.getItem('token')).toBeNull();
});

test('login recognizes the stable unverified-account error in production', async () => {
  jest.useFakeTimers();
  try {
    post.mockRejectedValue(Object.assign(new Error('Request failed with status 403'),{details:{code:'account_not_verified'}}));
    renderAccount(<Login/>);
    fireEvent.change(screen.getByLabelText(/Email address/i),{target:{value:'test@ua.edu.lb'}});
    fireEvent.change(screen.getByLabelText(/^Password/),{target:{value:'Password123!'}});
    fireEvent.click(screen.getByRole('button',{name:'Log in'}));
    await waitFor(()=>expect(mockToast).toHaveBeenCalled());
    act(()=>jest.advanceTimersByTime(2100));
    expect(mockNavigate).toHaveBeenCalledWith('/otp-verification',expect.objectContaining({state:expect.objectContaining({shouldSendCode:true})}));
  } finally { jest.useRealTimers(); }
});
