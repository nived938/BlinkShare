import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-20 p-8 text-center bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl text-white">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-center border border-zinc-800">
        <FileQuestion className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">This share could not be found.</h2>
      <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
        The link you followed does not exist, has an incorrect address, or has already been permanently deleted.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-black" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
};
