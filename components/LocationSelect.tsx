"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// 地方別都道府県データ
const REGIONS = {
  東北: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  関東: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  中部: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  関西: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  中国: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  四国: ["徳島県", "香川県", "愛媛県", "高知県"],
  九州: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  その他: ["その他"],
}

interface LocationSelectProps {
  label: string
  name: string
  value?: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

export default function LocationSelect({
  label,
  name,
  value = "",
  onChange,
  required = false,
  placeholder = "選択してください",
}: LocationSelectProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [availablePrefectures, setAvailablePrefectures] = useState<string[]>([])

  // 初期値がある場合、対応する地方を見つける
  useEffect(() => {
    if (value) {
      for (const [region, prefectures] of Object.entries(REGIONS)) {
        if (prefectures.includes(value)) {
          setSelectedRegion(region)
          setAvailablePrefectures(prefectures)
          break
        }
      }
    }
  }, [value])

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    setAvailablePrefectures(REGIONS[region as keyof typeof REGIONS] || [])
    // 地方が変更されたら都道府県選択をリセット
    onChange("")
  }

  const handlePrefectureChange = (prefecture: string) => {
    onChange(prefecture)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${name}-region`}>
          {label}の地方{required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={selectedRegion} onValueChange={handleRegionChange}>
          <SelectTrigger id={`${name}-region`}>
            <SelectValue placeholder="地方を選択してください" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(REGIONS).map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRegion && (
        <div>
          <Label htmlFor={name}>
            {label}の都道府県{required && <span className="text-red-500">*</span>}
          </Label>
          <Select value={value} onValueChange={handlePrefectureChange}>
            <SelectTrigger id={name}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {availablePrefectures.map((prefecture) => (
                <SelectItem key={prefecture} value={prefecture}>
                  {prefecture}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
