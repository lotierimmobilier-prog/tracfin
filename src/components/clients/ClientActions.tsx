import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit2, FileSignature, Trash2 } from 'lucide-react';
import type { Database } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientActionsProps {
  client: Client;
  onView: () => void;
  onEdit: () => void;
  onSign: () => void;
  onDelete: () => void;
  isSigned?: boolean;
}

export function ClientActions({ onView, onEdit, onSign, onDelete, isSigned }: ClientActionsProps) {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-slate-100 rounded-lg transition"
      >
        <MoreVertical className="w-5 h-5 text-slate-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onView);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition text-left"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-700">Consulter la fiche</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onEdit);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition text-left"
          >
            <Edit2 className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-700">Modifier la fiche</span>
          </button>

          <div className="border-t border-slate-200 my-2"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onSign);
            }}
            disabled={isSigned && !isAdmin}
            className={`w-full flex items-center gap-3 px-4 py-2 transition text-left ${
              isSigned && !isAdmin
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-slate-50'
            }`}
          >
            <FileSignature className={`w-4 h-4 ${isSigned ? 'text-green-600' : 'text-blue-600'}`} />
            <span className="text-sm text-slate-700">
              {isSigned ? (isAdmin ? 'Voir/Annuler la signature' : 'Signature verrouillée') : 'Signer la déclaration'}
            </span>
          </button>

          <div className="border-t border-slate-200 my-2"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onDelete);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-left"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">Supprimer</span>
          </button>
        </div>
      )}
    </div>
  );
}
