"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
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
  "リモート希望",
]

const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "PHP",
  "Ruby",
  "AWS",
  "Docker",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "GraphQL",
  "REST API",
]

const JOB_TYPES = [
  "すべて",
  "フロントエンドエンジニア",
  "バックエンドエンジニア",
  "フルスタックエンジニア",
  "モバイルエンジニア",
  "インフラエンジニア",
  "DevOpsエンジニア",
  "データエンジニア",
  "機械学習エンジニア",
  "QAエンジニア",
  "プロダクトマネージャー",
  "プロジェクトマネージャー",
  "UI/UXデザイナー",
  "Webデザイナー",
]

const EXPERIENCE_YEARS = ["すべて", "1年未満", "1〜2年", "3〜5年", "5〜10年", "10年以上"]

export interface CompanyFilterCriteria {
  location?: string
  skills?: string[]
  jobType?: string
  experienceYears?: string
}

interface CompanyFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (criteria: CompanyFilterCriteria) => void
  currentCriteria: CompanyFilterCriteria
}

export default function CompanyFilterModal({ isOpen, onClose, onApply, currentCriteria }: CompanyFilterModalProps) {
  const [location, setLocation] = useState<string>(currentCriteria.location || "すべて")
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentCriteria.skills || [])
  const [jobType, setJobType] = useState<string>(currentCriteria.jobType || "すべて")
  const [experienceYears, setExperienceYears] = useState<string>(currentCriteria.experienceYears || "すべて")

  const handleSkillChange = (skill: string, checked: boolean) => {
    if (checked) {
      setSelectedSkills([...selectedSkills, skill])
    } else {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    }
  }

  const handleApply = () => {
    const criteria: CompanyFilterCriteria = {
      location: location === "すべて" ? undefined : location,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      jobType: jobType === "すべて" ? undefined : jobType,
      experienceYears: experienceYears === "すべて" ? undefined : experienceYears,
    }
    onApply(criteria)
    onClose()
  }

  const handleReset = () => {
    setLocation("すべて")
    setSelectedSkills([])
    setJobType("すべて")
    setExperienceYears("すべて")
    onApply({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            人材絞り込み条件
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          {/* 経験職種 */}
          <div className="space-y-2">
            <Label htmlFor="jobType">経験職種</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="職種を選択" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 実務経験 */}
          <div className="space-y-2">
            <Label htmlFor="experienceYears">実務経験</Label>
            <Select value={experienceYears} onValueChange={setExperienceYears}>
              <SelectTrigger>
                <SelectValue placeholder="実務経験を選択" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_YEARS.map((exp) => (
                  <SelectItem key={exp} value={exp}>
                    {exp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 所持スキル */}
          <div className="space-y-2">
            <Label>所持スキル</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {SKILLS.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={(checked) => handleSkillChange(skill, checked as boolean)}
                  />
                  <Label htmlFor={skill} className="text-sm font-normal cursor-pointer">
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-gray-500">{selectedSkills.length}個のスキルを選択中</p>
            )}
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
