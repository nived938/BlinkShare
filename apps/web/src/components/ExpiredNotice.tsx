import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, PlusCircle } from 'lucide-react';

export const ExpiredNotice: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-16 p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl text-white">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-900 flex items-center justify-center text-white border border-zinc-800">
        <Clock className="w-8 h-8 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
        This link has expired.
      </h2>

      <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
        Shared content is available for five minutes only. Once it expires, it is permanently purged and no longer accessible.
      </p>

      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black bg-white hover:bg-zinc-200 shadow-sm transition-all hover:scale-105 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          <span>Create a New Share</span>
        </Link>
      </div>
    </div>
  );
};
