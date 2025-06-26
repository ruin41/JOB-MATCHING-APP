"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 47都道府県のリスト
const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
]

interface SimpleLocationSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  name?: string
  disabled?: boolean
}

export function SimpleLocationSelect({
  label,
  value,
  onChange,
  required = false,
  placeholder = "選択してください",
  name,
  disabled = false,
}: SimpleLocationSelectProps) {
  return (
    <div>
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} name={name} required={required} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {PREFECTURES.map((prefecture) => (
            <SelectItem key={prefecture} value={prefecture}>
              {prefecture}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// デフォルトエクスポートも追加（互換性のため）
export default SimpleLocationSelect
