"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, TrendingUp, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface BonusEntry {
  id: string
  machine: string
  mise: number
  gains: number
  multiplicateur: number
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

interface SessionHistoryProps {
  sessions: Session[]
  onLoadSession: (session: Session) => void
  onDeleteSession: (sessionId: string) => void
}

export default function SessionHistory({ sessions, onLoadSession, onDeleteSession }: SessionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "name" | "profit" | "loss">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtrer les sessions en fonction du terme de recherche
  const filteredSessions = sessions.filter(
    (session) =>
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.bonusEntries.some((entry) => entry.machine.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Trier les sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortBy === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortBy === "profit") {
      return sortDirection === "asc" ? a.stats.gainNet - b.stats.gainNet : b.stats.gainNet - a.stats.gainNet
    } else if (sortBy === "loss") {
      return sortDirection === "asc" ? b.stats.gainNet - a.stats.gainNet : a.stats.gainNet - b.stats.gainNet
    }
    return 0
  })

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`
  }

  // Fonction pour changer le tri
  const toggleSort = (newSortBy: "date" | "name" | "profit" | "loss") => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortDirection("desc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            className="pl-10 bg-slate-800/50 border-slate-700"
            placeholder="Rechercher par nom ou machine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant={sortBy === "date" ? "default" : "outline"} size="sm" onClick={() => toggleSort("date")}>
            <Calendar className="h-4 w-4 mr-1" />
            Date {sortBy === "date" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
          <Button variant={sortBy === "name" ? "default" : "outline"} size="sm" onClick={() => toggleSort("name")}>
            Nom {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
          <Button variant={sortBy === "profit" ? "default" : "outline"} size="sm" onClick={() => toggleSort("profit")}>
            <TrendingUp className="h-4 w-4 mr-1" />
            Profit {sortBy === "profit" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
        </div>
      </div>

      {sortedSessions.length === 0 ? (
        <Card className="glassmorphism-card">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Aucune session trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSessions.map((session) => (
            <Card key={session.id} className="glassmorphism-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-white">{session.name}</CardTitle>
                <p className="text-sm text-slate-400">{formatDate(session.date)}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Nombre de bonus</p>
                    <p className="text-sm font-medium text-white">{session.stats.nombreBonus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mise moyenne</p>
                    <p className="text-sm font-medium text-white">{session.stats.miseMoyenne} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Gain brut</p>
                    <p className="text-sm font-medium text-white">{session.stats.gainBrut.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Gain net</p>
                    <p
                      className={`text-sm font-medium ${
                        session.stats.gainNet >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {session.stats.gainNet.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex flex-col gap-2">
                  {session.stats.bestBonus && (
                    <div className="text-xs">
                      <span className="text-slate-400">Meilleur bonus:</span>{" "}
                      <span className="text-white">{session.stats.bestBonus.machine}</span>{" "}
                      <span className="text-green-500 font-bold">({session.stats.bestBonus.multiplicateur}x)</span>
                    </div>
                  )}

                  <div className="text-xs">
                    <span className="text-slate-400">Machines:</span>{" "}
                    <span className="text-white">
                      {session.bonusEntries
                        .filter((entry) => entry.machine !== "")
                        .slice(0, 3)
                        .map((entry) => entry.machine)
                        .join(", ")}
                      {session.bonusEntries.filter((entry) => entry.machine !== "").length > 3 && "..."}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => onLoadSession(session)}>
                    Charger
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onDeleteSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
