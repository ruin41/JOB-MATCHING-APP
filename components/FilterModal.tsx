"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X } from "lucide-react"

const LOCATIONS = [
  "すべて",
  "東京",
  "大阪",
  "名古屋",
  "福岡",
  "札幌",
  "仙台",
  "広島",
  "京都",
  "神戸",
  "横浜",
  "リモート",
]

export interface FilterCriteria {
  minSalary?: number
  location?: string
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (criteria: FilterCriteria) => void
  currentCriteria: FilterCriteria
}

export default function FilterModal({ isOpen, onClose, onApply, currentCriteria }: FilterModalProps) {
  const [minSalary, setMinSalary] = useState<string>(currentCriteria.minSalary?.toString() || "")
  const [location, setLocation] = useState<string>(currentCriteria.location || "すべて")

  const handleApply = () => {
    const criteria: FilterCriteria = {
      minSalary: minSalary ? Number.parseInt(minSalary) * 10000 : undefined, // Convert to yen
      location: location === "すべて" ? undefined : location,
    }
    onApply(criteria)
    onClose()
  }

  const handleReset = () => {
    setMinSalary("")
    setLocation("すべて")
    onApply({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            絞り込み条件
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 希望年収 */}
          <div className="space-y-2">
            <Label htmlFor="minSalary">希望年収（万円以上）</Label>
            <Input
              id="minSalary"
              type="number"
              placeholder="例: 500"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              min="0"
              step="50"
            />
            <p className="text-xs text-gray-500">年収の下限を万円単位で入力してください</p>
          </div>

          {/* 希望勤務地 */}
          <div className="space-y-2">
            <Label htmlFor="location">希望勤務地</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="勤務地を選択" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            リセット
          </Button>
          <Button onClick={handleApply} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
            適用する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
