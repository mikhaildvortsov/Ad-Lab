'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { getAvailableNiches, type NicheType } from '@/lib/ai-instructions';
interface NicheSelectorProps {
  value: NicheType | 'all';
  onValueChange: (value: NicheType | 'all') => void;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}
export function NicheSelector({ 
  value, 
  onValueChange, 
  placeholder = "Выберите нишу",
  className = "",
  showLabel = false,
  compact = false
}: NicheSelectorProps) {
  const availableNiches = getAvailableNiches();
  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ниша бизнеса
        </label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={compact ? "w-40" : "w-48"}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все ниши</SelectItem>
          {availableNiches.map((niche) => (
            <SelectItem key={niche.value} value={niche.value}>
              {niche.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== 'all' && !compact && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">
              {availableNiches.find(n => n.value === value)?.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
export function NicheBadge({ niche }: { niche: NicheType }) {
  const availableNiches = getAvailableNiches();
  const nicheInfo = availableNiches.find(n => n.value === niche);
  if (!nicheInfo) return null;
  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Target className="h-3 w-3" />
      {nicheInfo.label}
    </Badge>
  );
}
