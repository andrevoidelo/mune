import React from 'react';
import { LogEntry } from '../types';

interface OracleIronViewProps {
  addLog: (entry: LogEntry) => void;
}

const OracleIronView: React.FC<OracleIronViewProps> = ({ addLog }) => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center text-txt-muted">
        <h2 className="text-2xl font-bold mb-2">Ironsworn</h2>
        <p>Em breve...</p>
    </div>
  );
};

export default OracleIronView;
