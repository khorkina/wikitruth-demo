import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientStorage, type LocalHighlight } from '@/lib/storage';

interface TextHighlighterProps {
  content: string;
  comparisonId: string | number;
  formatContent: (content: string) => string;
}

const HIGHLIGHT_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-200 dark:bg-yellow-900/50', class: 'rgba(254, 240, 138, 0.7)' },
  { name: 'green', bg: 'bg-green-200 dark:bg-green-900/50', class: 'rgba(187, 247, 208, 0.7)' },
  { name: 'blue', bg: 'bg-blue-200 dark:bg-blue-900/50', class: 'rgba(191, 219, 254, 0.7)' },
  { name: 'pink', bg: 'bg-pink-200 dark:bg-pink-900/50', class: 'rgba(251, 207, 232, 0.7)' },
  { name: 'orange', bg: 'bg-orange-200 dark:bg-orange-900/50', class: 'rgba(254, 215, 170, 0.7)' },
];

function getColorBg(colorName: string): string {
  const color = HIGHLIGHT_COLORS.find(c => c.name === colorName);
  return color ? color.bg : 'bg-yellow-200';
}

export function TextHighlighter({ content, comparisonId, formatContent }: TextHighlighterProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const comparisonIdStr = String(comparisonId);

  const { data: highlights = [] } = useQuery<LocalHighlight[]>({
    queryKey: ['highlights', comparisonIdStr],
    queryFn: async () => {
      return clientStorage.getHighlightsByComparisonId(comparisonIdStr);
    },
    enabled: !!comparisonId,
  });

  const createHighlightMutation = useMutation({
    mutationFn: async (data: { startOffset: number; endOffset: number; color: string; excerpt: string }) => {
      return clientStorage.saveHighlight({
        comparisonId: comparisonIdStr,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights', comparisonIdStr] });
      toast({
        title: 'Highlight saved',
        description: 'Your highlight has been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save highlight.',
        variant: 'destructive',
      });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      return clientStorage.deleteHighlight(highlightId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights', comparisonIdStr] });
      toast({
        title: 'Highlight removed',
        description: 'Your highlight has been removed.',
      });
    },
  });

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setShowColorPicker(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      setShowColorPicker(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = contentRef.current;
    
    if (!container.contains(range.commonAncestorContainer)) {
      setShowColorPicker(false);
      return;
    }

    const startOffset = content.indexOf(text);
    if (startOffset === -1) {
      setShowColorPicker(false);
      return;
    }

    const endOffset = startOffset + text.length;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    setSelectedText(text);
    setSelectionRange({ start: startOffset, end: endOffset });
    setColorPickerPosition({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
    });
    setShowColorPicker(true);
  }, [content]);

  const handleColorSelect = (color: string) => {
    if (!selectionRange || !selectedText) return;

    createHighlightMutation.mutate({
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      color,
      excerpt: selectedText.substring(0, 100),
    });

    setShowColorPicker(false);
    setSelectedText('');
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteHighlight = (highlightId: string) => {
    deleteHighlightMutation.mutate(highlightId);
  };

  const renderContentWithHighlights = () => {
    if (!highlights || highlights.length === 0) {
      return formatContent(content);
    }

    const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
    
    let result = '';
    let lastIndex = 0;

    for (const highlight of sortedHighlights) {
      if (highlight.startOffset >= content.length) continue;
      
      const actualEnd = Math.min(highlight.endOffset, content.length);
      
      if (highlight.startOffset > lastIndex) {
        result += content.substring(lastIndex, highlight.startOffset);
      }

      const highlightedText = content.substring(highlight.startOffset, actualEnd);
      const colorClass = getColorBg(highlight.color);
      result += `<mark class="${colorClass} px-0.5 rounded cursor-pointer" data-highlight-id="${highlight.id}" title="Click to remove">${highlightedText}</mark>`;
      
      lastIndex = actualEnd;
    }

    if (lastIndex < content.length) {
      result += content.substring(lastIndex);
    }

    return formatContent(result);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'MARK' && target.dataset.highlightId) {
        const highlightId = target.dataset.highlightId;
        if (highlightId) {
          handleDeleteHighlight(highlightId);
        }
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('click', handleClick);
      return () => container.removeEventListener('click', handleClick);
    }
  }, []);

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Highlighter className="h-4 w-4" />
        <span>Select text to highlight it. Click on a highlight to remove it.</span>
      </div>
      
      <div
        ref={contentRef}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        className="prose prose-slate max-w-none markdown-content text-sm md:text-base"
      >
        <div 
          className="formatted-content comparison-content leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderContentWithHighlights() }}
        />
      </div>

      {showColorPicker && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2"
          style={{
            left: `${colorPickerPosition.x}px`,
            top: `${colorPickerPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorSelect(color.name)}
                className={`w-7 h-7 rounded-full ${color.bg} border-2 border-transparent hover:border-gray-400 dark:hover:border-gray-300 transition-all hover:scale-110`}
                title={color.name}
                data-testid={`color-${color.name}`}
              />
            ))}
            <button
              onClick={() => setShowColorPicker(false)}
              className="ml-1 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {highlights && highlights.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Highlights ({highlights.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                className={`flex items-start gap-2 p-2 rounded ${getColorBg(highlight.color)}`}
              >
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                  "{highlight.excerpt}"
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleDeleteHighlight(highlight.id)}
                  data-testid={`delete-highlight-${highlight.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
