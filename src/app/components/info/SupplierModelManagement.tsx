// File: src/app/components/SupplierModelManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import SupplierSidebar from './SupplierSidebar';
import SupplierDetailPane from './SupplierDetailPane';
import AddSupplierModal from './AddSupplierModal';
import EditSupplierModal from './EditSupplierModal';
import AddModelModal from './AddModelModal';
import EditModelModal from './EditModelModal';
import type { Supplier, Model } from '@/lib/models/model';

interface Props {
  onClose: () => void;
}

export default function SupplierModelManagement({ onClose }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showEditSupplier, setShowEditSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showEditModel, setShowEditModel] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  const fetchSuppliers = async () => {
    const res = await fetch('/api/suppliers');
    if (res.ok) {
      const data: Supplier[] = await res.json();
      data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      setSuppliers(data);
      if (!selectedSupplier) setSelectedSupplier(data.find(s => s.isDefault) || data[0] || null);
    }
  };

  const fetchModels = async (supplierId: string) => {
    const res = await fetch(`/api/models?supplier_id=${supplierId}`);
    if (res.ok) {
      const data: Model[] = await res.json();
      data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      setModels(data);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);
  useEffect(() => { if (selectedSupplier) fetchModels(selectedSupplier.id); else setModels([]); }, [selectedSupplier]);

  return (
      <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
      >
        <div
            className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex"
            onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="关闭"
          >
            ×
          </button>
          <SupplierSidebar
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onSelect={setSelectedSupplier}
              onAdd={() => setShowAddSupplier(true)}
          />
          <SupplierDetailPane
              supplier={selectedSupplier}
              models={models}
              onEditSupplier={s => { setEditingSupplier(s); setShowEditSupplier(true); }}
              onAddModel={() => setShowAddModel(true)}
              onEditModel={m => { setEditingModel(m); setShowEditModel(true); }}
          />

          {showAddSupplier && (
              <AddSupplierModal
                  onClose={() => setShowAddSupplier(false)}
                  onSaved={() => { setShowAddSupplier(false); fetchSuppliers(); }}
              />
          )}
          {showEditSupplier && editingSupplier && (
              <EditSupplierModal
                  supplier={editingSupplier}
                  onClose={() => setShowEditSupplier(false)}
                  onSaved={() => { setShowEditSupplier(false); fetchSuppliers(); }}
              />
          )}
          {showAddModel && selectedSupplier && (
              <AddModelModal
                  supplierId={selectedSupplier.id}
                  onClose={() => setShowAddModel(false)}
                  onSaved={() => { setShowAddModel(false); fetchModels(selectedSupplier.id); }}
              />
          )}
          {showEditModel && editingModel && (
              <EditModelModal
                  model={editingModel}
                  onClose={() => setShowEditModel(false)}
                  onSaved={() => { setShowEditModel(false); fetchModels(selectedSupplier!.id); }}
              />
          )}
        </div>
      </div>
  );
}