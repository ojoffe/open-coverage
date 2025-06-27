"use client"

import { useState } from "react"
import { Calendar, Clock, Plus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHealthProfileStore } from "@/lib/health-profile-store"

export function ScenarioSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState("")
  const {
    scenarios,
    currentScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario,
    createNewScenario,
  } = useHealthProfileStore()

  const handleSaveScenario = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName.trim())
      setScenarioName("")
      setIsOpen(false)
    }
  }

  const handleLoadScenario = (scenarioId: string) => {
    loadScenario(scenarioId)
  }

  const handleDeleteScenario = (scenarioId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this scenario?")) {
      deleteScenario(scenarioId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const currentScenario = scenarios.find(s => s.id === currentScenarioId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Health Scenario</Label>
          {currentScenario && (
            <p className="text-xs text-muted-foreground">
              Current: {currentScenario.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Scenario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Health Scenario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g., Family with diabetes, Young adult routine care"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveScenario} disabled={!scenarioName.trim()}>
                    Save Scenario
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={createNewScenario}>
            <Plus className="w-4 h-4 mr-2" />
            New Scenario
          </Button>
        </div>
      </div>

      {scenarios.length > 0 && (
        <div>
          <Select value={currentScenarioId || ""} onValueChange={handleLoadScenario}>
            <SelectTrigger>
              <SelectValue placeholder="Select a saved scenario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(scenario.createdAt)}
                        <span className="ml-2">
                          {scenario.members.length} member{scenario.members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteScenario(scenario.id, e)}
                      className="ml-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}