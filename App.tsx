import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { PrefectureSelector } from './components/PrefectureSelector';
import { DoctorList } from './components/DoctorList';
import { Loading } from './components/Loading';
import { Prefecture, AppStatus, SearchResult } from './types';
import { fetchTobanI } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedPrefecture, setSelectedPrefecture] = useState<Prefecture | null>(null);
  const [data, setData] = useState<SearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSelectPrefecture = useCallback(async (pref: Prefecture) => {
    setSelectedPrefecture(pref);
    setStatus(AppStatus.LOADING);
    setData(null);
    setErrorMsg('');

    try {
      const result = await fetchTobanI(pref.name);
      setData(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
      setStatus(AppStatus.ERROR);
    }
  }, []);

  const handleBack = useCallback(() => {
    setStatus(AppStatus.IDLE);
    setSelectedPrefecture(null);
    setData(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (selectedPrefecture) {
      handleSelectPrefecture(selectedPrefecture);
    }
  }, [selectedPrefecture, handleSelectPrefecture]);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <Header 
        title={selectedPrefecture ? `${selectedPrefecture.name}の当番医` : "当番医検索"} 
        onBack={status !== AppStatus.IDLE ? handleBack : undefined}
      />

      <main className="max-w-md mx-auto min-h-[calc(100vh-3.5rem)]">
        {status === AppStatus.IDLE && (
          <PrefectureSelector onSelect={handleSelectPrefecture} />
        )}

        {status === AppStatus.LOADING && (
          <Loading />
        )}

        {status === AppStatus.SUCCESS && data && selectedPrefecture && (
          <DoctorList 
            hospitals={data.hospitals} 
            groundingSources={data.groundingSources} 
            summary={data.summary}
            prefectureName={selectedPrefecture.name}
          />
        )}

        {status === AppStatus.ERROR && (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">エラーが発生しました</h3>
            <p className="text-gray-600 mb-6">{errorMsg}</p>
            <button 
              onClick={handleRetry}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-teal-700 transition-colors"
            >
              再試行する
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;