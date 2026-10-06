'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { customerRecognitionApi, type RecognizedCustomerView } from './api';
import { clearRecognitionToken, getRecognitionToken, saveRecognitionToken } from './customerRecognition';

// checking     - looking up this browser's saved identity (Case 3)
// ask          - unknown browser: "Have you ordered here before?" (Case 2)
// returning    - existing customer on a new browser: phone only
// new          - new customer: name + phone (Case 1)
// welcome      - just identified: "Welcome back, X / Ordering as ..."
// recognized   - identified; final review shows the read-only customer
// nameOnly     - recognition skipped/unavailable: plain Part 1.6 name field
export type RecognitionPhase = 'checking' | 'ask' | 'returning' | 'new' | 'welcome' | 'recognized' | 'nameOnly';

const UNAVAILABLE_MESSAGE = "We couldn't check your details just now. You can continue with just your name.";

// Recognition is a convenience. Nothing here can block ordering: every failure
// path ends in `nameOnly`, where the customer types a name and orders.
export function useCustomerRecognition(restaurantId: string) {
  const [phase, setPhaseState] = useState<RecognitionPhase>('checking');
  const [customer, setCustomer] = useState<RecognizedCustomerView | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const phaseRef = useRef<RecognitionPhase>('checking');

  const setPhase = useCallback((next: RecognitionPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCustomer(null);
    setMessage(null);
    const token = getRecognitionToken(restaurantId);
    if (!token) {
      setPhase('ask');
      return;
    }
    setPhase('checking');
    customerRecognitionApi.resolve(restaurantId, token).then((result) => {
      // Ignore a late answer if the customer already chose to skip.
      if (cancelled || phaseRef.current !== 'checking') return;
      if (result.status === 'recognized') {
        setCustomer(result.customer);
        setPhase('recognized');
      } else if (result.status === 'unrecognized') {
        // Invalid token, other-restaurant token or deleted customer: discard it.
        clearRecognitionToken(restaurantId);
        setPhase('ask');
      } else {
        // Keep the token (the outage may be temporary) but never block ordering.
        setMessage(UNAVAILABLE_MESSAGE);
        setPhase('nameOnly');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, setPhase]);

  const handleIdentified = useCallback(
    (result: Awaited<ReturnType<typeof customerRecognitionApi.returning>>) => {
      if (result.status === 'recognized' && result.token) {
        saveRecognitionToken(restaurantId, result.token);
        setCustomer(result.customer);
        setMessage(null);
        setPhase('welcome');
        return true;
      }
      return false;
    },
    [restaurantId, setPhase],
  );

  const submitReturning = useCallback(
    async (phone: string) => {
      setBusy(true);
      setMessage(null);
      const result = await customerRecognitionApi.returning(restaurantId, phone);
      setBusy(false);
      if (handleIdentified(result)) return;
      if (result.status === 'not_found') {
        // Case D: offer registration; the typed number carries over in the form.
        setMessage("We couldn't find that number here. No problem — let's set you up.");
        setPhase('new');
      } else if (result.status === 'invalid') {
        setMessage(result.message);
      } else {
        setMessage(UNAVAILABLE_MESSAGE);
      }
    },
    [restaurantId, handleIdentified, setPhase],
  );

  const submitNew = useCallback(
    async (name: string, phone: string) => {
      setBusy(true);
      setMessage(null);
      const result = await customerRecognitionApi.register(restaurantId, name, phone);
      setBusy(false);
      if (handleIdentified(result)) return;
      setMessage(result.status === 'invalid' ? result.message : UNAVAILABLE_MESSAGE);
    },
    [restaurantId, handleIdentified],
  );

  // Case 4. Clears this restaurant's identity only (cart, table, admin session
  // and other restaurants are untouched) and asks the server to revoke it.
  const changeCustomer = useCallback(() => {
    const token = getRecognitionToken(restaurantId);
    clearRecognitionToken(restaurantId);
    if (token) void customerRecognitionApi.forget(restaurantId, token);
    setCustomer(null);
    setMessage(null);
    setPhase('ask');
  }, [restaurantId, setPhase]);

  return {
    phase,
    customer,
    busy,
    message,
    chooseReturning: () => { setMessage(null); setPhase('returning'); },
    chooseNew: () => { setMessage(null); setPhase('new'); },
    backToAsk: () => { setMessage(null); setPhase('ask'); },
    useNameOnly: () => { setMessage(null); setPhase('nameOnly'); },
    confirmWelcome: () => setPhase('recognized'),
    submitReturning,
    submitNew,
    changeCustomer,
  };
}

export type CustomerRecognitionState = ReturnType<typeof useCustomerRecognition>;
