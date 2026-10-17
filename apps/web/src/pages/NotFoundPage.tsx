import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">This share could not be found.</h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        The link you followed does not exist, has an incorrect address, or has already been permanently deleted.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
};
