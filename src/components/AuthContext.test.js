import React, { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, AuthContext } from './AuthContext';

jest.mock('../utils/sentryUtils', () => ({captureError:jest.fn()}));

function Consumer() {
  const {isLoggedIn,authInitialized,logout}=useContext(AuthContext);
  return <><span>{authInitialized ? (isLoggedIn ? 'Signed in' : 'Signed out') : 'Loading'}</span><button onClick={logout}>Log out</button></>;
}
function setToken(exp) {
  localStorage.setItem('token','header.'+btoa(JSON.stringify({exp}))+'.synthetic-signature');
  localStorage.setItem('userId','42');
  localStorage.setItem('userRole','User');
}
beforeEach(()=>localStorage.clear());

test('no token keeps an unverified signup signed out after reload', async()=>{
  render(<AuthProvider><Consumer/></AuthProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
});
test('an expired token clears identity instead of restoring a session', async()=>{
  setToken(Math.floor(Date.now()/1000)-60);
  render(<AuthProvider><Consumer/></AuthProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('userId')).toBeNull();
});
test('a valid token restores a session and logout removes its identity', async()=>{
  setToken(Math.floor(Date.now()/1000)+3600);
  render(<AuthProvider><Consumer/></AuthProvider>);
  expect(await screen.findByText('Signed in')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Log out'}));
  expect(screen.getByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('userRole')).toBeNull();
});
