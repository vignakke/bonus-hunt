"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, BarChart3, History, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast" // Assurez-vous que ce hook existe et est correctement importé
import SessionHistory from "@/components/session-history" // Assurez-vous que ce composant existe
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlgoliaSlotSearch } from "@/components/algolia-slot-search" // Importation du composant modifié

// Structure exacte des données retournées par l'API Algolia
interface Provider {
  id: string
  name: string
}

interface SlotMachineHit {
  id: string
  thumbnailUrl: string
  name: string
  slug: string
  provider: Provider
  createdAt: string
  favorite: boolean
  reviewed: boolean
  objectID: string
  _highlightResult?: any
}

interface BonusEntry {
  id: string // Assurez-vous que chaque entry a un id unique
  machine: string
  mise: number
  gains: number
  multiplicateur: number
  machineData?: SlotMachineHit
}

interface Session {
  id: string
  name: string
  date: string
  bonusEntries: BonusEntry[]
  startBalance: number
  stats: {
    totalMises: number
    totalGains: number
    gainBrut: number
    gainNet: number
    nombreBonus: number
    miseMoyenne: number
    bestBonus?: {
      machine: string
      gains: number
      multiplicateur: number
    }
    worstBonus?: {
      machine: string
      gains: number
      multiplicateur: number
    }
  }
}

export default function BonusHuntPage() {
  const { toast } = useToast(); // Initialisation du hook toast

  const [bonusEntries, setBonusEntries] = useState<BonusEntry[]>([]);
  const [startBalance, setStartBalance] = useState<number>(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [sessionName, setSessionName] = useState<string>(`Session du ${new Date().toLocaleDateString()}`);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // NOUVEL ÉTAT pour suivre le dropdown actif
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    setIsLoading(true);
    const savedSessions = localStorage.getItem("bonusHuntSessions");
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    const savedEntries = localStorage.getItem("bonusHuntEntries");
    const savedBalance = localStorage.getItem("bonusHuntStartBalance");
    const savedSessionName = localStorage.getItem("bonusHuntSessionName");

    if (savedEntries) {
      setBonusEntries(JSON.parse(savedEntries));
    } else {
      initializeEmptyEntries();
    }
    if (savedBalance) {
      setStartBalance(Number(savedBalance));
    }
    if (savedSessionName) {
      setSessionName(savedSessionName);
    }
    setIsLoading(false);
  }, []);

  // Sauvegarder les données dans localStorage à chaque changement
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("bonusHuntEntries", JSON.stringify(bonusEntries));
      localStorage.setItem("bonusHuntStartBalance", startBalance.toString());
      localStorage.setItem("bonusHuntSessionName", sessionName);
    }
  }, [bonusEntries, startBalance, sessionName, isLoading]);

  // Sauvegarder les sessions dans localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("bonusHuntSessions", JSON.stringify(sessions));
    }
  }, [sessions, isLoading]);

  const initializeEmptyEntries = () => {
    const emptyEntries = Array(5)
      .fill(null)
      .map(() => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        machine: "",
        mise: 0,
        gains: 0,
        multiplicateur: 0,
      }));
    setBonusEntries(emptyEntries);
  };

  const addNewEntry = () => {
    const newEntry: BonusEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      machine: "",
      mise: 0,
      gains: 0,
      multiplicateur: 0,
    };
    setBonusEntries([...bonusEntries, newEntry]);
  };
  
  const addMultipleEmptyEntries = () => {
    const newEntries = Array(3)
      .fill(null)
      .map(() => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        machine: "",
        mise: 0,
        gains: 0,
        multiplicateur: 0,
      }));
    setBonusEntries([...bonusEntries, ...newEntries]);
  };

  const removeEntry = (id: string) => {
    setBonusEntries(bonusEntries.filter((entry) => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof Omit<BonusEntry, 'id' | 'machineData'>, value: string | number) => {
    setBonusEntries(
      bonusEntries.map((entry) => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value };
          if (field === "gains" || field === "mise") {
            const mise = field === "mise" ? Number(value) : entry.mise;
            const gains = field === "gains" ? Number(value) : entry.gains;
            if (mise > 0) {
              updatedEntry.multiplicateur = Number((gains / mise).toFixed(2));
            } else {
              updatedEntry.multiplicateur = 0; // Éviter NaN si mise est 0
            }
          }
          return updatedEntry;
        }
        return entry;
      }),
    );
  };

  const handleMachineSelect = (id: string, machineName: string, machineData?: SlotMachineHit) => {
    setBonusEntries(
      bonusEntries.map((entry) => {
        if (entry.id === id) {
          return {
            ...entry,
            machine: machineName,
            machineData: machineData,
          };
        }
        return entry;
      }),
    );
  };

  const validEntries = bonusEntries.filter((entry) => entry.machine !== "" && entry.mise > 0);
  const totalMises = validEntries.reduce((sum, entry) => sum + entry.mise, 0);
  const totalGains = validEntries.reduce((sum, entry) => sum + entry.gains, 0);
  const gainBrut = totalGains;
  const gainNet = totalGains - totalMises;
  const nombreBonus = validEntries.length;
  const miseMoyenne = nombreBonus > 0 ? Number((totalMises / nombreBonus).toFixed(2)) : 0;

  const bestBonus = [...validEntries]
    .filter((entry) => entry.gains > 0)
    .sort((a, b) => b.multiplicateur - a.multiplicateur)[0];
  const worstBonus = [...validEntries]
    .filter((entry) => entry.gains > 0)
    .sort((a, b) => a.multiplicateur - b.multiplicateur)[0];

  const saveToHistory = () => {
    if (validEntries.length === 0) {
      toast({ title: "Session vide", description: "Impossible de sauvegarder une session sans bonus valides." });
      return;
    }
    const newSession: Session = {
      id: Date.now().toString(),
      name: sessionName,
      date: new Date().toISOString(),
      bonusEntries: [...bonusEntries], // Sauvegarder une copie
      startBalance,
      stats: { totalMises, totalGains, gainBrut, gainNet, nombreBonus, miseMoyenne, bestBonus, worstBonus },
    };
    setSessions([...sessions, newSession]);
    toast({ title: "Session sauvegardée", description: "Votre session a été ajoutée à l'historique." });
  };

  const loadSession = (session: Session) => {
    setBonusEntries(session.bonusEntries);
    setStartBalance(session.startBalance);
    setSessionName(session.name);
    setShowHistory(false);
    toast({ title: "Session chargée", description: `La session "${session.name}" a été chargée.` });
  };

  const saveSession = () => {
    // La sauvegarde se fait déjà via useEffect, mais on peut garder un bouton pour feedback utilisateur
    toast({ title: "Session sauvegardée", description: "Votre bonus hunt a été sauvegardé localement." });
  };

  const resetSession = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser votre bonus hunt?")) {
      initializeEmptyEntries();
      setStartBalance(0);
      setSessionName(`Session du ${new Date().toLocaleDateString()}`);
      toast({ title: "Session réinitialisée", description: "Votre bonus hunt a été réinitialisé." });
    }
  };

  const cleanEmptyEntries = () => {
    const cleanedEntries = bonusEntries.filter((entry) => entry.machine !== "" || entry.mise > 0 || entry.gains > 0);
    if (cleanedEntries.length < 3) {
      const additionalEntries = Array(3 - cleanedEntries.length).fill(null).map(() => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        machine: "", mise: 0, gains: 0, multiplicateur: 0,
      }));
      setBonusEntries([...cleanedEntries, ...additionalEntries]);
    } else {
      setBonusEntries(cleanedEntries);
    }
    toast({ title: "Nettoyage effectué", description: "Les entrées vides ont été supprimées." });
  };

  const deleteSession = (sessionId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette session?")) {
      setSessions(sessions.filter((session) => session.id !== sessionId));
      toast({ title: "Session supprimée", description: "La session a été supprimée de l'historique." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Button variant="outline" size="sm" onClick={() => setShowHistory(false)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Retour
              </Button>
              <h1 className="text-3xl font-bold text-white">Historique des sessions</h1>
            </div>
          </header>
          <SessionHistory sessions={sessions} onLoadSession={loadSession} onDeleteSession={deleteSession} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Bonus Hunt Tracker</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" /> Historique
            </Button>
          </div>
        </header>

        <div className="mb-4">
          <label className="text-sm text-slate-400 block mb-1">Nom de la session</label>
          <Input
            className="bg-slate-800/50 border-slate-700 max-w-md"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Nom de la session"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="glassmorphism-card col-span-1 lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-white">Bonus collectés</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={cleanEmptyEntries}>Nettoyer</Button>
                  <Button variant="outline" size="sm" onClick={addNewEntry}><Plus className="h-4 w-4 mr-1" /> Ajouter 1</Button>
                  <Button variant="default" size="sm" onClick={addMultipleEmptyEntries}><Plus className="h-4 w-4 mr-1" /> Ajouter 3</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* MODIFICATION: Ajout de overflow: visible au conteneur de la table pour que le dropdown ne soit pas coupé */}
              <div style={{ overflow: "visible" }}> 
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 text-slate-400 font-medium">Machine</th>
                      <th className="text-left py-3 text-slate-400 font-medium">Mise (€)</th>
                      <th className="text-left py-3 text-slate-400 font-medium">Gains (€)</th>
                      <th className="text-left py-3 text-slate-400 font-medium">Multiplicateur</th>
                      <th className="text-right py-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bonusEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-800">
                        {/* MODIFICATION: Application dynamique du z-index et passage de onOpenChange */}
                        <td 
                          className="py-3" 
                          style={{ 
                            position: "relative", 
                            zIndex: activeDropdownId === entry.id ? 50 : 1 // Augmenter si le dropdown est actif
                                                                           // Mettre une valeur plus faible (ex: 1) par défaut
                          }}
                        >
                          <AlgoliaSlotSearch
                            value={entry.machine}
                            onChange={(value, hit) => handleMachineSelect(entry.id, value, hit)}
                            placeholder="Rechercher une machine..."
                            onOpenChange={(isOpen) => { // Mise à jour de l'ID du dropdown actif
                              if (isOpen) {
                                setActiveDropdownId(entry.id);
                              } else if (activeDropdownId === entry.id) { // Ne désactiver que si c'est celui-ci qui se ferme
                                setActiveDropdownId(null);
                              }
                            }}
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            className="bg-slate-800/50 border-slate-700"
                            type="number"
                            value={entry.mise || ""}
                            onChange={(e) => updateEntry(entry.id, "mise", Number(e.target.value))}
                            placeholder="0.00"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            className="bg-slate-800/50 border-slate-700"
                            type="number"
                            value={entry.gains || ""}
                            onChange={(e) => updateEntry(entry.id, "gains", Number(e.target.value))}
                            placeholder="0.00"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3">
                          <div className="bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-center">
                            {entry.multiplicateur ? `${entry.multiplicateur}x` : "-"}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <Button onClick={addNewEntry} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span>Statistiques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Balance initiale (€)</label>
                <Input
                  className="bg-slate-800/50 border-slate-700 mt-1"
                  type="number"
                  value={startBalance || ""}
                  onChange={(e) => setStartBalance(Number(e.target.value))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <Separator className="bg-slate-700" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Gain brut</p>
                  <p className="text-xl font-bold text-white">{gainBrut.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Gain net</p>
                  <p className={`text-xl font-bold ${gainNet >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {gainNet.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Mise moyenne</p>
                  <p className="text-lg font-medium text-white">{miseMoyenne.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Nombre de bonus</p>
                  <p className="text-lg font-medium text-white">{nombreBonus}</p>
                </div>
              </div>
              <Separator className="bg-slate-700" />
              {bestBonus && (
                <div>
                  <p className="text-sm text-slate-400">Meilleur bonus</p>
                  <div className="mt-1 p-2 bg-slate-800/50 rounded-md border border-green-900/50">
                    <p className="font-medium text-white">{bestBonus.machine}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400 text-sm">Gains: {bestBonus.gains} €</span>
                      <span className="text-green-500 font-bold">{bestBonus.multiplicateur}x</span>
                    </div>
                  </div>
                </div>
              )}
              {worstBonus && (
                <div>
                  <p className="text-sm text-slate-400">Pire machine</p>
                  <div className="mt-1 p-2 bg-slate-800/50 rounded-md border border-red-900/50">
                    <p className="font-medium text-white">{worstBonus.machine}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400 text-sm">Gains: {worstBonus.gains} €</span>
                      <span className="text-red-500 font-bold">{worstBonus.multiplicateur}x</span>
                    </div>
                  </div>
                </div>
              )}
              <Tabs defaultValue="actions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <TabsContent value="actions" className="space-y-2 pt-2">
                  <Button className="w-full" onClick={saveSession}>
                    <Save className="h-4 w-4 mr-2" /> Sauvegarder
                  </Button>
                  <Button className="w-full" variant="outline" onClick={saveToHistory}>
                    <History className="h-4 w-4 mr-2" /> Ajouter à l'historique
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={resetSession}>
                    Réinitialiser
                  </Button>
                </TabsContent>
                <TabsContent value="history" className="space-y-2 pt-2">
                  <Button className="w-full" onClick={() => setShowHistory(true)}>
                    <History className="h-4 w-4 mr-2" /> Voir l'historique
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
