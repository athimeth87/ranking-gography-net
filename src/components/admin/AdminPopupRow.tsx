import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, MoreHorizontal, Edit, Trash2, MousePointerClick, Eye, CheckCircle2, XCircle } from 'lucide-react';

interface PopupProps {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string | null;
  image_url: string;
}

export function AdminPopupRow({ 
  popup, 
  onStatusChange, 
  onDelete,
  onEdit
}: { 
  popup: PopupProps;
  onStatusChange: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
  onEdit: (popup: any) => void;
}) {
  const ctr = popup.impressions > 0 ? ((popup.clicks / popup.impressions) * 100).toFixed(1) + '%' : '-';
  return (
    <div className="grid grid-cols-[80px_1fr_100px_120px_120px_180px_60px] gap-4 p-4 items-center transition-colors hover:bg-neutral-50/50 group">
      
      {/* Preview Thumbnail */}
      <div className="w-16 h-10 bg-neutral-200 overflow-hidden border border-neutral-300 relative mx-auto">
        <img src={popup.image_url} alt={popup.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
      </div>

      {/* Name */}
      <div className="font-medium text-sm text-neutral-900 truncate">
        {popup.name}
      </div>

      {/* Status */}
      <div className="flex justify-center">
        {popup.status === 'active' && (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-green-600/30 text-green-700 bg-green-50">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Active
          </Badge>
        )}
        {popup.status === 'draft' && (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-neutral-300 text-neutral-600 bg-neutral-100">
            Draft
          </Badge>
        )}
        {popup.status === 'paused' && (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-yellow-600/30 text-yellow-700 bg-yellow-50">
            <XCircle className="h-2.5 w-2.5 mr-1" /> Paused
          </Badge>
        )}
      </div>

      {/* Stats: Impressions */}
      <div className="text-right flex items-center justify-end gap-1.5 font-mono text-xs text-neutral-600">
        <Eye className="h-3 w-3 text-neutral-400" /> {popup.impressions.toLocaleString()}
      </div>

      {/* Stats: Clicks & CTR */}
      <div className="text-right flex flex-col justify-center">
        <span className="font-mono text-xs text-neutral-900 flex items-center justify-end gap-1.5">
          <MousePointerClick className="h-3 w-3 text-neutral-400" /> {popup.clicks.toLocaleString()}
        </span>
        <span className="font-mono text-[10px] text-green-600">{ctr}</span>
      </div>

      {/* Schedule */}
      <div className="flex flex-col items-center justify-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest text-center">
        <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {new Date(popup.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span className="text-neutral-300">to</span>
        <span>{popup.end_date ? new Date(popup.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No end date'}</span>
      </div>

      {/* Actions */}
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-neutral-200">
              <MoreHorizontal className="h-4 w-4 text-neutral-500" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="rounded-none font-mono text-xs uppercase tracking-wider min-w-[140px]">
            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(popup)}>
              <Edit className="mr-2 h-3.5 w-3.5" /> Edit Campaign
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Eye className="mr-2 h-3.5 w-3.5" /> Preview Popup
            </DropdownMenuItem>
            {popup.status === 'active' ? (
              <DropdownMenuItem className="cursor-pointer text-yellow-600 focus:bg-yellow-50 focus:text-yellow-700" onClick={() => onStatusChange(popup.id, 'paused')}>
                <XCircle className="mr-2 h-3.5 w-3.5" /> Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="cursor-pointer text-green-600 focus:bg-green-50 focus:text-green-700" onClick={() => onStatusChange(popup.id, 'active')}>
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 border-t mt-1 pt-1" onClick={() => onDelete(popup.id)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
