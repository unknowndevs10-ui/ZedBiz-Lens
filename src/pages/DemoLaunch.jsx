import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/common/States';
import { useData } from '../context/DataContext';

const SCENARIOS = {
  tomato: { scenarioHint: 'tomato', businessType: 'market trader', businessFormality: 'informal', businessName: 'Soweto Market Tomato Trader', province: 'Lusaka' },
  'mini-mart': { scenarioHint: 'mini-mart', businessType: 'grocery retail shop', businessFormality: 'registered', businessName: 'Kabulonga Mini-Mart', province: 'Lusaka' },
  'auto-spares': { scenarioHint: 'auto-spares', businessType: 'auto spares retailer', businessFormality: 'registered', businessName: 'Kitwe Auto-Spares Shop', province: 'Copperbelt' },
};

export default function DemoLaunch() {
  const { scenario = 'tomato' } = useParams();
  const { enterSyntheticDemo, exitSyntheticDemo, isSyntheticDemo } = useData();
  const [error, setError] = useState('');
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        if (isSyntheticDemo) await exitSyntheticDemo();
        await enterSyntheticDemo(SCENARIOS[scenario] || SCENARIOS.tomato);
      } catch (cause) { setError(cause.message || 'The sample workspace could not be opened.'); }
    })();
  }, [enterSyntheticDemo, exitSyntheticDemo, isSyntheticDemo, scenario]);
  if (isSyntheticDemo) return <Navigate to="/app/dashboard" replace />;
  if (error) return <main className="mx-auto max-w-xl px-5 py-20"><ErrorState title="Demo could not start" description={error} /></main>;
  return <main className="min-h-screen bg-surface px-5 py-24"><LoadingState label="Preparing your isolated synthetic workspace" /></main>;
}
