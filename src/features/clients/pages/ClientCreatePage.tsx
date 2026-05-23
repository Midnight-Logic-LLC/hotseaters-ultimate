/**
 * ClientCreatePage — convenience standalone route. Most flows open the
 * `ClientFormSheet` from the list page, but a deep-linkable create page
 * mirrors MVP's `NewClientLayout` URL pattern.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientFormSheet } from '@/features/clients/components/ClientFormSheet';

export function ClientCreatePage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  return (
    <div className="p-6">
      <ClientFormSheet
        open={open}
        onClose={() => {
          setOpen(false);
          navigate('/Clients');
        }}
        onSaved={(saved) => navigate(`/Clients/${saved.id}`)}
      />
    </div>
  );
}
