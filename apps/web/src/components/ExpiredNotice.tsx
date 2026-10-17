import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, PlusCircle } from 'lucide-react';

export const ExpiredNotice: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
        <Clock className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        This link has expired.
      </h2>

      <p className="text-sm text-slate-500 mb-8 leading-relaxed">
        Shared content is available for five minutes only. Once it expires, it is no longer accessible.
      </p>

      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/20 transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create a New Share</span>
        </Link>
      </div>
    </div>
  );
};
