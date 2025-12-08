import { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import ClientListView from "../components/admin/clients/ClientListView";
import ClientFormModal from "../components/admin/clients/ClientFormModal";

const Clients = () => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowFormModal(true);
  };

  const handleEditClient = (clientId: string) => {
    setEditingClient(clientId);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingClient(null);
    // Trigger refresh of the client list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Gestion des Clients</h1>
          <p className="text-slate-400 text-sm">Créez et gérez vos espaces clients multi-tenant</p>
        </div>
        <Button
          onClick={handleCreateClient}
          className="scifi-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Client List */}
      <ClientListView key={refreshTrigger} onEditClient={handleEditClient} />

      {/* Client Form Modal */}
      {showFormModal && (
        <ClientFormModal
          clientId={editingClient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Clients;
